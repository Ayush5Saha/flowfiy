/**
 * Queue: lead-discovery
 *
 * Stage 1 of the 4-queue pipeline. Discovers leads via Apollo or Apify,
 * writes RESEARCHING lead records to the DB, then fans out one lead-research
 * job per lead.
 *
 * Reuses handleSearchLeads() from the tools layer — same logic as the old
 * monolithic orchestrator, just called directly without a Claude tool-use loop.
 */
import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getCentralLLMClient } from "@/ai/client";
import { runICPAnalyzer } from "@/ai/agents/icp-analyzer";
import { QUALIFIED_OVERFETCH_MULTIPLIER, MAX_DISCOVERY_CANDIDATES, MAX_DISCOVERY_ROUNDS } from "@/ai/config";
import { markListReady } from "@/lib/pipeline-finalization";
import { checkTokenBudget } from "@/lib/usage";
import type { ToolContext } from "@/ai/tools/handlers";
import { handleSearchLeads } from "@/ai/tools/handlers";
import { icpJobTitles, type IcpAnswers } from "@/lib/icp";
import { ApolloClient } from "@/integrations/apollo";
import { ApifyClient } from "@/integrations/apify";
import { appendLog, clearLogs } from "@/lib/job-logs";
import { getLeadResearchQueue, getLeadDiscoveryQueue } from "@/workers/queues";
import { runNlDiscovery } from "@/lib/nl-pipeline/discovery";
import { releaseLeadRequestHold } from "@/lib/nl-pipeline/reconcile";

export interface LeadDiscoveryJobData {
  organizationId: string;
  leadListId: string;
  leadsPerRun: number;
  /** Top-up round number (1 = initial). Later rounds fetch progressively more. */
  round?: number;
  mode?: "apollo" | "apify" | "import" | "nl";
  /** NL pipeline: the LeadRequest that owns this run (criteria-aware discovery). */
  leadRequestId?: string;
  /** Import mode: leads already inserted into DB, skip discovery */
  preloadedLeads?: Array<{
    leadId: string;
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    email?: string | null;
    companyName?: string | null;
    companyWebsite?: string | null;
    companySize?: string | null;
    industry?: string | null;
  }>;
}

async function getIntegrationCredentials(organizationId: string, type: string) {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: type as never } },
    select: { encryptedCredentials: true, status: true },
  });
  if (!integration || integration.status !== "CONNECTED") return null;
  return decryptCredentials(integration.encryptedCredentials);
}

export async function processLeadDiscovery(job: Job<LeadDiscoveryJobData>) {
  const { organizationId, leadListId, leadsPerRun, mode = "apollo" } = job.data;
  const round = job.data.round ?? 1;
  const attemptNumber = (job.attemptsMade ?? 0) + 1;
  const isRetry = attemptNumber > 1;

  const log = (msg: string, level: "info" | "success" | "error" | "tool" = "info") =>
    appendLog(leadListId, msg, level);

  async function updateListStatus(status: string, extra?: Record<string, unknown>) {
    await prisma.leadList.update({
      where: { id: leadListId },
      data: { status: status as never, ...extra },
    });
  }

  // ── NL pipeline: criteria-aware discovery via the actor registry ──────────
  if (job.data.mode === "nl" && job.data.leadRequestId) {
    const leadRequestId = job.data.leadRequestId;
    try {
      await runNlDiscovery({ organizationId, leadListId, leadRequestId, round });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      await appendLog(leadListId, `Discovery failed: ${errMsg}`, "error").catch(() => null);
      await prisma.leadList
        .update({ where: { id: leadListId }, data: { status: "FAILED", jobStatus: "failed", jobError: errMsg } })
        .catch(() => null);
      await releaseLeadRequestHold(leadRequestId, organizationId, "FAILED", errMsg).catch(() => null);
      throw err;
    }
    return;
  }

  try {
    if (isRetry) {
      await log(`━━━ Retry attempt ${attemptNumber}/3 — resuming discovery ━━━`, "info");
    } else {
      await clearLogs(leadListId);
      await log("Starting lead generation pipeline...", "info");
    }

    await updateListStatus("RESEARCHING", { jobStatus: "analyzing_icp" });
    await log("Analyzing your Ideal Customer Profile (ICP)...", "info");

    // ── Load business profile ─────────────────────────────────────────────────
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { organizationId },
    });
    if (!businessProfile) throw new Error("Business profile not configured");

    await log(
      `ICP loaded: targeting ${businessProfile.targetIndustries.slice(0, 3).join(", ")} in ${businessProfile.targetGeographies.slice(0, 2).join(", ")}`,
      "success"
    );

    // ── Token budget + client setup ───────────────────────────────────────────
    await log("Initializing AI and integration clients...", "info");

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true },
    });

    const tokenCheck = await checkTokenBudget(organizationId);
    if (!tokenCheck.allowed) {
      throw new Error("Monthly AI token budget exceeded. Resets at the start of next month.");
    }

    const { client, mode: runMode } = getCentralLLMClient("icpAnalyzer");

    const apolloCreds = await getIntegrationCredentials(organizationId, "APOLLO");
    const apolloClient = apolloCreds?.apiKey ? new ApolloClient(apolloCreds.apiKey as string) : null;

    const apifyCreds = await getIntegrationCredentials(organizationId, "APIFY");
    const apifyClient =
      org.plan !== "INDIE" && apifyCreds?.apiKey
        ? new ApifyClient(apifyCreds.apiKey as string)
        : null;

    const leadSource = apolloClient ? "Apollo" : apifyClient ? "Apify" : "none";
    await log(`Lead source: ${leadSource} · AI mode: ${runMode}`, "info");

    // ── ICP analysis: build a detailed, structured ICP and derive search ──────
    // filters from it. Cached on the business profile so research + qualification
    // reuse the same analysis. Regenerated when missing OR when the cached title
    // net is too thin (< 6) — older caches held only 2-3 titles, which starved
    // the search; the improved analyzer emits 8-14. Self-heals on the next run.
    let icpCache = businessProfile.icpAnalysisCache as Record<string, unknown> | null;
    const cachedTitles = (icpCache?.apolloSearchFilters as { jobTitles?: string[] } | undefined)?.jobTitles;
    if (!cachedTitles || cachedTitles.length < 6) {
      await log("Analyzing your ICP in detail to target the right people...", "info");
      try {
        const icp = await runICPAnalyzer(
          client,
          {
            companyName:       businessProfile.companyName,
            serviceOffered:    businessProfile.serviceOffered,
            icpDescription:    businessProfile.icpDescription,
            targetIndustries:  businessProfile.targetIndustries,
            targetGeographies: businessProfile.targetGeographies,
            companySizeRange:  businessProfile.companySizeRange ?? undefined,
            painPointsSolved:  businessProfile.painPointsSolved,
            offerPositioning:  businessProfile.offerPositioning,
            outreachTone:      businessProfile.outreachTone,
          },
          runMode
        );
        icpCache = icp as unknown as Record<string, unknown>;
        await prisma.businessProfile.update({
          where: { organizationId },
          data: { icpAnalysisCache: icp as never },
        });
        await log(
          `ICP ready — buyer personas: ${icp.buyerPersonas.slice(0, 3).join(", ")} · titles: ${icp.apolloSearchFilters.jobTitles.slice(0, 4).join(", ")}`,
          "success"
        );
      } catch (err) {
        await log(
          `ICP analysis failed (${err instanceof Error ? err.message : String(err)}). Falling back to your raw profile.`,
          "error"
        );
      }
    } else {
      await log("Using your saved ICP analysis.", "info");
    }

    // ── Import mode: leads already in DB ─────────────────────────────────────
    if (mode === "import") {
      await log("Import mode: using pre-loaded leads from CSV...", "info");
      await updateListStatus("RESEARCHING", { jobStatus: "researching_companies" });

      const existingLeads = await prisma.lead.findMany({
        where: { leadListId, organizationId },
        select: { id: true },
      });

      if (existingLeads.length === 0) {
        await log("No leads found in import. List is empty.", "error");
        await updateListStatus("READY", { jobStatus: "complete", totalLeads: 0 });
        return;
      }

      await log(`Found ${existingLeads.length} imported leads. Starting research...`, "success");

      // Fan out one research job per imported lead
      const researchQueue = getLeadResearchQueue();
      await Promise.all(
        existingLeads.map((lead) =>
          researchQueue.add(
            "lead-research",
            { organizationId, leadListId, leadId: lead.id },
            { jobId: `research-${lead.id}` }
          )
        )
      );
      return;
    }

    // ── Checkpoint detection (RETRY of the SAME round only) ───────────────────
    // On a retry of this job: A) no leads → run fresh; B) some RESEARCHING →
    // re-fan-out; C) all done → skip. On a FRESH top-up round (not a retry) we
    // must NOT treat prior rounds' leads as "already discovered" — skip the
    // checkpoint entirely and go discover new leads.
    const checkpointLeads = isRetry
      ? await prisma.lead.findMany({
          where: { leadListId, organizationId },
          select: { id: true, status: true },
        })
      : [];

    if (checkpointLeads.length > 0) {
      const pendingResearch = checkpointLeads.filter((l) => l.status === "RESEARCHING");

      if (pendingResearch.length > 0) {
        // Case B: re-fan-out research jobs for still-pending leads
        await log(
          `Checkpoint: ${checkpointLeads.length - pendingResearch.length} leads done, ${pendingResearch.length} still need research. Resuming...`,
          "info"
        );
        const researchQueue = getLeadResearchQueue();
        await Promise.all(
          pendingResearch.map((lead) =>
            researchQueue.add(
              "lead-research",
              { organizationId, leadListId, leadId: lead.id },
              { jobId: `research-${lead.id}` }
            )
          )
        );
        return;
      }

      // Case C: all leads already processed downstream — nothing to do here
      await log(`Checkpoint: all ${checkpointLeads.length} leads already discovered. Skipping discovery.`, "info");
      return;
    }

    // ── Fresh discovery ───────────────────────────────────────────────────────
    if (!apolloClient && !apifyClient) {
      throw new Error(
        "No lead source connected. Please connect Apollo (recommended) or Apify (free tier) in the Integrations page."
      );
    }

    await log(`Asking AI to find ${leadsPerRun} leads matching your ICP...`, "info");
    await updateListStatus("RESEARCHING", { jobStatus: "discovering_leads" });

    const ctx: ToolContext = {
      organizationId,
      leadListId,
      apolloClient,
      apifyClient,
      geographies: businessProfile.targetGeographies,
      stats: { totalLeads: 0, qualifiedLeads: 0 },
      log,
    };

    // Over-fetch candidates so we can deliver ~leadsPerRun QUALIFIED leads after
    // research + scoring (disqualified candidates are deleted downstream). We
    // size each round to the REMAINING gap to target (not the full target), so
    // later top-up rounds shrink as qualified leads accumulate — this converges
    // on the requested count instead of over-delivering. Depth across rounds
    // comes from the search advancing to the NEXT page window each round
    // (see searchViaApollo), not from inflating a single page.
    const alreadyQualified = await prisma.lead.count({
      where: { leadListId, status: "QUALIFIED" },
    });
    const remaining = Math.max(leadsPerRun - alreadyQualified, 0);
    if (remaining === 0) {
      await log(`Target already met — ${alreadyQualified}/${leadsPerRun} qualified. Finalizing.`, "success");
      await markListReady(leadListId, organizationId, alreadyQualified, leadsPerRun, log);
      return;
    }
    const candidateTarget = Math.min(
      Math.ceil(remaining * QUALIFIED_OVERFETCH_MULTIPLIER),
      MAX_DISCOVERY_CANDIDATES
    );
    await log(
      round > 1
        ? `Round ${round}: searching for more leads (up to ${candidateTarget} candidates)...`
        : `Targeting ${leadsPerRun} qualified leads — discovering up to ${candidateTarget} candidates to research & score...`,
      "info"
    );

    // Build search params from the ICP analysis (generated above) or raw profile
    const filters = icpCache?.apolloSearchFilters as
      | { jobTitles?: string[]; industries?: string[]; companySizes?: string[] }
      | undefined;
    // Prefer the user's structured MCQ ICP for precise sourcing: their selected
    // decision-maker titles (not loose LLM-invented ones) and rich peakydev
    // filters (size/country/industry/revenue/funding) — the lead-quality fix.
    const icpAnswers = (businessProfile.icp as IcpAnswers | null) ?? null;
    const searchParams = {
      jobTitles: icpAnswers ? icpJobTitles(icpAnswers) : (filters?.jobTitles ?? []),
      industries: icpAnswers?.industries?.length
        ? icpAnswers.industries
        : (filters?.industries?.length ? filters.industries : businessProfile.targetIndustries),
      companySizes: filters?.companySizes ?? (icpAnswers?.companySize ? [icpAnswers.companySize] : []),
      geographies: businessProfile.targetGeographies,
      limit: candidateTarget,
      // Each round scans the next window of Apollo result pages → new people.
      round,
      icp: icpAnswers ?? undefined,
    };

    await handleSearchLeads(searchParams, ctx);

    // ── Fan out research jobs ─────────────────────────────────────────────────
    const discoveredLeads = await prisma.lead.findMany({
      where: { leadListId, organizationId, status: "RESEARCHING" },
      select: { id: true },
    });

    if (discoveredLeads.length === 0) {
      // No NEW leads passed discovery this round. Keep searching with a deeper
      // pass (larger fetch) until we reach the target or the round cap —
      // rather than giving up after a single thin round.
      const qualifiedSoFar = await prisma.lead.count({
        where: { leadListId, status: "QUALIFIED" },
      });

      if (round < MAX_DISCOVERY_ROUNDS && qualifiedSoFar < leadsPerRun) {
        const nextRound = round + 1;
        await log(
          `Round ${round} found no new leads with valid contact details — widening the search (round ${nextRound} of ${MAX_DISCOVERY_ROUNDS})...`,
          "info"
        );
        await prisma.leadList.update({
          where: { id: leadListId },
          data: { discoveryRound: nextRound, status: "RESEARCHING", jobStatus: "discovering_leads" },
        });
        await getLeadDiscoveryQueue().add(
          "lead-discovery",
          { organizationId, leadListId, leadsPerRun, round: nextRound },
          { jobId: `discover-${leadListId}-r${nextRound}` }
        );
        return;
      }

      // Round cap reached (or target met) with no more new leads — finalize.
      await log(
        round > 1
          ? `Searched ${round} rounds — ${qualifiedSoFar} qualified. No more leads with valid contact details are available for this ICP.`
          : "No leads with valid contact details were found. Broaden the ICP, industries, or location.",
        round > 1 ? "info" : "error"
      );
      await markListReady(leadListId, organizationId, qualifiedSoFar, leadsPerRun, log);
      return;
    }

    await updateListStatus("RESEARCHING", { jobStatus: "researching_companies" });

    const researchQueue = getLeadResearchQueue();
    await Promise.all(
      discoveredLeads.map((lead) =>
        researchQueue.add(
          "lead-research",
          { organizationId, leadListId, leadId: lead.id },
          { jobId: `research-${lead.id}` }
        )
      )
    );

    await log(`Discovered ${discoveredLeads.length} leads. Researching companies in parallel...`, "success");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    await appendLog(leadListId, `Discovery failed: ${errMsg}`, "error").catch(() => null);
    await prisma.leadList.update({
      where: { id: leadListId },
      data: { status: "FAILED", jobStatus: "failed", jobError: errMsg },
    });
    throw err;
  }
}
