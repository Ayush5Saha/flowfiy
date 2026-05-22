/**
 * Follow-up Scheduler + Reply Detection + AI Reply Classification
 *
 * Runs on a schedule (daily via Vercel Cron at 09:00 UTC) to:
 *   1. Poll Gmail threads for all active campaigns and mark replied leads so
 *      follow-ups are automatically stopped (reply detection runs FIRST so we
 *      never queue a follow-up for a lead who has already replied).
 *   2. When a reply is detected, use Claude (managed central key) to classify its intent:
 *      INTERESTED | NOT_INTERESTED | OOO | REFERRAL | UNSUBSCRIBE | OTHER
 *   3. Fire outgoing webhooks for reply.received and unsubscribe.received events.
 *   4. Find campaign leads where follow-up 1, 2, or 3 is now due and enqueue
 *      email jobs — respecting each lead's local timezone send window.
 */
import { prisma } from "@/lib/prisma";
import { enqueueEmailJob } from "@/workers/queues";
import { decryptCredentials } from "@/lib/encryption";
import { getGoogleOAuthClient } from "@/integrations/gmail";
import { google } from "googleapis";
import { getClaudeClient } from "@/ai/client";
import { CLAUDE_MODELS, TEMPERATURE } from "@/ai/config";
import { fireWebhookEvent } from "@/lib/webhooks";
import { resolveTimezone, isInSendWindow } from "@/lib/timezones";

const DAYS_MS = 24 * 60 * 60 * 1000;

export interface ScheduleResult {
  checked: number;
  queued: number;
  skipped: number;
  repliesDetected: number;
}

// ─── Reply Detection + AI Classification ─────────────────────────────────────

type ReplyIntent = "INTERESTED" | "NOT_INTERESTED" | "OOO" | "REFERRAL" | "UNSUBSCRIBE" | "OTHER";

function extractGmailBody(
  payload: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] | null } | null | undefined
): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }
  if (payload.parts?.length) {
    for (const part of payload.parts as typeof payload[]) {
      const text = extractGmailBody(part);
      if (text) return text;
    }
  }
  return "";
}

async function classifyReply(
  replyText: string,
  anthropic: ReturnType<typeof getClaudeClient>
): Promise<ReplyIntent> {
  const truncated = replyText.slice(0, 800);
  try {
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODELS.fast,
      max_tokens: 10,
      temperature: TEMPERATURE,
      system: `Classify this cold email reply into exactly one category. Reply with only the category name, nothing else.

Categories:
INTERESTED - wants to learn more, asks questions, wants a call/demo
NOT_INTERESTED - politely or firmly declines, no interest
OOO - out of office auto-reply or vacation message
REFERRAL - redirects to someone else in the company
UNSUBSCRIBE - asks to be removed, stop emailing, unsubscribe
OTHER - anything else`,
      messages: [{ role: "user", content: truncated }],
    });
    const raw = (msg.content[0] as { type: string; text: string }).text?.trim().toUpperCase();
    const VALID: ReplyIntent[] = ["INTERESTED", "NOT_INTERESTED", "OOO", "REFERRAL", "UNSUBSCRIBE", "OTHER"];
    return VALID.includes(raw as ReplyIntent) ? (raw as ReplyIntent) : "OTHER";
  } catch {
    return "OTHER";
  }
}

async function detectRepliesForAllCampaigns(): Promise<number> {
  let totalReplies = 0;

  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, organizationId: true },
  });

  const byOrg = new Map<string, string[]>();
  for (const c of activeCampaigns) {
    const list = byOrg.get(c.organizationId) ?? [];
    list.push(c.id);
    byOrg.set(c.organizationId, list);
  }

  for (const [organizationId, campaignIds] of byOrg) {
    const gmailIntegration = await prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "GMAIL" } },
      select: { status: true, encryptedCredentials: true },
    });
    if (!gmailIntegration || gmailIntegration.status !== "CONNECTED") continue;

    let refreshToken: string;
    try {
      ({ refreshToken } = decryptCredentials(gmailIntegration.encryptedCredentials));
    } catch {
      continue;
    }

    const auth = getGoogleOAuthClient();
    auth.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: "v1", auth });

    // Use the central managed Claude client — no per-org API key needed
    const anthropic = (() => {
      try { return getClaudeClient(); } catch { return null; }
    })();

    for (const campaignId of campaignIds) {
      const sentLeads = await prisma.campaignLead.findMany({
        where: {
          campaignId,
          status: "SENT",
          gmailThreadId: { not: null },
          lead: { status: { notIn: ["REPLIED"] } },
        },
        select: { id: true, gmailThreadId: true, leadId: true },
      });

      if (sentLeads.length === 0) continue;

      await Promise.allSettled(
        sentLeads.map(async (cl) => {
          if (!cl.gmailThreadId) return;
          try {
            const thread = await gmail.users.threads.get({
              userId: "me",
              id: cl.gmailThreadId,
              format: "full",
            });

            const messages = thread.data.messages ?? [];
            if (messages.length <= 1) return;

            const replyMsg = messages[messages.length - 1];
            const replyText = extractGmailBody(replyMsg.payload);
            const replySnippet = replyText.slice(0, 300).trim();

            const intent: ReplyIntent = anthropic && replyText
              ? await classifyReply(replyText, anthropic)
              : "OTHER";

            await prisma.$transaction([
              prisma.campaignLead.update({
                where: { id: cl.id },
                data: {
                  status: "REPLIED",
                  replyIntent: intent,
                  replySnippet: replySnippet || null,
                },
              }),
              prisma.lead.update({
                where: { id: cl.leadId },
                data: { status: "REPLIED" },
              }),
              prisma.campaign.update({
                where: { id: campaignId },
                data: { replyCount: { increment: 1 } },
              }),
            ]);

            // Feature 7: fire webhook for reply event
            void fireWebhookEvent(organizationId, "reply.received", {
              campaignLeadId: cl.id,
              campaignId,
              leadId: cl.leadId,
              intent,
              replySnippet,
            });

            if (intent === "UNSUBSCRIBE") {
              const lead = await prisma.lead.findUnique({
                where: { id: cl.leadId },
                select: { email: true },
              });
              if (lead?.email) {
                await prisma.suppressedEmail.upsert({
                  where: { organizationId_email: { organizationId, email: lead.email } },
                  create: { organizationId, email: lead.email, reason: "unsubscribed" },
                  update: { reason: "unsubscribed", suppressedAt: new Date() },
                });

                // Feature 7: fire webhook for unsubscribe
                void fireWebhookEvent(organizationId, "unsubscribe.received", {
                  campaignLeadId: cl.id,
                  campaignId,
                  leadId: cl.leadId,
                  email: lead.email,
                  source: "reply",
                });
              }
            }

            totalReplies++;
            console.log(`[reply-detect] ${cl.id} → ${intent}`);
          } catch {
            // Thread fetch failed — skip silently
          }
        })
      );
    }
  }

  return totalReplies;
}

export async function processFollowUpSchedule(): Promise<ScheduleResult> {
  // Step 0: Reply detection — must run FIRST
  const repliesDetected = await detectRepliesForAllCampaigns();

  const now = new Date();

  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      organizationId: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
      followUp3DelayDays: true,
    },
  });

  let checked = 0;
  let queued = 0;
  let skipped = 0;

  for (const campaign of activeCampaigns) {
    const fu1Threshold = new Date(now.getTime() - campaign.followUp1DelayDays * DAYS_MS);
    const fu2Threshold = new Date(now.getTime() - campaign.followUp2DelayDays * DAYS_MS);
    const fu3Threshold = new Date(now.getTime() - campaign.followUp3DelayDays * DAYS_MS);

    // ── Follow-up 1 ───────────────────────────────────────────────────────────
    const dueForFU1 = await prisma.campaignLead.findMany({
      where: {
        campaignId: campaign.id,
        status: "SENT",
        followUpStep: 1,
        followUp1SentAt: null,
        sentAt: { lte: fu1Threshold },
        lead: { status: { notIn: ["REPLIED"] } },
      },
      include: {
        outreachCopy: { select: { followUp1: true } },
        lead: { select: { timezone: true } },
      },
    });

    for (const cl of dueForFU1) {
      checked++;
      if (!cl.outreachCopy?.followUp1) { skipped++; continue; }

      // Feature 9: timezone-aware window check (scheduler-side pre-filter)
      const tz = resolveTimezone(cl.lead.timezone, null);
      if (!isInSendWindow(tz, now)) {
        skipped++;
        continue; // will be checked again on next cron run
      }

      await enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 1,
      });
      queued++;
    }

    // ── Follow-up 2 ───────────────────────────────────────────────────────────
    const dueForFU2 = await prisma.campaignLead.findMany({
      where: {
        campaignId: campaign.id,
        status: "SENT",
        followUpStep: 2,
        followUp1SentAt: { not: null, lte: fu2Threshold },
        followUp2SentAt: null,
        lead: { status: { notIn: ["REPLIED"] } },
      },
      include: {
        outreachCopy: { select: { followUp2: true } },
        lead: { select: { timezone: true } },
      },
    });

    for (const cl of dueForFU2) {
      checked++;
      if (!cl.outreachCopy?.followUp2) { skipped++; continue; }

      const tz = resolveTimezone(cl.lead.timezone, null);
      if (!isInSendWindow(tz, now)) { skipped++; continue; }

      await enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 2,
      });
      queued++;
    }

    // ── Feature 8: Follow-up 3 ────────────────────────────────────────────────
    const dueForFU3 = await prisma.campaignLead.findMany({
      where: {
        campaignId: campaign.id,
        status: "SENT",
        followUpStep: 3,
        followUp2SentAt: { not: null, lte: fu3Threshold },
        followUp3SentAt: null,
        lead: { status: { notIn: ["REPLIED"] } },
      },
      include: {
        outreachCopy: { select: { followUp3: true } },
        lead: { select: { timezone: true } },
      },
    });

    for (const cl of dueForFU3) {
      checked++;
      if (!cl.outreachCopy?.followUp3) { skipped++; continue; }

      const tz = resolveTimezone(cl.lead.timezone, null);
      if (!isInSendWindow(tz, now)) { skipped++; continue; }

      await enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 3,
      });
      queued++;
    }
  }

  console.log(
    `[followup-scheduler] checked=${checked} queued=${queued} skipped=${skipped} repliesDetected=${repliesDetected}`
  );
  return { checked, queued, skipped, repliesDetected };
}
