import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  // Mark/unmark a meeting booking — stored on the Lead, not CampaignLead
  meetingBooked: z.boolean().optional(),
  // Manually mark a CampaignLead status (SENT → REPLIED, etc.)
  status: z.enum(["PENDING", "SENT", "REPLIED", "BOUNCED", "UNSUBSCRIBED"]).optional(),
});

// ── PATCH /api/campaigns/[id]/campaign-leads/[clId] ───────────────────────────
// Toggle meeting-booked on a campaign lead's underlying Lead record
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; clId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId, clId } = await params;

  // Verify campaign access
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, organizationId: true, meetingCount: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const campaignLead = await prisma.campaignLead.findFirst({
    where: { id: clId, campaignId },
    select: { id: true, leadId: true, status: true, lead: { select: { status: true } } },
  });
  if (!campaignLead) return NextResponse.json({ error: "Campaign lead not found" }, { status: 404 });

  // Handle CampaignLead status change (e.g. manually mark as REPLIED)
  if (parsed.data.status !== undefined) {
    const newStatus = parsed.data.status;
    const wasReplied = campaignLead.status === "REPLIED";
    const isNowReplied = newStatus === "REPLIED";

    await prisma.campaignLead.update({
      where: { id: clId },
      data: { status: newStatus },
    });

    // Sync lead status
    if (isNowReplied) {
      await prisma.lead.update({
        where: { id: campaignLead.leadId },
        data: { status: "REPLIED" },
      });
      if (!wasReplied) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { replyCount: { increment: 1 } },
        });
      }
    } else if (wasReplied && !isNowReplied) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { replyCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ ok: true, status: newStatus });
  }

  // Handle meeting booked toggle
  const wasBooked = campaignLead.lead.status === "MEETING_BOOKED";
  const markBooked = parsed.data.meetingBooked;

  if (markBooked === undefined || wasBooked === markBooked) {
    return NextResponse.json({ ok: true, meetingBooked: wasBooked });
  }

  await prisma.lead.update({
    where: { id: campaignLead.leadId },
    data: { status: markBooked ? "MEETING_BOOKED" : "REPLIED" },
  });

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { meetingCount: { increment: markBooked ? 1 : -1 } },
  });

  return NextResponse.json({ ok: true, meetingBooked: markBooked });
}
