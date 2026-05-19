import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const timingSchema = z.object({
  followUp1DelayDays: z
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .max(30, "Cannot exceed 30 days")
    .optional(),
  followUp2DelayDays: z
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .max(60, "Cannot exceed 60 days")
    .optional(),
  followUp3DelayDays: z
    .number()
    .int()
    .min(1, "Must be at least 1 day")
    .max(90, "Cannot exceed 90 days")
    .optional(),
  abTestEnabled: z.boolean().optional(),
}).refine(
  (d) => {
    if (d.followUp1DelayDays && d.followUp2DelayDays) {
      return d.followUp2DelayDays > d.followUp1DelayDays;
    }
    return true;
  },
  { message: "Follow-up 2 delay must be greater than follow-up 1 delay" }
).refine(
  (d) => {
    if (d.followUp2DelayDays && d.followUp3DelayDays) {
      return d.followUp3DelayDays > d.followUp2DelayDays;
    }
    return true;
  },
  { message: "Follow-up 3 delay must be greater than follow-up 2 delay" }
);

/**
 * PATCH /api/campaigns/[id]/timing
 *
 * Update timing settings and A/B test toggle for a campaign.
 * Changes take effect immediately — the cron uses the new values on next run.
 *
 * Body (all optional):
 *   followUp1DelayDays  number   Days after initial email to send FU1 (1–30)
 *   followUp2DelayDays  number   Days after FU1 to send FU2 (1–60)
 *   followUp3DelayDays  number   Days after FU2 to send FU3 (1–90)
 *   abTestEnabled       boolean  Enable A/B variant testing for this campaign
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
      followUp3DelayDays: true,
      abTestEnabled: true,
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

  const updateData: Record<string, unknown> = {};
  if (parsed.data.followUp1DelayDays !== undefined) updateData.followUp1DelayDays = parsed.data.followUp1DelayDays;
  if (parsed.data.followUp2DelayDays !== undefined) updateData.followUp2DelayDays = parsed.data.followUp2DelayDays;
  if (parsed.data.followUp3DelayDays !== undefined) updateData.followUp3DelayDays = parsed.data.followUp3DelayDays;
  if (parsed.data.abTestEnabled !== undefined) updateData.abTestEnabled = parsed.data.abTestEnabled;

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: updateData as never,
    select: {
      id: true,
      status: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
      followUp3DelayDays: true,
      abTestEnabled: true,
    },
  });

  const [pendingFU1, pendingFU2, pendingFU3] = await Promise.all([
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 1, followUp1SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 2, followUp2SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 3, followUp3SentAt: null, status: "SENT" },
    }),
  ]);

  return NextResponse.json({
    campaign: updated,
    affected: {
      followUp1Pending: pendingFU1,
      followUp2Pending: pendingFU2,
      followUp3Pending: pendingFU3,
      message:
        `Settings updated. ${pendingFU1 + pendingFU2 + pendingFU3} pending follow-ups ` +
        `will use the new settings when the scheduler next runs.`,
    },
  });
}

/**
 * GET /api/campaigns/[id]/timing
 * Returns current timing settings and pending follow-up counts.
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
      organizationId: true,
      status: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
      followUp3DelayDays: true,
      abTestEnabled: true,
    },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const memberCheck = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!memberCheck) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [pendingFU1, pendingFU2, pendingFU3, sentCount] = await Promise.all([
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 1, followUp1SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 2, followUp2SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, followUpStep: 3, followUp3SentAt: null, status: "SENT" },
    }),
    prisma.campaignLead.count({
      where: { campaignId, status: "SENT" },
    }),
  ]);

  return NextResponse.json({
    timing: {
      followUp1DelayDays: campaign.followUp1DelayDays,
      followUp2DelayDays: campaign.followUp2DelayDays,
      followUp3DelayDays: campaign.followUp3DelayDays,
    },
    abTestEnabled: campaign.abTestEnabled,
    pending: {
      followUp1: pendingFU1,
      followUp2: pendingFU2,
      followUp3: pendingFU3,
    },
    sent: sentCount,
    description: {
      followUp1: `Sent ${campaign.followUp1DelayDays} day(s) after the initial email`,
      followUp2: `Sent ${campaign.followUp2DelayDays} day(s) after follow-up 1`,
      followUp3: `Sent ${campaign.followUp3DelayDays} day(s) after follow-up 2 (final breakup email)`,
    },
  });
}
