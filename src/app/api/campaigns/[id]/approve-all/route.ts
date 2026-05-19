import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/campaigns/[id]/approve-all
 *
 * Bulk-approves every OutreachCopy linked to the campaign's leads.
 * Useful when a user trusts the AI output and wants to launch without
 * reviewing each copy individually.
 *
 * Returns: { approved: number } — count of copies that were approved.
 */
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
    select: { id: true, organizationId: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Find all outreach copy IDs linked to this campaign's leads
  const campaignLeads = await prisma.campaignLead.findMany({
    where: { campaignId, outreachCopyId: { not: null } },
    select: { outreachCopyId: true },
  });

  const copyIds = campaignLeads
    .map((cl) => cl.outreachCopyId)
    .filter((id): id is string => id !== null);

  if (copyIds.length === 0) {
    return NextResponse.json({ approved: 0, message: "No outreach copies found for this campaign." });
  }

  const result = await prisma.outreachCopy.updateMany({
    where: { id: { in: copyIds }, isApproved: false },
    data: { isApproved: true },
  });

  return NextResponse.json({
    approved: result.count,
    message: `${result.count} copies approved. Campaign is ready to launch.`,
  });
}
