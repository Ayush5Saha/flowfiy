import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const timingSchema = z.object({
  followUp1DelayDays: z
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .max(30, "Cannot exceed 30 days"),
  followUp2DelayDays: z
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .max(60, "Cannot exceed 60 days"),
}).refine(
  (d) => d.followUp2DelayDays > d.followUp1DelayDays,
  { message: "Follow-up 2 delay must be greater than follow-up 1 delay" }
);

/**
 * PATCH /api/campaigns/[id]/timing
 *
 * Update the follow-up send delays for a campaign.
 * Changes take effect immediately — the hourly cron will use the new values
 * the next time it runs, so already-unsent follow-ups automatically respect
 * the updated timing.
 *
 * Body:
 *   followUp1DelayDays  number  Days after initial email to send follow-up 1  (1–30)
 *   followUp2DelayDays  number  Days after initial email to send follow-up 2  (1–60)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
    },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = timingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { followUp1DelayDays, followUp2DelayDays } = parsed.data;

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { followUp1DelayDays, followUp2DelayDays },
    select: {
      id: true,
      status: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
    },
  });

  // Compute how many pending follow-ups will be affected by this change
  const [pendingFU1, pendingFU2] = await Promise.all([
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 1, followUp1SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 2, followUp2SentAt: null, status: "SENT" },
    }),
  ]);

  return NextResponse.json({
    campaign: updated,
    affected: {
      followUp1Pending: pendingFU1,
      followUp2Pending: pendingFU2,
      message:
        `Timing updated. ${pendingFU1} follow-up 1s and ${pendingFU2} follow-up 2s ` +
        `will use the new delays when the scheduler next runs.`,
    },
  });
}

/**
 * GET /api/campaigns/[id]/timing
 * Returns the current timing settings and counts of pending follow-ups.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      status: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
    },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  // Re-fetch organizationId (not in the first select)
  const fullCampaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { organizationId: true },
  });
  if (!fullCampaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberCheck = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: fullCampaign.organizationId, userId: user.id } },
  });
  if (!memberCheck) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Stats on pending follow-ups
  const [pendingFU1, pendingFU2, sentCount] = await Promise.all([
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 1, followUp1SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 2, followUp2SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, status: "SENT" },
    }),
  ]);

  return NextResponse.json({
    timing: {
      followUp1DelayDays: campaign.followUp1DelayDays,
      followUp2DelayDays: campaign.followUp2DelayDays,
    },
    pending: {
      followUp1: pendingFU1,
      followUp2: pendingFU2,
    },
    sent: sentCount,
    description: {
      followUp1: `Sent ${campaign.followUp1DelayDays} day(s) after the initial email`,
      followUp2: `Sent ${campaign.followUp2DelayDays} day(s) after the initial email`,
    },
  });
}
