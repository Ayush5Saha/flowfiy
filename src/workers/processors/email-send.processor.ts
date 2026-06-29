import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { sendGmail } from "@/integrations/gmail";
import { buildUnsubscribeUrl, buildTrackingPixelUrl } from "@/lib/unsubscribe";
import { fireWebhookEvent } from "@/lib/webhooks";
import { resolveTimezone, isInSendWindow, getLocalTimeString, msUntilSendWindow } from "@/lib/timezones";
import { enqueueEmailJob } from "@/workers/queues";
import type { EmailJobData } from "@/workers/queues";

export type { EmailJobData };

export async function processEmailSend(job: Job<EmailJobData>) {
  const { campaignLeadId, organizationId, step = 0 } = job.data;

  // ── Load campaign lead with all relations ────────────────────────────────
  const campaignLead = await prisma.campaignLead.findUnique({
    where: { id: campaignLeadId },
    include: {
      lead: true,
      campaign: true,
      outreachCopy: true,
    },
  });

  if (!campaignLead || !campaignLead.outreachCopy) {
    throw new Error(`Campaign lead ${campaignLeadId} missing required data`);
  }

  // No email address = nothing to deliver to (common for Google Maps leads).
  // Skip gracefully instead of throwing — a throw would burn the 2 retries and
  // leave the lead silently stuck at PENDING. Leaving it PENDING means a future
  // re-launch will pick it up automatically once an email is added.
  if (!campaignLead.lead.email) {
    console.log(`[email] Skipping ${campaignLeadId} — lead has no email address`);
    return;
  }

  const { campaign, outreachCopy, lead } = campaignLead;

  // ── Skip if lead has replied or unsubscribed ─────────────────────────────
  if (campaignLead.status === "REPLIED" || campaignLead.status === "UNSUBSCRIBED") {
    console.log(`[email] Skipping ${campaignLeadId} — status: ${campaignLead.status}`);
    return;
  }

  // ── Skip if campaign is no longer active ─────────────────────────────────
  if (campaign.status !== "ACTIVE") {
    console.log(`[email] Skipping ${campaignLeadId} — campaign ${campaign.id} is ${campaign.status}`);
    return;
  }

  // ── Timezone-aware send window check ─────────────────────────────────────
  // Only gate by the 08:00–18:00 window when we actually KNOW the lead's
  // timezone. Most leads have no timezone, and gating those by an arbitrary
  // UTC window silently blocked all sends. When the timezone is known and we're
  // outside the window, DEFER the email to the next window (re-enqueue with a
  // delay) instead of throwing — the queue only allows 2 quick retries, which
  // can't span the hours until the window reopens, so a throw would drop it.
  if (lead.timezone) {
    const leadTimezone = resolveTimezone(lead.timezone, null);
    if (!isInSendWindow(leadTimezone)) {
      const delayMs = msUntilSendWindow(leadTimezone);
      const localTime = getLocalTimeString(leadTimezone);
      console.log(
        `[email] Deferring ${campaignLeadId} — outside send window (${localTime} in ${leadTimezone}); retry in ~${Math.round(delayMs / 60000)} min`
      );
      await enqueueEmailJob({ campaignLeadId, organizationId, step }, delayMs);
      return;
    }
  }

  // ── Check suppression list — never email a lead who opted out ────────────
  if (lead.email) {
    const suppressed = await prisma.suppressedEmail.findUnique({
      where: { organizationId_email: { organizationId, email: lead.email } },
    });
    if (suppressed) {
      console.log(`[email] Skipping ${campaignLeadId} — ${lead.email} is suppressed (${suppressed.reason})`);
      await prisma.campaignLead.update({
        where: { id: campaignLeadId },
        data: { status: "UNSUBSCRIBED" },
      });
      return;
    }
  }

  // ── Cross-campaign deduplication — skip initial sends to already-contacted leads ──
  if (step === 0 && lead.email) {
    const alreadyContacted = await prisma.campaignLead.findFirst({
      where: {
        id: { not: campaignLeadId },
        lead: { email: lead.email, organizationId },
        status: { in: ["SENT", "OPENED", "REPLIED"] },
        campaign: { status: { in: ["ACTIVE", "COMPLETED"] } },
      },
      select: { id: true, campaignId: true },
    });
    if (alreadyContacted) {
      console.log(`[email] Skipping ${campaignLeadId} — already contacted in campaign ${alreadyContacted.campaignId}`);
      await prisma.campaignLead.update({
        where: { id: campaignLeadId },
        data: { status: "SENT", sentAt: new Date(), followUpStep: 1 },
      });
      return;
    }
  }

  // ── Resolve the email body for this step ─────────────────────────────────
  const emailContent = resolveEmailContent(step, outreachCopy);
  if (!emailContent) {
    console.log(`[email] No content for step ${step} on ${campaignLeadId} — sequence complete`);
    return;
  }

  // ── Load Gmail credentials ────────────────────────────────────────────────
  const gmailIntegration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: "GMAIL" } },
  });

  if (!gmailIntegration || gmailIntegration.status !== "CONNECTED") {
    throw new Error("Gmail not connected");
  }

  const { refreshToken, emailAddress } = decryptCredentials(gmailIntegration.encryptedCredentials);
  const fromAddress = campaign.gmailFromAddress ?? emailAddress;

  // ── Build HTML email with tracking pixel + unsubscribe footer ───────────
  const htmlBody = buildHtmlEmail(emailContent, campaignLeadId, lead.email!);

  // ── Send the email (with bounce detection) ───────────────────────────────
  let messageId: string;
  let threadId: string;
  try {
    ({ messageId, threadId } = await sendGmail({
      refreshToken,
      to: lead.email!,
      from: fromAddress,
      subject: step === 0
        ? (outreachCopy.subjectLine ?? "")
        : `Re: ${outreachCopy.subjectLine ?? ""}`,
      body: emailContent,
      htmlBody,
      replyToMessageId: step > 0 ? (campaignLead.gmailMessageId ?? undefined) : undefined,
      threadId: step > 0 ? (campaignLead.gmailThreadId ?? undefined) : undefined,
    }));
  } catch (sendErr) {
    const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
    const bounceReason = classifyBounce(errMsg);

    console.error(`[email] Send failed for ${campaignLeadId} — ${bounceReason}: ${errMsg}`);

    await prisma.campaignLead.update({
      where: { id: campaignLeadId },
      data: { status: "BOUNCED", bounceReason },
    });

    if (bounceReason === "HARD" && lead.email) {
      await prisma.suppressedEmail.upsert({
        where: { organizationId_email: { organizationId, email: lead.email } },
        create: { organizationId, email: lead.email, reason: "bounced" },
        update: { reason: "bounced", suppressedAt: new Date() },
      });

      // Feature 7: fire webhook on hard bounce
      void fireWebhookEvent(organizationId, "bounce.detected", {
        campaignLeadId,
        campaignId: campaign.id,
        leadId: lead.id,
        email: lead.email,
        bounceReason,
      });
    }

    return;
  }

  // ── Persist send status ───────────────────────────────────────────────────
  const now = new Date();
  await prisma.campaignLead.update({
    where: { id: campaignLeadId },
    data: {
      status: "SENT",
      followUpStep: step + 1,
      sentAt: step === 0 ? now : campaignLead.sentAt,
      followUp1SentAt: step === 1 ? now : campaignLead.followUp1SentAt,
      followUp2SentAt: step === 2 ? now : campaignLead.followUp2SentAt,
      followUp3SentAt: step === 3 ? now : campaignLead.followUp3SentAt,
      gmailMessageId: step === 0 ? messageId : campaignLead.gmailMessageId,
      gmailThreadId: step === 0 ? threadId : campaignLead.gmailThreadId,
    },
  });

  if (step === 0) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: { increment: 1 } },
    });
  }

  console.log(`[email] Sent step ${step} for ${campaignLeadId} — thread: ${threadId}`);
}

// ─── Helper: classify send error as bounce type ───────────────────────────────

function classifyBounce(errMsg: string): string {
  const lower = errMsg.toLowerCase();
  if (
    lower.includes("550") ||
    lower.includes("551") ||
    lower.includes("553") ||
    lower.includes("user unknown") ||
    lower.includes("no such user") ||
    lower.includes("invalid address") ||
    lower.includes("does not exist") ||
    lower.includes("address rejected")
  ) return "HARD";

  if (
    lower.includes("spam") ||
    lower.includes("blocked") ||
    lower.includes("policy") ||
    lower.includes("554")
  ) return "SPAM";

  return "SOFT";
}

// ─── Helper: pick the right email body for each step ─────────────────────────

function resolveEmailContent(
  step: number,
  outreachCopy: { body: string; followUp1?: string | null; followUp2?: string | null; followUp3?: string | null }
): string | null {
  switch (step) {
    case 0: return outreachCopy.body || null;
    case 1: return outreachCopy.followUp1 || null;
    case 2: return outreachCopy.followUp2 || null;
    case 3: return outreachCopy.followUp3 || null;  // Feature 8: third follow-up
    default: return null;
  }
}

// ─── Helper: wrap plain-text content in HTML with pixel + unsubscribe ─────────

function buildHtmlEmail(
  plainText: string,
  campaignLeadId: string,
  toEmail: string
): string {
  const bodyHtml = plainText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const pixelUrl = buildTrackingPixelUrl(campaignLeadId);
  const unsubUrl = buildUnsubscribeUrl(campaignLeadId, toEmail);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;">
  <div style="max-width:600px;padding:20px;">
    ${bodyHtml}
  </div>
  <div style="max-width:600px;padding:8px 20px 20px;border-top:1px solid #eee;margin-top:16px;">
    <p style="font-size:11px;color:#999;margin:0;">
      You received this email because your information is publicly listed.
      If you'd prefer not to hear from us,
      <a href="${unsubUrl}" style="color:#999;">unsubscribe here</a>.
    </p>
  </div>
  <img src="${pixelUrl}" width="1" height="1" style="display:none;border:0;" alt="" />
</body>
</html>`;
}
