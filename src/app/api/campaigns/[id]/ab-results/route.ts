/**
 * GET /api/campaigns/[id]/ab-results
 *
 * Returns A/B test performance breakdown for a campaign.
 * Aggregates sent, opened, replied, and meeting counts per variant (A / B)
 * so users can identify the better-performing copy.
 *
 * Only returns data when abTestEnabled = true on the campaign.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface VariantStats {
  variant: string;
  sent: number;
  opened: number;
  replied: number;
  meetings: number;
  openRate: string;
  replyRate: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, organizationId: true, abTestEnabled: true, name: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!campaign.abTestEnabled) {
    return NextResponse.json(
      { error: "A/B testing is not enabled for this campaign" },
      { status: 400 }
    );
  }

  // Fetch all campaign leads with their outreach copy variant
  const campaignLeads = await prisma.campaignLead.findMany({
    where: { campaignId },
    select: {
      status: true,
      outreachCopy: { select: { variant: true } },
    },
  });

  // Aggregate stats per variant
  const statsMap: Record<string, { sent: number; opened: number; replied: number; meetings: number }> = {};

  for (const cl of campaignLeads) {
    const variant = cl.outreachCopy?.variant ?? "A";
    if (!statsMap[variant]) {
      statsMap[variant] = { sent: 0, opened: 0, replied: 0, meetings: 0 };
    }

    const s = statsMap[variant];
    if (["SENT", "OPENED", "REPLIED", "BOUNCED"].includes(cl.status)) s.sent++;
    if (cl.status === "OPENED") s.opened++;
    if (cl.status === "REPLIED") {
      s.replied++;
      // We'll check meeting_booked via lead status separately if needed
    }
  }

  // Build response array with rates
  const variants: VariantStats[] = Object.entries(statsMap).map(([variant, s]) => ({
    variant,
    sent: s.sent,
    opened: s.opened,
    replied: s.replied,
    meetings: s.meetings,
    openRate: s.sent > 0 ? `${((s.opened / s.sent) * 100).toFixed(1)}%` : "0.0%",
    replyRate: s.sent > 0 ? `${((s.replied / s.sent) * 100).toFixed(1)}%` : "0.0%",
  })).sort((a, b) => a.variant.localeCompare(b.variant));

  // Determine winner (by reply rate — primary signal)
  let winner: string | null = null;
  if (variants.length >= 2) {
    const [a, b] = variants;
    const aRate = a.sent > 0 ? a.replied / a.sent : 0;
    const bRate = b.sent > 0 ? b.replied / b.sent : 0;
    // Require at least 10 sends per variant for statistical relevance
    if (a.sent >= 10 && b.sent >= 10 && aRate !== bRate) {
      winner = aRate > bRate ? a.variant : b.variant;
    }
  }

  return NextResponse.json({
    campaignId,
    campaignName: campaign.name,
    abTestEnabled: true,
    variants,
    winner,
    winnerNote: winner
      ? `Variant ${winner} has a higher reply rate. Consider using it for future campaigns.`
      : variants.every((v) => v.sent >= 10)
      ? "Both variants performing similarly — no clear winner yet."
      : "Need at least 10 sends per variant for a reliable result.",
  });
}
