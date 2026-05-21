import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getClaudeClient } from "@/ai/client";
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
  mode?: "apollo" | "import"; // "import" = leads already in DB, skip Apollo discovery
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
    await clearLogs(leadListId);
    await log("Starting lead generation pipeline...", "info");
    await updateListStatus("RESEARCHING", { jobStatus: "analyzing_icp" });
    await log("Analyzing your Ideal Customer Profile (ICP)...", "info");

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { organizationId },
    });
    if (!businessProfile) throw new Error("Business profile not configured");

    await log(`ICP loaded: targeting ${businessProfile.targetIndustries.slice(0, 3).join(", ")} in ${businessProfile.targetGeographies.slice(0, 2).join(", ")}`, "success");

    // ── Step 2: Check token budget & set up clients ──────────────────────────
    await log("Initializing AI and integration clients...", "info");
    const tokenCheck = await checkTokenBudget(organizationId);
    if (!tokenCheck.allowed) {
      throw new Error("Monthly AI token budget exceeded. Resets at the start of next month.");
    }
    const claude = getClaudeClient();

    const apolloCreds = await getIntegrationCredentials(organizationId, "APOLLO");
    const apolloClient = apolloCreds?.apiKey ? new ApolloClient(apolloCreds.apiKey) : null;

    const apifyCreds = await getIntegrationCredentials(organizationId, "APIFY");
    const apifyClient = apifyCreds?.apiKey ? new ApifyClient(apifyCreds.apiKey) : null;

    const calendlyCreds = await getIntegrationCredentials(organizationId, "CALENDLY");

    const apolloConnected = !!apolloCreds?.apiKey;
    const apifyConnected = !!apifyCreds?.apiKey;
    await log(`Apollo: ${apolloConnected ? "connected" : "not connected"} · Apify: ${apifyConnected ? "connected" : "not connected"}`, "info");

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
        calendlyLink: calendlyCreds?.schedulingLink,
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
      });

      await incrementGenerationCount(organizationId, existingLeads.length);
      await incrementTokenUsage(organizationId, result.tokenUsage.inputTokens + result.tokenUsage.outputTokens);
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

    // ── Step 4: Apollo mode — Claude orchestrates everything ─────────────────
    if (!apolloClient) {
      throw new Error("Apollo API key not connected. Cannot generate leads.");
    }

    await log(`Asking Claude to find ${leadsPerRun} leads matching your ICP...`, "info");
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
      leadsPerRun,
      calendlyLink: calendlyCreds?.schedulingLink,
    });

    if (result.totalLeads === 0) {
      await log("No leads were found. Check Apollo filters or broaden the ICP.", "error");
      await updateListStatus("READY", { jobStatus: "complete", totalLeads: 0 });
      return;
    }

    // ── Step 5: Finalise ──────────────────────────────────────────────────────
    await incrementGenerationCount(organizationId, result.totalLeads);
    await incrementTokenUsage(organizationId, result.tokenUsage.inputTokens + result.tokenUsage.outputTokens);

    await prisma.leadList.update({
      where: { id: leadListId },
      data: {
        status: "READY",
        jobStatus: "complete",
        totalLeads: result.totalLeads,
        qualifiedLeads: result.qualifiedLeads,
      },
    });

    await log(`Pipeline complete! ${result.totalLeads} leads found, ${result.qualifiedLeads} qualified with personalised outreach ready.`, "success");

    console.log(
      `[worker] Lead gen complete — ${result.totalLeads} leads, ` +
        `${result.qualifiedLeads} qualified, ${result.toolCallCount} tool calls`
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
