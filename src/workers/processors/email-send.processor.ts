import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { sendGmail } from "@/integrations/gmail";

export interface EmailSendJobData {
  campaignLeadId: string;
  organizationId: string;
}

export async function processEmailSend(job: Job<EmailSendJobData>) {
  const { campaignLeadId, organizationId } = job.data;

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

  const gmailIntegration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: "GMAIL" } },
  });

  if (!gmailIntegration || gmailIntegration.status !== "CONNECTED") {
    throw new Error("Gmail not connected");
  }

  const { refreshToken, emailAddress } = decryptCredentials(gmailIntegration.encryptedCredentials);
  const fromAddress = campaignLead.campaign.gmailFromAddress ?? emailAddress;

  const { messageId, threadId } = await sendGmail({
    refreshToken,
    to: campaignLead.lead.email,
    from: fromAddress,
    subject: campaignLead.outreachCopy.subjectLine ?? "",
    body: campaignLead.outreachCopy.body,
  });

  await prisma.campaignLead.update({
    where: { id: campaignLeadId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      gmailMessageId: messageId,
      gmailThreadId: threadId,
    },
  });

  await prisma.campaign.update({
    where: { id: campaignLead.campaignId },
    data: { sentCount: { increment: 1 } },
  });
}
