/**
 * Lead-request service — orchestrates the NL request lifecycle:
 * plan (run the Planner) → estimate credits → confirm (reserve + enqueue) → cancel.
 */
import { prisma } from "@/lib/prisma";
import { runPlanner } from "@/ai/agents/planner";
import { getCentralLLMClient } from "@/ai/client";
import { reserveCredits } from "@/lib/credits/service";
import { releaseLeadRequestHold } from "@/lib/nl-pipeline/reconcile";
import { creditsForQualifiedLeads, TRIAL_LEADS } from "@/lib/credits/rates";
import { getLeadDiscoveryQueue } from "@/workers/queues";
import type { ResolvedPlan, PlannerDecision } from "@/ai/criteria/types";

/** Run the Planner for a request (fresh or after clarifications). */
export async function planForRequest(args: {
  organizationId: string;
  rawQuery: string;
  clarifications?: Array<{ question: string; answer: string }>;
  round?: number;
  desiredLeads?: number;
}): Promise<PlannerDecision> {
  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId: args.organizationId },
  });
  if (!profile) throw new Error("Business profile not configured");

  const { client } = getCentralLLMClient("planner");
  return runPlanner(client, {
    rawQuery: args.rawQuery,
    clarifications: args.clarifications,
    round: args.round,
    desiredLeads: args.desiredLeads,
    profile: {
      companyName: profile.companyName,
      serviceOffered: profile.serviceOffered,
      icpDescription: profile.icpDescription,
      businessDetails: profile.businessDetails ?? undefined,
      targetGeographies: profile.targetGeographies,
      targetIndustries: profile.targetIndustries,
    },
  });
}

/**
 * Pre-run credit HOLD (the reservation ceiling). The run bills the customer for
 * qualified leads DELIVERED at the published rate (≈2 leads/credit), so the most
 * a run can ever charge is the cost of delivering the FULL requested count. We
 * reserve exactly that — an exact ceiling, not a COGS guess — and reconcile
 * releases whatever isn't delivered.
 */
export function estimateForPlan(plan: ResolvedPlan): number {
  return Math.max(1, creditsForQualifiedLeads(plan.maxResults));
}

export type ConfirmResult =
  | { ok: true; leadListId: string }
  | {
      ok: false;
      reason: "not_found" | "no_plan" | "insufficient_credits" | "subscription_required";
      balance?: number;
      needed?: number;
      trialRemaining?: number;
    };

/** Reserve credits, create the LeadList, and enqueue criteria-aware discovery. */
export async function confirmRequest(organizationId: string, leadRequestId: string): Promise<ConfirmResult> {
  const lr = await prisma.leadRequest.findFirst({ where: { id: leadRequestId, organizationId } });
  if (!lr) return { ok: false, reason: "not_found" };
  if (!lr.plan) return { ok: false, reason: "no_plan" };
  if (lr.leadListId) return { ok: true, leadListId: lr.leadListId }; // idempotent

  let plan = lr.plan as unknown as ResolvedPlan;

  // ── No-subscription trial gate ──────────────────────────────────────────────
  // Non-subscribers can generate up to TRIAL_LEADS leads on credits alone; beyond
  // that an active subscription is required. Cap this run to the trial remainder.
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, subscriptionStatus: true, trialLeadsUsed: true },
  });
  const subscribed = !!org && org.plan !== "FREE" && org.subscriptionStatus === "active";
  if (!subscribed) {
    const remaining = TRIAL_LEADS - (org?.trialLeadsUsed ?? 0);
    if (remaining <= 0) {
      return { ok: false, reason: "subscription_required", trialRemaining: 0 };
    }
    if (plan.maxResults > remaining) {
      plan = {
        ...plan,
        maxResults: remaining,
        params: { ...plan.params, maxResults: remaining },
        estimatedResults: Math.min(plan.estimatedResults, remaining),
      };
    }
  }

  const estimate = estimateForPlan(plan);

  const reserve = await reserveCredits(organizationId, estimate, { refType: "lead_request", refId: lr.id });
  if (!reserve.ok) {
    return { ok: false, reason: "insufficient_credits", balance: reserve.balance, needed: estimate };
  }

  const list = await prisma.leadList.create({
    data: {
      organizationId,
      name: lr.rawQuery.slice(0, 80) || "Lead search",
      description: plan.humanSummary,
      status: "QUEUED",
      jobStatus: "queued",
      targetQualified: plan.maxResults,
    },
  });

  await prisma.leadRequest.update({
    where: { id: lr.id },
    data: { status: "CONFIRMED", leadListId: list.id, heldCredits: estimate, estimatedCredits: estimate, plan: plan as never },
  });

  await getLeadDiscoveryQueue().add(
    "lead-discovery",
    { organizationId, leadListId: list.id, leadRequestId: lr.id, mode: "nl", leadsPerRun: plan.maxResults },
    { jobId: list.id }
  );

  return { ok: true, leadListId: list.id };
}

export async function cancelRequest(organizationId: string, leadRequestId: string): Promise<{ ok: boolean }> {
  const lr = await prisma.leadRequest.findFirst({ where: { id: leadRequestId, organizationId } });
  if (!lr) return { ok: false };
  await releaseLeadRequestHold(lr.id, organizationId, "CANCELLED");
  return { ok: true };
}
