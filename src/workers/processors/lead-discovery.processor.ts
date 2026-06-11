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
import { getClaudeClientForOrg } from "@/ai/client";
import { runICPAnalyzer } from "@/ai/agents/icp-analyzer";
import { QUALIFIED_OVERFETCH_MULTIPLIER, MAX_DISCOVERY_CANDIDATES } from "@/ai/config";
import { markListReady } from "@/lib/pipeline-finalization";
import { checkTokenBudget } from "@/lib/usage";
import type { ToolContext } from "@/ai/tools/handlers";
import { handleSearchLeads } from "@/ai/tools/handlers";
import { ApolloClient } from "@/integrations/apollo";
import { ApifyClient } from "@/integrations/apify";
import { appendLog, clearLogs } from "@/lib/job-logs";
import { getLeadResearchQueue } from "@/workers/queues";

export interface LeadDiscoveryJobData {
  organizationId: string;
  leadListId: string;
  leadsPerRun: number;
  /** Top-up round number (1 = initial). Later rounds fetch progressively more. */
  round?: number;
  mode?: "apollo" | "apify" | "import";
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

    const { client, mode: runMode } = await getClaudeClientForOrg(organizationId);

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
    // reuse the same analysis. Regenerated only when missing (the ICP rarely
    // changes); falls back to the raw profile if the LLM call fails.
    let icpCache = businessProfile.icpAnalysisCache as Record<string, unknown> | null;
    const cachedTitles = (icpCache?.apolloSearchFilters as { jobTitles?: string[] } | undefined)?.jobTitles;
    if (!cachedTitles || cachedTitles.length === 0) {
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
    // research + scoring (disqualified candidates are deleted downstream). On
    // top-up rounds we fetch progressively more so the dedup yields NEW leads
    // beyond what earlier rounds already saved.
    const candidateTarget = Math.min(
      leadsPerRun * QUALIFIED_OVERFETCH_MULTIPLIER * round,
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
    const searchParams = {
      jobTitles: filters?.jobTitles ?? [],
      industries: filters?.industries?.length ? filters.industries : businessProfile.targetIndustries,
      companySizes: filters?.companySizes ?? [],
      geographies: businessProfile.targetGeographies,
      limit: candidateTarget,
    };

    await handleSearchLeads(searchParams, ctx);

    // ── Fan out research jobs ─────────────────────────────────────────────────
    const discoveredLeads = await prisma.lead.findMany({
      where: { leadListId, organizationId, status: "RESEARCHING" },
      select: { id: true },
    });

    if (discoveredLeads.length === 0) {
      // No NEW leads this round → candidate pool is exhausted. Finalize with
      // whatever qualified so far (0 on the very first round). leadsPerRun
      // equals the qualified target (top-up rounds are enqueued with it).
      const qualifiedSoFar = await prisma.lead.count({
        where: { leadListId, status: "QUALIFIED" },
      });
      await log(
        round > 1
          ? `No more new leads available (round ${round}). Finalizing with ${qualifiedSoFar} qualified.`
          : "No leads were found. Broaden the ICP, industries, or location.",
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
