import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { sendGmail } from "@/integrations/gmail";
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

  if (!campaignLead || !campaignLead.outreachCopy || !campaignLead.lead.email) {
    throw new Error(`Campaign lead ${campaignLeadId} missing required data`);
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

  // ── Send the email ────────────────────────────────────────────────────────
  // Follow-ups go in the same Gmail thread as the initial email
  const { messageId, threadId } = await sendGmail({
    refreshToken,
    to: lead.email!,
    from: fromAddress,
    subject: step === 0
      ? (outreachCopy.subjectLine ?? "")
      : `Re: ${outreachCopy.subjectLine ?? ""}`,
    body: emailContent,
    // Thread follow-ups into the original conversation
    replyToMessageId: step > 0 ? (campaignLead.gmailMessageId ?? undefined) : undefined,
    threadId: step > 0 ? (campaignLead.gmailThreadId ?? undefined) : undefined,
  });

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
      // Store thread info from initial send so follow-ups can thread correctly
      gmailMessageId: step === 0 ? messageId : campaignLead.gmailMessageId,
      gmailThreadId: step === 0 ? threadId : campaignLead.gmailThreadId,
    },
  });

  // Increment campaign sent counter on initial send
  if (step === 0) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: { increment: 1 } },
    });
  }

  // Follow-ups are NOT pre-scheduled here.
  // The follow-up cron (POST /api/campaigns/process-followups) checks the DB
  // every hour and queues follow-ups when they are due based on the campaign's
  // current delay settings — so users can change timing anytime.

  console.log(
    `[email] Sent step ${step} for ${campaignLeadId} — thread: ${threadId}`
  );
}

// ─── Helper: pick the right email body for each step ─────────────────────────

function resolveEmailContent(
  step: number,
  outreachCopy: { body: string; followUp1?: string | null; followUp2?: string | null }
): string | null {
  switch (step) {
    case 0: return outreachCopy.body || null;
    case 1: return outreachCopy.followUp1 || null;
    case 2: return outreachCopy.followUp2 || null;
    default: return null;
  }
}
