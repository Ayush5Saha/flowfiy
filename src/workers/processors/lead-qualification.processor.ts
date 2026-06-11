/**
 * Queue: lead-qualification
 *
 * Stage 3 of the 4-queue pipeline. For each lead:
 *   1. Loads the LeadResearch record from stage 2
 *   2. Runs the Qualification agent (Claude Haiku) — scores 0-100
 *   3. Updates Lead.status → QUALIFIED or DISQUALIFIED
 *   4. Updates LeadResearch with qualification signals
 *   5. If QUALIFIED: fires webhook + enqueues lead-personalization
 *   6. If all leads for this list are done: finalizes the LeadList
 *
 * Runs at concurrency=10.
 * Idempotent: if Lead.status is already QUALIFIED/DISQUALIFIED, skips.
 */
import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { getClaudeClientForOrg } from "@/ai/client";
import { incrementTokenUsage } from "@/lib/usage";
import { runQualification } from "@/ai/agents/qualification";
import { fireWebhookEvent } from "@/lib/webhooks";
import { appendLog } from "@/lib/job-logs";
import { getLeadPersonalizationQueue } from "@/workers/queues";
import { INPUT_LIMITS } from "@/ai/config";

export interface LeadQualificationJobData {
  organizationId: string;
  leadListId: string;
  leadId: string;
}

export async function processLeadQualification(job: Job<LeadQualificationJobData>) {
  const { organizationId, leadListId, leadId } = job.data;

  const log = (msg: string, level: "info" | "success" | "error" | "tool" = "info") =>
    appendLog(leadListId, msg, level);

  // ── Idempotency: skip if already qualified/disqualified ───────────────────
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      organizationId: true,
      firstName: true,
      lastName: true,
      title: true,
      email: true,
      companyName: true,
      companyWebsite: true,
      companySize: true,
      industry: true,
      status: true,
    },
  });

  if (!lead) {
    // Lead was likely deleted (disqualified in a prior attempt). Nothing to do
    // except advance list finalization.
    await checkFinalization(leadListId, organizationId, log);
    return;
  }
  if (lead.organizationId !== organizationId) {
    throw new Error(`Lead ${leadId} access denied.`);
  }

  if (lead.status !== "RESEARCHING") {
    // Already processed — check finalization and exit
    await checkFinalization(leadListId, organizationId, log);
    return;
  }

  // ── Contact-quality gate ──────────────────────────────────────────────────
  // Only leads with proper contact details (a real email AND a website) can be
  // qualified — we can't run outreach without them. Drop the rest before
  // spending an AI call on them (disqualified leads are deleted).
  if (!lead.email || !lead.companyWebsite) {
    await log(
      `🔴 ${lead.companyName ?? "Lead"} — missing ${!lead.email ? "email" : "website"}, removing (insufficient contact details).`,
      "info"
    );
    await prisma.lead.delete({ where: { id: leadId } }).catch(() => null);
    await checkFinalization(leadListId, organizationId, log);
    return;
  }

  // ── Load research + ICP context ───────────────────────────────────────────
  const [research, businessProfile] = await Promise.all([
    prisma.leadResearch.findUnique({
      where: { leadId },
      select: { companyAnalysis: true, researchMetadata: true },
    }),
    prisma.businessProfile.findUnique({
      where: { organizationId },
      select: {
        icpDescription: true,
        icpAnalysisCache: true,
        targetIndustries: true,
        serviceOffered: true,
        painPointsSolved: true,
      },
    }),
  ]);

  const icpCache = businessProfile?.icpAnalysisCache as Record<string, unknown> | null;

  const icpSummary = icpCache
    ? `Target industries: ${businessProfile?.targetIndustries.join(", ")}. ${businessProfile?.icpDescription ?? ""}`
    : (businessProfile?.icpDescription ?? "");

  const qualificationCriteria =
    (icpCache?.qualificationCriteria as string | undefined) ??
    `Score based on: industry match, company size fit, title relevance, and observable growth/pain signals. Leads scoring 60+ qualify.`;

  const companyAnalysis = (research?.companyAnalysis ?? {}) as Record<string, unknown>;

  // ── Run Qualification Agent (Haiku) ───────────────────────────────────────
  const { client, mode: runMode } = await getClaudeClientForOrg(organizationId);

  const scoreLabel = (score: number) => score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";

  let result: Awaited<ReturnType<typeof runQualification>>;
  try {
    result = await runQualification(client, {
      lead: {
        firstName: lead.firstName ?? undefined,
        lastName: lead.lastName ?? undefined,
        title: lead.title ?? undefined,
        companyName: lead.companyName ?? undefined,
        companySize: lead.companySize ?? undefined,
        industry: lead.industry ?? undefined,
      },
      companyAnalysis,
      icpSummary: icpSummary.slice(0, INPUT_LIMITS.icpSummary),
      qualificationCriteria: qualificationCriteria.slice(0, INPUT_LIMITS.qualificationCriteria),
      serviceOffered: (businessProfile?.serviceOffered ?? "").slice(0, INPUT_LIMITS.serviceOffered) || undefined,
      painPointsSolved: (businessProfile?.painPointsSolved ?? "").slice(0, INPUT_LIMITS.painPointsSolved) || undefined,
    }, runMode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const maxAttempts = job.opts.attempts ?? 3;
    if ((job.attemptsMade ?? 0) < maxAttempts - 1) {
      // Transient — let BullMQ retry this lead.
      await log(`⚠️ Qualification failed for ${lead.companyName ?? "lead"} (will retry): ${msg}`, "error");
      throw err;
    }
    // Final attempt — degrade to a terminal state so the list can finalize
    // instead of hanging in RESEARCHING. Don't auto-qualify unvetted leads.
    await log(`❌ Qualification failed for ${lead.companyName ?? "lead"} after ${maxAttempts} attempts: ${msg}. Marking disqualified.`, "error");
    result = {
      score: 0,
      qualified: false,
      primaryReason: "AI scoring unavailable (LLM error)",
      bestAngle: "",
      painPointMatch: "",
      personalizationHooks: [],
      serviceGaps: [],
    };
  }

  // ── Disqualified → delete entirely (deliver only qualified leads) ─────────
  // Per product decision: the list should contain only qualified leads. The
  // lead (and its cascade-linked research) is removed so it never appears in
  // the deliverable list. Token usage for the work done is still counted.
  if (!result.qualified) {
    await log(
      `🔴 ${lead.companyName ?? "Lead"} — score ${result.score}/100 → not a fit (${result.primaryReason || "below threshold"}). Removed.`,
      "info"
    );
    if (runMode === "CENTRAL") await incrementTokenUsage(organizationId, 450).catch(() => null);
    await prisma.lead.delete({ where: { id: leadId } }).catch(() => null); // cascade removes LeadResearch
    await checkFinalization(leadListId, organizationId, log);
    return;
  }

  // ── Qualified → persist + enrich research, then personalize ───────────────
  await log(
    `${scoreLabel(result.score)} ${lead.companyName ?? "Lead"} — score ${result.score}/100 → QUALIFIED`,
    "success"
  );

  await Promise.all([
    prisma.lead.update({
      where: { id: leadId },
      data: { status: "QUALIFIED", qualificationScore: result.score },
    }),
    prisma.leadResearch.update({
      where: { leadId },
      data: {
        opportunityAngle: result.bestAngle,
        painPointMatch: result.painPointMatch,
        personalizationNotes: result.personalizationHooks.join(" | "),
        researchMetadata: {
          ...((research?.researchMetadata as Record<string, unknown> | null) ?? {}),
          score: result.score,
          hooks: result.personalizationHooks,
          serviceGaps: result.serviceGaps ?? [],
        } as never,
      },
    }).catch(() => {
      // LeadResearch may not exist if research stage was skipped (no website)
      return prisma.leadResearch.upsert({
        where: { leadId },
        update: {
          opportunityAngle: result.bestAngle,
          painPointMatch: result.painPointMatch,
          personalizationNotes: result.personalizationHooks.join(" | "),
          researchMetadata: { score: result.score, hooks: result.personalizationHooks, serviceGaps: result.serviceGaps ?? [] } as never,
        },
        create: {
          leadId,
          organizationId,
          companyAnalysis: {} as never,
          opportunityAngle: result.bestAngle,
          painPointMatch: result.painPointMatch,
          personalizationNotes: result.personalizationHooks.join(" | "),
          researchMetadata: { score: result.score, hooks: result.personalizationHooks, serviceGaps: result.serviceGaps ?? [] } as never,
        },
      });
    }),
  ]);

  if (runMode === "CENTRAL") {
    await incrementTokenUsage(organizationId, 450).catch(() => null);
  }

  await fireWebhookEvent(organizationId, "lead.qualified", {
    leadId,
    score: result.score,
    bestAngle: result.bestAngle,
    painPointMatch: result.painPointMatch,
  }).catch(() => null); // non-blocking

  await getLeadPersonalizationQueue().add(
    "lead-personalization",
    { organizationId, leadListId, leadId },
    { jobId: `personalize-${leadId}` }
  );
}

// ─── Finalization check ───────────────────────────────────────────────────────
//
// Called after a DISQUALIFIED lead is saved. If all leads are done
// (none RESEARCHING, none awaiting personalization), mark the list READY.

async function checkFinalization(
  leadListId: string,
  organizationId: string,
  log: (msg: string, level?: "info" | "success" | "error" | "tool") => Promise<void>
) {
  const [researchingCount, pendingPersonalizationCount] = await Promise.all([
    prisma.lead.count({ where: { leadListId, status: "RESEARCHING" } }),
    prisma.lead.count({
      where: {
        leadListId,
        status: "QUALIFIED",
        outreachCopies: { none: {} }, // qualified but email not yet generated
      },
    }),
  ]);

  if (researchingCount > 0 || pendingPersonalizationCount > 0) return;

  // All leads processed — finalize
  const [totalLeads, qualifiedLeads] = await Promise.all([
    prisma.lead.count({ where: { leadListId } }),
    prisma.lead.count({ where: { leadListId, status: "QUALIFIED" } }),
  ]);

  const list = await prisma.leadList.findUnique({
    where: { id: leadListId },
    select: { status: true },
  });

  // Guard: don't overwrite if already READY (another worker beat us to it)
  if (list?.status === "READY") return;

  await prisma.leadList.update({
    where: { id: leadListId },
    data: {
      status: "READY",
      jobStatus: "complete",
      totalLeads,
      qualifiedLeads,
    },
  });

  await log(
    `Pipeline complete! ${totalLeads} leads processed, ${qualifiedLeads} qualified with personalised outreach ready.`,
    "success"
  );

  // Fire completion webhook
  await fireWebhookEvent(organizationId, "lead_list.generation_complete", {
    leadListId,
    totalLeads,
    qualifiedLeads,
  }).catch(() => null);

  void organizationId;
}
