import { prisma } from "@/lib/prisma";
import { getLeadDiscoveryQueue } from "@/workers/queues";
import { fireWebhookEvent } from "@/lib/webhooks";
import { MAX_DISCOVERY_ROUNDS } from "@/ai/config";
import { reconcileLeadRequest } from "@/lib/nl-pipeline/reconcile";

type Logger = (msg: string, level?: "info" | "success" | "error" | "tool") => Promise<void>;

/**
 * Called whenever a lead finishes the pipeline (qualified + personalized, or
 * disqualified/deleted). Once no leads are still in flight:
 *   - qualified >= target  → mark the list READY (done)
 *   - qualified <  target  → run ANOTHER discovery round (top-up), fetching
 *                            progressively more, until target / cap / exhaustion.
 *
 * This is the single trigger point shared by the qualification and
 * personalization processors.
 */
export async function finalizeOrTopUp(
  leadListId: string,
  organizationId: string,
  log: Logger
): Promise<void> {
  // Still work in flight? (leads being researched, or qualified leads whose
  // email copy hasn't been written yet)
  const [researchingCount, pendingPersonalization] = await Promise.all([
    prisma.lead.count({ where: { leadListId, status: "RESEARCHING" } }),
    prisma.lead.count({
      where: { leadListId, status: "QUALIFIED", outreachCopies: { none: {} } },
    }),
  ]);
  if (researchingCount > 0 || pendingPersonalization > 0) return;

  const list = await prisma.leadList.findUnique({
    where: { id: leadListId },
    select: { status: true, targetQualified: true, discoveryRound: true },
  });
  if (!list || list.status === "READY") return;

  const qualified = await prisma.lead.count({ where: { leadListId, status: "QUALIFIED" } });
  const target = list.targetQualified ?? 0;

  const nlRequest = await prisma.leadRequest.findUnique({
    where: { leadListId },
    select: { id: true },
  });

  // ── Short of target → trigger another discovery round (top-up loop) ───────
  // Applies to BOTH NL and legacy runs: keep going (one Apify call per round,
  // rotating the search area each round) until the target is met or the round cap.
  if (target > 0 && qualified < target && list.discoveryRound < MAX_DISCOVERY_ROUNDS) {
    // Atomic round bump so only ONE concurrent finalizer triggers the next round.
    const bumped = await prisma.leadList.updateMany({
      where: { id: leadListId, discoveryRound: list.discoveryRound, status: { not: "READY" } },
      data: {
        discoveryRound: list.discoveryRound + 1,
        status: "RESEARCHING",
        jobStatus: "discovering_leads",
      },
    });
    if (bumped.count === 1) {
      const nextRound = list.discoveryRound + 1;
      await log(
        `Have ${qualified}/${target} leads so far — searching for more (round ${nextRound})...`,
        "info"
      );
      await getLeadDiscoveryQueue().add(
        "lead-discovery",
        nlRequest
          ? { organizationId, leadListId, mode: "nl", leadRequestId: nlRequest.id, leadsPerRun: target, round: nextRound }
          : { organizationId, leadListId, leadsPerRun: target, round: nextRound },
        { jobId: `discover-${leadListId}-r${nextRound}` }
      );
    }
    return;
  }

  // ── Done: reached the target, or hit the round cap ────────────────────────
  await markListReady(leadListId, organizationId, qualified, target, log);
}

/**
 * Mark a lead list READY and fire the completion webhook. Idempotent — safe if
 * another worker already finalized it.
 */
export async function markListReady(
  leadListId: string,
  organizationId: string,
  qualified: number,
  target: number,
  log: Logger
): Promise<void> {
  const list = await prisma.leadList.findUnique({
    where: { id: leadListId },
    select: { status: true },
  });
  if (list?.status === "READY") return;

  const totalLeads = await prisma.lead.count({ where: { leadListId } });
  await prisma.leadList.update({
    where: { id: leadListId },
    data: { status: "READY", jobStatus: "complete", totalLeads, qualifiedLeads: qualified },
  });

  const message =
    target > 0 && qualified < target
      ? `${qualified} of ${target} requested qualified leads found — no more matching leads with valid contact details are available. Broaden the ICP or location for more.`
      : `${qualified} qualified leads with personalised outreach are ready.`;
  await log(`🎉 Pipeline complete! ${message}`, "success");

  await fireWebhookEvent(organizationId, "lead_list.generation_complete", {
    leadListId,
    totalLeads,
    qualifiedLeads: qualified,
  }).catch(() => null);

  // NL runs: charge actual COGS against the reserved hold, release the rest,
  // and flip the LeadRequest to READY_FOR_REVIEW. No-op for legacy lists.
  await reconcileLeadRequest(leadListId, organizationId).catch(() => null);
}
