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
import { finalizeOrTopUp } from "@/lib/pipeline-finalization";
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
    await finalizeOrTopUp(leadListId, organizationId, log);
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
    await finalizeOrTopUp(leadListId, organizationId, log);
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

  let result: Awaited<ReturnType<typeof runPersonalization>>;
  try {
    result = await runPersonalization(
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const maxAttempts = job.opts.attempts ?? 3;
    if ((job.attemptsMade ?? 0) < maxAttempts - 1) {
      // Transient — let BullMQ retry this lead.
      await log(`⚠️ Email writing failed for ${lead.companyName ?? "lead"} (will retry): ${msg}`, "error");
      throw err;
    }
    // Final attempt — save a basic draft so the qualified lead isn't stuck
    // without copy (which would hang list finalization). isApproved stays false.
    await log(`❌ Email writing failed for ${lead.companyName ?? "lead"} after ${maxAttempts} attempts: ${msg}. Saving a basic draft to review.`, "error");
    const firstName = lead.firstName ?? "there";
    result = {
      subjectLine: `Quick idea for ${lead.companyName ?? "your team"}`,
      emailBody:
        `Hi ${firstName},\n\n` +
        `I work with ${businessProfile.companyName} (${businessProfile.serviceOffered}). ` +
        `${bestAngle || "I had an idea that could help your team."}\n\n` +
        `Worth a quick chat?${calendlyLink ? ` You can grab a time here: ${calendlyLink}` : ""}\n\n` +
        `Best,\n${businessProfile.companyName}\n\n` +
        `[Auto-generated draft — AI personalization was unavailable. Please review/edit before sending.]`,
      followUp1: `Hi ${firstName}, just following up on my note above — open to a quick chat?`,
      followUp2: `Hi ${firstName}, circling back one more time in case this got buried.`,
      followUp3: `Hi ${firstName}, I'll close the loop here — feel free to reach out anytime.`,
    };
  }

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
  await finalizeOrTopUp(leadListId, organizationId, log);
}

