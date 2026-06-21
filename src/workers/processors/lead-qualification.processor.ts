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
import { getCentralLLMClient } from "@/ai/client";
import { incrementTokenUsage } from "@/lib/usage";
import { runQualification } from "@/ai/agents/qualification";
import { icpMinScore, icpSummary as buildIcpSummary, type IcpAnswers } from "@/lib/icp";
import { fireWebhookEvent } from "@/lib/webhooks";
import { appendLog } from "@/lib/job-logs";
import { getLeadPersonalizationQueue } from "@/workers/queues";
import { finalizeOrTopUp } from "@/lib/pipeline-finalization";
import { INPUT_LIMITS } from "@/ai/config";
import type { ResolvedPlan, Predicate } from "@/ai/criteria/types";

/** Render the planner's criteria as plain-English conditions for the LLM scorer.
 *  Only JUDGE-tier predicates are returned: `source` is applied at query time and
 *  `attribute`/`signal` predicates were already evaluated deterministically in
 *  discovery, so re-judging them here is redundant and error-prone (the LLM lacks
 *  the raw value and flips negatives like "must NOT have a website"). */
function describeConditions(plan: ResolvedPlan): string {
  const fmt = (v: unknown): string =>
    Array.isArray(v) ? v.map(String).join(", ") : v === undefined || v === null ? "" : String(v);
  return (plan.criteria ?? [])
    .filter((p: Predicate) => p.evaluator === "judge")
    .map((p: Predicate) => {
      const must = p.hard ? "MUST match" : "nice-to-have";
      const label = (p.why && p.why.trim()) || `${p.field} ${p.op} ${fmt(p.value)}`.trim();
      return `- ${label} (${must})`;
    })
    .join("\n");
}

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
      signals: true,
      whatsApp: true,
      linkedinUrl: true,
    },
  });

  if (!lead) {
    // Lead was likely deleted (disqualified in a prior attempt). Nothing to do
    // except advance list finalization.
    await finalizeOrTopUp(leadListId, organizationId, log);
    return;
  }
  if (lead.organizationId !== organizationId) {
    throw new Error(`Lead ${leadId} access denied.`);
  }

  if (lead.status !== "RESEARCHING") {
    // Already processed — check finalization and exit
    await finalizeOrTopUp(leadListId, organizationId, log);
    return;
  }

  // ── Contact-quality gate ──────────────────────────────────────────────────
  // Legacy path requires email + website. NL leads already passed their criteria
  // and a contactability check at discovery (and may intentionally have no
  // website — e.g. "businesses with no website"), so we only require ANY usable
  // contact path (email / phone / LinkedIn) for them.
  const isNlLead = lead.signals != null;
  const hasContact = isNlLead
    ? !!(lead.email || lead.whatsApp || lead.linkedinUrl)
    : !!(lead.email && lead.companyWebsite);
  if (!hasContact) {
    await log(
      `🔴 ${lead.companyName ?? "Lead"} — no usable contact, removing.`,
      "info"
    );
    await prisma.lead.delete({ where: { id: leadId } }).catch(() => null);
    await finalizeOrTopUp(leadListId, organizationId, log);
    return;
  }

  // ── Load research + ICP context + the NL request plan ─────────────────────
  const [research, businessProfile, leadRequest] = await Promise.all([
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
        icp: true,
        businessDetails: true,
      },
    }),
    // NL leads carry a LeadRequest whose plan holds the user's actual conditions
    // ("under 1cr revenue", "premium vibe", …). Legacy/ICP leads have none.
    prisma.leadRequest.findFirst({
      where: { leadListId, organizationId },
      select: { rawQuery: true, plan: true },
    }),
  ]);

  // ── Per-request conditions (NL pipeline) ──────────────────────────────────
  // The whole point of an NL search: score each lead against what the USER asked
  // for, judged by the LLM — not just the generic business-profile ICP.
  let requestSummary: string | undefined;
  let requestConditions: string | undefined;
  if (leadRequest?.plan) {
    const reqPlan = leadRequest.plan as unknown as ResolvedPlan;
    requestSummary = (reqPlan.humanSummary || leadRequest.rawQuery || "").trim() || undefined;
    const conds = describeConditions(reqPlan);
    requestConditions = conds || undefined;
  }

  const icpCache = businessProfile?.icpAnalysisCache as Record<string, unknown> | null;

  // Structured MCQ ICP (when present): drives a precise scoring summary and the
  // user's chosen strictness threshold (Q12), replacing the fixed 60+ baseline.
  const icpAnswers = (businessProfile?.icp as IcpAnswers | null) ?? null;
  // NL searches use a fixed 60 threshold — the user's request IS the targeting, so
  // the org's ICP strictness must not gate explicit NL deliveries.
  const minScore = leadRequest?.plan ? 60 : icpAnswers ? icpMinScore(icpAnswers) : 60;
  const avoidNote = icpAnswers?.avoidCompanies?.length
    ? ` AVOID (auto-disqualify): ${icpAnswers.avoidCompanies.join(", ")}.`
    : "";

  const icpSummary = icpAnswers
    ? `${buildIcpSummary(icpAnswers)}.${avoidNote} About the seller: ${businessProfile?.businessDetails ?? ""}`
    : icpCache
      ? `Target industries: ${businessProfile?.targetIndustries.join(", ")}. ${businessProfile?.icpDescription ?? ""}`
      : (businessProfile?.icpDescription ?? "");

  const qualificationCriteria =
    (icpCache?.qualificationCriteria as string | undefined) ??
    `Score based on: industry match, company size fit, title/decision-maker relevance, geography, and observable growth/pain signals.${avoidNote} Leads scoring ${minScore}+ qualify.`;

  const companyAnalysis = (research?.companyAnalysis ?? {}) as Record<string, unknown>;

  // ── Run Qualification Agent (Haiku) ───────────────────────────────────────
  const { client, mode: runMode } = getCentralLLMClient("qualification");

  const scoreLabel = (score: number) => score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";

  let llmFailed = false;
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
      requestSummary,
      requestConditions,
    }, runMode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const maxAttempts = job.opts.attempts ?? 3;
    if ((job.attemptsMade ?? 0) < maxAttempts - 1) {
      // Transient — let BullMQ retry this lead.
      await log(`⚠️ Qualification failed for ${lead.companyName ?? "lead"} (will retry): ${msg}`, "error");
      throw err;
    }
    // Final attempt failed on an INFRA error (e.g. Gemini 429), NOT a real
    // disqualification. The lead already passed discovery's hard filters, so KEEP
    // it for manual review rather than discarding what the user paid to discover.
    await log(`⚠️ ${lead.companyName ?? "Lead"} — AI scoring unavailable after ${maxAttempts} tries (${msg.slice(0, 50)}); keeping for manual review.`, "info");
    llmFailed = true;
    result = {
      score: minScore,
      qualified: true,
      primaryReason: "Kept for review — AI scoring was unavailable (rate limit). Verify fit before sending.",
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
  // Enforce the user's strictness threshold (Q12) deterministically rather than
  // trusting the agent's baseline `qualified` flag.
  const qualified = result.score >= minScore;
  if (!qualified) {
    await log(
      `🔴 ${lead.companyName ?? "Lead"} — score ${result.score}/100 (need ${minScore}+) → not a fit (${result.primaryReason || "below threshold"}). Removed.`,
      "info"
    );
    if (runMode === "CENTRAL") await incrementTokenUsage(organizationId, 450).catch(() => null);
    await prisma.lead.delete({ where: { id: leadId } }).catch(() => null); // cascade removes LeadResearch
    await finalizeOrTopUp(leadListId, organizationId, log);
    return;
  }

  // ── Qualified → persist + enrich research, then personalize ───────────────
  await log(
    llmFailed
      ? `🟡 ${lead.companyName ?? "Lead"} — kept for manual review (AI scoring unavailable).`
      : `${scoreLabel(result.score)} ${lead.companyName ?? "Lead"} — score ${result.score}/100 → QUALIFIED`,
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
