/**
 * Queue: lead-research
 *
 * Stage 2 of the 4-queue pipeline. For each lead:
 *   1. Scrapes the company website (Apify, if connected)
 *   2. Runs the Company Analyzer agent (Claude Haiku) to extract structured intel
 *   3. Saves a LeadResearch record
 *   4. Enqueues a lead-qualification job for this lead
 *
 * Runs at concurrency=10 — 10 leads researched simultaneously.
 * Idempotent: if LeadResearch already exists, skips to enqueueing qualification.
 */
import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getClaudeClientForOrg } from "@/ai/client";
import { incrementTokenUsage } from "@/lib/usage";
import { runCompanyAnalyzer } from "@/ai/agents/company-analyzer";
import { handleScrapeWebsite } from "@/ai/tools/handlers";
import type { ToolContext } from "@/ai/tools/handlers";
import { ApifyClient } from "@/integrations/apify";
import { appendLog } from "@/lib/job-logs";
import { getLeadQualificationQueue } from "@/workers/queues";
import { INPUT_LIMITS } from "@/ai/config";

export interface LeadResearchJobData {
  organizationId: string;
  leadListId: string;
  leadId: string;
}

export async function processLeadResearch(job: Job<LeadResearchJobData>) {
  const { organizationId, leadListId, leadId } = job.data;

  const log = (msg: string, level: "info" | "success" | "error" | "tool" = "info") =>
    appendLog(leadListId, msg, level);

  // ── Idempotency: skip if already researched ───────────────────────────────
  const existingResearch = await prisma.leadResearch.findUnique({
    where: { leadId },
    select: { id: true },
  });

  if (existingResearch) {
    // Already done — just ensure qualification job exists downstream
    await getLeadQualificationQueue().add(
      "lead-qualification",
      { organizationId, leadListId, leadId },
      { jobId: `qualify-${leadId}` }
    );
    return;
  }

  // ── Load lead ─────────────────────────────────────────────────────────────
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      organizationId: true,
      firstName: true,
      lastName: true,
      title: true,
      companyName: true,
      companyWebsite: true,
      companySize: true,
      industry: true,
      status: true,
    },
  });

  if (!lead || lead.organizationId !== organizationId) {
    throw new Error(`Lead ${leadId} not found or access denied.`);
  }

  // ── Client setup ──────────────────────────────────────────────────────────
  const { client, mode: runMode } = await getClaudeClientForOrg(organizationId);

  const apifyCreds = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: "APIFY" } },
    select: { encryptedCredentials: true, status: true },
  });

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true },
  });

  const apifyClient =
    org.plan !== "INDIE" && apifyCreds?.status === "CONNECTED" && apifyCreds.encryptedCredentials
      ? new ApifyClient(
          (decryptCredentials(apifyCreds.encryptedCredentials) as { apiKey: string }).apiKey
        )
      : null;

  // ── Website scraping (optional) ───────────────────────────────────────────
  let websiteContent = "";

  if (lead.companyWebsite) {
    const ctx: ToolContext = {
      organizationId,
      leadListId,
      apolloClient: null,
      apifyClient,
      geographies: [],
      stats: { totalLeads: 0, qualifiedLeads: 0 },
      log,
    };

    const scrapeResult = await handleScrapeWebsite({ url: lead.companyWebsite, leadId }, ctx) as {
      content?: string;
    };
    websiteContent = (scrapeResult.content ?? "").slice(0, INPUT_LIMITS.websiteContent);
  }

  // ── Load ICP summary ──────────────────────────────────────────────────────
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { organizationId },
    select: { icpAnalysisCache: true, targetIndustries: true, icpDescription: true },
  });

  const icpCache = businessProfile?.icpAnalysisCache as Record<string, unknown> | null;
  const icpSummary = icpCache
    ? `Target industries: ${(icpCache.targetIndustries as string[] | undefined)?.join(", ") ?? businessProfile?.targetIndustries.join(", ")}. ${businessProfile?.icpDescription ?? ""}`
    : (businessProfile?.icpDescription ?? "");

  // ── Run Company Analyzer (Haiku) ──────────────────────────────────────────
  await log(`🔍 Analyzing ${lead.companyName ?? "company"} (${lead.companyWebsite ?? "no website"})`, "tool");

  let analysis: Awaited<ReturnType<typeof runCompanyAnalyzer>>;
  try {
    analysis = await runCompanyAnalyzer(client, {
      companyName: lead.companyName ?? "Unknown",
      companyWebsite: lead.companyWebsite ?? "",
      industry: lead.industry ?? "Unknown",
      companySize: lead.companySize ?? undefined,
      websiteContent,
      icpSummary: icpSummary.slice(0, INPUT_LIMITS.icpSummary),
    }, runMode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const maxAttempts = job.opts.attempts ?? 3;
    if ((job.attemptsMade ?? 0) < maxAttempts - 1) {
      // Transient — let BullMQ retry this lead.
      await log(`⚠️ Company analysis failed for ${lead.companyName ?? "company"} (will retry): ${msg}`, "error");
      throw err;
    }
    // Final attempt — degrade gracefully so the lead doesn't stay stuck in
    // RESEARCHING forever. Qualification can still score on basic lead data.
    await log(`❌ Company analysis failed for ${lead.companyName ?? "company"} after ${maxAttempts} attempts: ${msg}. Continuing with basic data.`, "error");
    analysis = {
      brandMaturity: "established",
      marketingQuality: "moderate",
      acquisitionGaps: [],
      growthBottlenecks: [],
      techStack: [],
      recentSignals: [],
      fitAssessment: "Automated company analysis unavailable (AI error).",
      bestOutreachAngle: "",
      confidence: 0,
    };
  }

  // ── Save LeadResearch ─────────────────────────────────────────────────────
  await prisma.leadResearch.create({
    data: {
      leadId,
      organizationId,
      companyAnalysis: analysis as never,
      opportunityAngle: analysis.bestOutreachAngle,
      painPointMatch: analysis.acquisitionGaps.slice(0, 2).join("; "),
      personalizationNotes: analysis.recentSignals.slice(0, 2).join("; "),
      researchMetadata: {
        brandMaturity: analysis.brandMaturity,
        marketingQuality: analysis.marketingQuality,
        confidence: analysis.confidence,
        techStack: analysis.techStack,
      } as never,
    },
  });

  // ── Track token usage (CENTRAL mode only) ────────────────────────────────
  // Note: response.usage not available from runCompanyAnalyzer return value;
  // approximate based on max_tokens config — actual billing tracked by Anthropic.
  // Full token tracking done in lead-qualification where response.usage is captured.

  await log(
    `✅ Research complete for ${lead.companyName ?? "company"} — ${analysis.marketingQuality} marketing, ${analysis.brandMaturity} brand`,
    "success"
  );

  // ── Enqueue qualification ─────────────────────────────────────────────────
  await getLeadQualificationQueue().add(
    "lead-qualification",
    { organizationId, leadListId, leadId },
    { jobId: `qualify-${leadId}` }
  );

  void runMode; // used above
  void incrementTokenUsage; // called in qualification stage where we have token counts
}
