import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getGoogleOAuthClient } from "@/integrations/gmail";
import { google } from "googleapis";

// ── POST /api/campaigns/[id]/replies ────────────────────────────────────────
// Polls Gmail for replies on all sent threads in this campaign.
// Marks replying leads as REPLIED so follow-ups stop.
// Call this via a cron job (e.g. every hour) or trigger manually.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, organizationId: true, status: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Load Gmail credentials
  const gmailIntegration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId: campaign.organizationId, type: "GMAIL" } },
  });
  if (!gmailIntegration || gmailIntegration.status !== "CONNECTED") {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  const { refreshToken } = decryptCredentials(gmailIntegration.encryptedCredentials);
  const auth = getGoogleOAuthClient();
  auth.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth });

  // Get all sent campaign leads with a Gmail thread ID
  const sentLeads = await prisma.campaignLead.findMany({
    where: {
      campaignId,
      status: "SENT",
      gmailThreadId: { not: null },
    },
    select: { id: true, gmailThreadId: true, leadId: true },
  });

  if (sentLeads.length === 0) {
    return NextResponse.json({ checked: 0, repliesFound: 0 });
  }

  let repliesFound = 0;

  await Promise.allSettled(
    sentLeads.map(async (cl) => {
      if (!cl.gmailThreadId) return;

      try {
        // Fetch the Gmail thread — if it has > 1 message, someone replied
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: cl.gmailThreadId,
          format: "minimal",
        });

        const messageCount = thread.data.messages?.length ?? 1;

        if (messageCount > 1) {
          // There's a reply — stop follow-ups
          await prisma.campaignLead.update({
            where: { id: cl.id },
            data: { status: "REPLIED" },
          });

          await prisma.lead.update({
            where: { id: cl.leadId },
            data: { status: "REPLIED" },
          });

          await prisma.campaign.update({
            where: { id: campaignId },
            data: { replyCount: { increment: 1 } },
          });

          repliesFound++;
        }
      } catch {
        // Thread fetch failed — skip silently (token refresh issues, deleted thread, etc.)
      }
    })
  );

  return NextResponse.json({
    checked: sentLeads.length,
    repliesFound,
    message: `Checked ${sentLeads.length} threads. Found ${repliesFound} new replies.`,
  });
}
