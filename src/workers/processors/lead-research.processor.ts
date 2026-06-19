/**
 * Queue: lead-research
 *
 * Stage 2 of the 4-queue pipeline. For each lead:
 *   1. Reads the company website in-house (plain fetch + HTML→text — no Apify)
 *   2. Runs the Company Analyzer agent (Gemini) to extract structured intel
 *   3. Saves a LeadResearch record
 *   4. Enqueues a lead-qualification job for this lead
 *
 * Apify is used ONLY for Google Maps discovery (stage 1). All research — website
 * reading, analysis, qualification — is done by Gemini here.
 *
 * Runs at concurrency=10 — 10 leads researched simultaneously.
 * Idempotent: if LeadResearch already exists, skips to enqueueing qualification.
 */
import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { getCentralLLMClient } from "@/ai/client";
import { incrementTokenUsage } from "@/lib/usage";
import { runCompanyAnalyzer } from "@/ai/agents/company-analyzer";
import { scrapeWebsiteForProfile } from "@/lib/website-scraper";
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
  const { client, mode: runMode } = getCentralLLMClient("companyAnalyzer");

  // ── Website reading (in-house, no Apify) ──────────────────────────────────
  // Plain fetch + HTML→text of the homepage and a few high-signal subpages,
  // SSRF-guarded. The text is fed to Gemini below. Failures are non-fatal — the
  // analyzer can still score on the basic lead data.
  let websiteContent = "";

  if (lead.companyWebsite) {
    await log(`🌐 Reading ${lead.companyWebsite}`, "tool");
    try {
      const { pages } = await scrapeWebsiteForProfile(lead.companyWebsite);
      websiteContent = pages
        .map((p) => p.text)
        .join("\n\n")
        .slice(0, INPUT_LIMITS.websiteContent);
    } catch (err) {
      await log(
        `Couldn't read ${lead.companyWebsite} (${err instanceof Error ? err.message : "unreachable"}) — analyzing with available data`,
        "info"
      );
    }
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
