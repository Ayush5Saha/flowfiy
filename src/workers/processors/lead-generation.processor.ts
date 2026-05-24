import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getClaudeClientForOrg } from "@/ai/client";
import { incrementGenerationCount, checkTokenBudget, incrementTokenUsage } from "@/lib/usage";
import { runLeadGenOrchestrator } from "@/ai/orchestrator";
import type { ToolContext } from "@/ai/tools/handlers";
import { ApolloClient } from "@/integrations/apollo";
import { ApifyClient } from "@/integrations/apify";
import { appendLog, clearLogs } from "@/lib/job-logs";

export interface LeadGenerationJobData {
  organizationId: string;
  leadListId: string;
  leadsPerRun: number;
  mode?: "apollo" | "apify" | "import"; // "import" = leads already in DB, skip discovery
}

async function getIntegrationCredentials(organizationId: string, type: string) {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: type as never } },
    select: { encryptedCredentials: true, status: true },
  });
  if (!integration || integration.status !== "CONNECTED") return null;
  return decryptCredentials(integration.encryptedCredentials);
}

export async function processLeadGeneration(job: Job<LeadGenerationJobData>) {
  const { organizationId, leadListId, leadsPerRun, mode = "apollo" } = job.data;
  const attemptNumber = (job.attemptsMade ?? 0) + 1; // 1-based (1st, 2nd, 3rd)
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
    // ── Step 1: Load business profile ────────────────────────────────────────
    if (isRetry) {
      // Preserve previous log history — just add a retry separator
      await log(`━━━ Retry attempt ${attemptNumber}/3 — resuming pipeline ━━━`, "info");
    } else {
      await clearLogs(leadListId);
      await log("Starting lead generation pipeline...", "info");
    }
    await updateListStatus("RESEARCHING", { jobStatus: "analyzing_icp" });
    await log("Analyzing your Ideal Customer Profile (ICP)...", "info");

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { organizationId },
    });
    if (!businessProfile) throw new Error("Business profile not configured");

    await log(`ICP loaded: targeting ${businessProfile.targetIndustries.slice(0, 3).join(", ")} in ${businessProfile.targetGeographies.slice(0, 2).join(", ")}`, "success");

    // ── Step 2: Check token budget & set up clients ──────────────────────────
    await log("Initializing AI and integration clients...", "info");

    // Get the org plan to apply INDIE restrictions
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { plan: true },
    });

    // Only check central token budget for plans that use it
    const tokenCheck = await checkTokenBudget(organizationId);
    if (!tokenCheck.allowed) {
      throw new Error("Monthly AI token budget exceeded. Resets at the start of next month.");
    }

    // Get the Claude client and run mode (CENTRAL or BYOK)
    const { client: claude, mode: runMode } = await getClaudeClientForOrg(organizationId);

    const apolloCreds = await getIntegrationCredentials(organizationId, "APOLLO");
    const apolloClient = apolloCreds?.apiKey ? new ApolloClient(apolloCreds.apiKey as string) : null;

    const apifyCreds = await getIntegrationCredentials(organizationId, "APIFY");
    // INDIE plan: Apify is not available even if connected
    const apifyClient = (org.plan !== "INDIE" && apifyCreds?.apiKey)
      ? new ApifyClient(apifyCreds.apiKey as string)
      : null;

    const calendlyCreds = await getIntegrationCredentials(organizationId, "CALENDLY");

    const apolloConnected = !!apolloCreds?.apiKey;
    const apifyConnected = !!apifyCreds?.apiKey && org.plan !== "INDIE";

    // Determine which lead source will be used
    const leadSource = apolloConnected ? "Apollo" : apifyConnected ? "Apify (free tier)" : "none";
    await log(`Lead source: ${leadSource} · Apify enrichment: ${apifyConnected ? "enabled" : "disabled"} · AI mode: ${runMode}`, "info");

    // ── Step 3: Handle import mode (leads already in DB) ─────────────────────
    if (mode === "import") {
      await log("Import mode: using pre-loaded leads from CSV...", "info");
      await updateListStatus("RESEARCHING", { jobStatus: "analyzing_companies" });

      const existingLeads = await prisma.lead.findMany({
        where: { leadListId, organizationId },
      });

      if (existingLeads.length === 0) {
        await log("No leads found in import. List is empty.", "error");
        await updateListStatus("READY", { jobStatus: "complete", totalLeads: 0 });
        return;
      }

      await log(`Found ${existingLeads.length} imported leads. Starting AI analysis...`, "success");

      await prisma.lead.updateMany({
        where: { leadListId, organizationId },
        data: { status: "RESEARCHING" },
      });

      // Build a tool context with no apollo client so orchestrator skips discovery
      // and processes the pre-loaded leads. We inject the existing leads as a
      // synthetic search result via a pre-seeded stats object.
      const ctx: ToolContext = {
        organizationId,
        leadListId,
        apolloClient: null,        // no discovery needed in import mode
        apifyClient,
        geographies: businessProfile.targetGeographies,
        stats: { totalLeads: existingLeads.length, qualifiedLeads: 0 },
        log,
      };

      // For import mode we still run the orchestrator but without search_leads.
      // We craft the initial user message so Claude knows leads are pre-loaded.
      const result = await runLeadGenOrchestrator(claude, ctx, {
        businessProfile: {
          companyName: businessProfile.companyName,
          serviceOffered: businessProfile.serviceOffered,
          icpDescription: businessProfile.icpDescription,
          targetIndustries: businessProfile.targetIndustries,
          targetGeographies: businessProfile.targetGeographies,
          companySizeRange: businessProfile.companySizeRange,
          painPointsSolved: businessProfile.painPointsSolved,
          offerPositioning: businessProfile.offerPositioning,
          outreachTone: businessProfile.outreachTone,
        },
        leadsPerRun: existingLeads.length,
        calendlyLink: calendlyCreds?.schedulingLink as string | undefined,
        // Pass pre-loaded leads so the orchestrator skips search_leads entirely
        preloadedLeads: existingLeads.map((l) => ({
          leadId: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          title: l.title,
          email: l.email,
          companyName: l.companyName,
          companyWebsite: l.companyWebsite,
          companySize: l.companySize,
          industry: l.industry,
        })),
      }, runMode);

      await incrementGenerationCount(organizationId, existingLeads.length);
      // Only track central token usage for non-BYOK runs
      if (runMode === "CENTRAL") {
        await incrementTokenUsage(organizationId, result.tokenUsage.inputTokens + result.tokenUsage.outputTokens);
      }
      await prisma.leadList.update({
        where: { id: leadListId },
        data: {
          status: "READY",
          jobStatus: "complete",
          totalLeads: result.totalLeads,
          qualifiedLeads: result.qualifiedLeads,
        },
      });

      await log(`Done! ${result.totalLeads} leads processed, ${result.qualifiedLeads} qualified (${result.toolCallCount} AI tool calls)`, "success");

      console.log(
        `[worker] Import run complete — ${result.totalLeads} leads, ` +
          `${result.qualifiedLeads} qualified, ${result.toolCallCount} tool calls`
      );
      return;
    }

    // ── Step 4: Checkpoint detection (retry path) ────────────────────────────
    //
    // On retry, check what the previous attempt already saved. There are three cases:
    //   A) No leads in DB → previous attempt crashed before/during discovery → full fresh run
    //   B) Some leads RESEARCHING + some done → crashed mid-qualification → resume those pending
    //   C) All leads done (QUALIFIED/DISQUALIFIED) → crashed during finalization → just finalise
    //
    const checkpointLeads = await prisma.lead.findMany({
      where: { leadListId, organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        companyName: true,
        companyWebsite: true,
        companySize: true,
        industry: true,
        linkedinUrl: true,
        status: true,
      },
    });

    const pendingLeads = checkpointLeads.filter((l) => l.status === "RESEARCHING");
    const doneLeads    = checkpointLeads.filter((l) => l.status !== "RESEARCHING");
    const alreadyQualifiedCount = doneLeads.filter((l) =>
      ["QUALIFIED", "CONTACTED", "REPLIED", "MEETING_BOOKED"].includes(l.status)
    ).length;

    // Case C: all leads already processed — previous attempt only failed in finalization
    if (checkpointLeads.length > 0 && pendingLeads.length === 0) {
      await log(
        `Checkpoint: all ${checkpointLeads.length} leads already processed (${alreadyQualifiedCount} qualified). Finalising...`,
        "success"
      );
      await prisma.leadList.update({
        where: { id: leadListId },
        data: {
          status: "READY",
          jobStatus: "complete",
          totalLeads: checkpointLeads.length,
          qualifiedLeads: alreadyQualifiedCount,
        },
      });
      await log(`Pipeline complete! ${checkpointLeads.length} leads, ${alreadyQualifiedCount} qualified.`, "success");
      return;
    }

    // ── Step 5: Lead discovery — Apollo preferred, Apify as fallback ─────────
    //
    // Skip discovery entirely if we have a checkpoint (pending leads already in DB).
    const hasCheckpoint = pendingLeads.length > 0;

    if (!hasCheckpoint) {
      // Normal fresh discovery path
      if (!apolloClient && !apifyClient) {
        throw new Error(
          "No lead source connected. Please connect Apollo (recommended) or Apify (free tier) in the Integrations page."
        );
      }
      if (!apolloClient && apifyClient) {
        await log("Apollo not connected — using Apify for lead discovery.", "info");
      }
      await log(`Asking Claude to find ${leadsPerRun} leads matching your ICP...`, "info");
      await updateListStatus("RESEARCHING", { jobStatus: "discovering_leads" });
    } else {
      await log(
        `Checkpoint: ${doneLeads.length} leads already done, ${pendingLeads.length} still need qualification. Resuming...`,
        "info"
      );
      await updateListStatus("RESEARCHING", { jobStatus: "analyzing_companies" });
    }

    const ctx: ToolContext = {
      organizationId,
      leadListId,
      apolloClient,
      apifyClient,
      geographies: businessProfile.targetGeographies,
      stats: { totalLeads: 0, qualifiedLeads: 0 },
      log,
    };

    const orchestratorInput = {
      businessProfile: {
        companyName: businessProfile.companyName,
        serviceOffered: businessProfile.serviceOffered,
        icpDescription: businessProfile.icpDescription,
        targetIndustries: businessProfile.targetIndustries,
        targetGeographies: businessProfile.targetGeographies,
        companySizeRange: businessProfile.companySizeRange,
        painPointsSolved: businessProfile.painPointsSolved,
        offerPositioning: businessProfile.offerPositioning,
        outreachTone: businessProfile.outreachTone,
      },
      leadsPerRun,
      calendlyLink: calendlyCreds?.schedulingLink as string | undefined,
      // Resume: pass only the unfinished leads — orchestrator skips search_leads
      ...(hasCheckpoint && {
        resumeLeads: pendingLeads.map((l) => ({
          leadId: l.id,
          firstName: l.firstName,
          lastName: l.lastName,
          title: l.title,
          email: l.email,
          companyName: l.companyName,
          companyWebsite: l.companyWebsite,
          companySize: l.companySize,
          industry: l.industry,
        })),
      }),
    };

    const result = await runLeadGenOrchestrator(claude, ctx, orchestratorInput, runMode);

    if (!hasCheckpoint && result.totalLeads === 0) {
      await log("No leads were found. Check Apollo filters or broaden the ICP.", "error");
      await updateListStatus("READY", { jobStatus: "complete", totalLeads: 0 });
      return;
    }

    // ── Step 6: Finalise ──────────────────────────────────────────────────────
    // Merge newly-processed counts with any leads already done in previous attempts
    const finalTotalLeads     = hasCheckpoint ? checkpointLeads.length : result.totalLeads;
    const finalQualifiedLeads = result.qualifiedLeads + alreadyQualifiedCount;

    await incrementGenerationCount(organizationId, result.totalLeads);
    // Only track central token usage for non-BYOK runs
    if (runMode === "CENTRAL") {
      await incrementTokenUsage(organizationId, result.tokenUsage.inputTokens + result.tokenUsage.outputTokens);
    }

    await prisma.leadList.update({
      where: { id: leadListId },
      data: {
        status: "READY",
        jobStatus: "complete",
        totalLeads: finalTotalLeads,
        qualifiedLeads: finalQualifiedLeads,
      },
    });

    await log(
      `Pipeline complete! ${finalTotalLeads} leads processed, ${finalQualifiedLeads} qualified with personalised outreach ready.`,
      "success"
    );

    console.log(
      `[worker] Lead gen complete — ${finalTotalLeads} leads, ` +
        `${finalQualifiedLeads} qualified, ${result.toolCallCount} tool calls`
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    await appendLog(leadListId, `Pipeline failed: ${errMsg}`, "error").catch(() => null);
    await prisma.leadList.update({
      where: { id: leadListId },
      data: {
        status: "FAILED",
        jobStatus: "failed",
        jobError: errMsg,
      },
    });
    throw err;
  }
}
