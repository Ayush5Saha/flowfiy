/**
 * Queue: lead-personalization
 *
 * Stage 4 of the 4-queue pipeline. For each qualified lead:
 *   1. Loads the LeadResearch record (angles, hooks, pain points from stage 2+3)
 *   2. Loads the BusinessProfile (sender context, tone, Calendly link)
 *   3. Runs the Personalization agent (Claude Sonnet) — writes subject, body, 3 follow-ups
 *   4. Creates an OutreachCopy record (isApproved: false — user reviews before sending)
 *   5. Checks finalization — if all leads done, marks LeadList READY
 *
 * Runs at concurrency=10.
 * Idempotent: if OutreachCopy already exists for this lead, skips to finalization check.
 */
import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getClaudeClientForOrg } from "@/ai/client";
import { incrementTokenUsage } from "@/lib/usage";
import { runPersonalization } from "@/ai/agents/personalization";
import { fireWebhookEvent } from "@/lib/webhooks";
import { appendLog } from "@/lib/job-logs";

export interface LeadPersonalizationJobData {
  organizationId: string;
  leadListId: string;
  leadId: string;
}

export async function processLeadPersonalization(job: Job<LeadPersonalizationJobData>) {
  const { organizationId, leadListId, leadId } = job.data;

  const log = (msg: string, level: "info" | "success" | "error" | "tool" = "info") =>
    appendLog(leadListId, msg, level);

  // ── Idempotency: skip if OutreachCopy already exists ─────────────────────
  const existingCopy = await prisma.outreachCopy.findFirst({
    where: { leadId, organizationId },
    select: { id: true },
  });

  if (existingCopy) {
    // Already personalized — just check if pipeline is complete
    await checkFinalization(leadListId, organizationId, log);
    return;
  }

  // ── Load lead + research ──────────────────────────────────────────────────
  const [lead, research] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        organizationId: true,
        firstName: true,
        lastName: true,
        title: true,
        companyName: true,
        industry: true,
        status: true,
      },
    }),
    prisma.leadResearch.findUnique({
      where: { leadId },
      select: {
        opportunityAngle: true,
        painPointMatch: true,
        personalizationNotes: true,
        researchMetadata: true,
      },
    }),
  ]);

  if (!lead || lead.organizationId !== organizationId) {
    throw new Error(`Lead ${leadId} not found or access denied.`);
  }

  // Safety: only personalize qualified leads
  if (lead.status !== "QUALIFIED") {
    await checkFinalization(leadListId, organizationId, log);
    return;
  }

  // ── Load business profile + Calendly integration ──────────────────────────
  const [businessProfile, calendlyIntegration] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { organizationId },
      select: {
        companyName: true,
        serviceOffered: true,
        offerPositioning: true,
        outreachTone: true,
      },
    }),
    prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "CALENDLY" } },
      select: { encryptedCredentials: true, status: true },
    }),
  ]);

  if (!businessProfile) {
    throw new Error(`Business profile not found for org ${organizationId}`);
  }

  const calendlyLink =
    calendlyIntegration?.status === "CONNECTED" && calendlyIntegration.encryptedCredentials
      ? ((decryptCredentials(calendlyIntegration.encryptedCredentials) as { schedulingLink?: string })
          .schedulingLink ?? undefined)
      : undefined;

  // ── Parse personalization hooks from research ─────────────────────────────
  const metadata = research?.researchMetadata as Record<string, unknown> | null;
  const personalizationHooks: string[] = Array.isArray(metadata?.hooks)
    ? (metadata!.hooks as string[])
    : research?.personalizationNotes
    ? research.personalizationNotes.split(" | ").filter(Boolean)
    : [];

  const bestAngle = research?.opportunityAngle ?? "Streamline their operations and grow revenue";
  const painPointMatch = research?.painPointMatch ?? "Operational inefficiencies and growth bottlenecks";

  // ── Run Personalization Agent (Sonnet) ────────────────────────────────────
  const { client, mode: runMode } = await getClaudeClientForOrg(organizationId);

  await log(`✍️  Writing personalized email for ${lead.companyName ?? "lead"}`, "tool");

  const result = await runPersonalization(
    client,
    {
      lead: {
        firstName: lead.firstName ?? undefined,
        lastName: lead.lastName ?? undefined,
        title: lead.title ?? undefined,
        companyName: lead.companyName ?? undefined,
        industry: lead.industry ?? undefined,
      },
      businessProfile: {
        companyName: businessProfile.companyName,
        serviceOffered: businessProfile.serviceOffered,
        offerPositioning: businessProfile.offerPositioning,
        outreachTone: businessProfile.outreachTone,
      },
      bestAngle,
      painPointMatch,
      personalizationHooks,
      calendlyLink,
    },
    runMode
  );

  // ── Save OutreachCopy ─────────────────────────────────────────────────────
  await prisma.outreachCopy.create({
    data: {
      leadId,
      organizationId,
      channel: "email",
      subjectLine: result.subjectLine,
      body: result.emailBody,
      followUp1: result.followUp1,
      followUp2: result.followUp2,
      followUp3: result.followUp3,
      isApproved: false,
    },
  });

  await log(
    `✅ Email copy ready for ${lead.companyName ?? "lead"} — "${result.subjectLine}"`,
    "success"
  );

  // ── Token tracking (CENTRAL mode only) ───────────────────────────────────
  if (runMode === "CENTRAL") {
    // Sonnet call: ~800 input tokens (cached system) + ~400 output ≈ 1200 total
    await incrementTokenUsage(organizationId, 1200).catch(() => null);
  }

  // ── Finalization check ────────────────────────────────────────────────────
  await checkFinalization(leadListId, organizationId, log);
}

// ─── Finalization check ───────────────────────────────────────────────────────
//
// The single trigger point for marking a LeadList as READY.
// Called after every personalized lead (and on idempotent skips).
// Checks that:
//   - No leads still in RESEARCHING state (qualification not yet run)
//   - No qualified leads without outreach copy (personalization not yet run)
// If both conditions are met → update LeadList to READY + fire completion webhook.

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
        outreachCopies: { none: {} }, // qualified but email not yet written
      },
    }),
  ]);

  if (researchingCount > 0 || pendingPersonalizationCount > 0) return;

  // All leads processed — check if we're the first worker to get here
  const list = await prisma.leadList.findUnique({
    where: { id: leadListId },
    select: { status: true },
  });

  // Guard: don't overwrite if already READY (another worker beat us to it)
  if (list?.status === "READY") return;

  const [totalLeads, qualifiedLeads] = await Promise.all([
    prisma.lead.count({ where: { leadListId } }),
    prisma.lead.count({ where: { leadListId, status: "QUALIFIED" } }),
  ]);

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
    `🎉 Pipeline complete! ${totalLeads} leads processed, ${qualifiedLeads} qualified with personalised outreach ready.`,
    "success"
  );

  // Fire completion webhook
  await fireWebhookEvent(organizationId, "lead_list.generation_complete", {
    leadListId,
    totalLeads,
    qualifiedLeads,
  }).catch(() => null);
}
