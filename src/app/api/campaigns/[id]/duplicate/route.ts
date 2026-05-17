import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// ── POST /api/campaigns/[id]/duplicate ──────────────────────────────────────
// Creates a copy of a campaign with status DRAFT, same leads (reset to PENDING)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const original = await prisma.campaign.findUnique({
    where: { id },
    include: {
      campaignLeads: {
        select: { leadId: true, outreachCopyId: true },
      },
    },
  });
  if (!original) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: original.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Create the duplicate campaign
  const duplicate = await prisma.campaign.create({
    data: {
      organizationId: original.organizationId,
      leadListId: original.leadListId,
      name: `${original.name} (copy)`,
      status: "DRAFT",
      channel: original.channel,
      gmailFromAddress: original.gmailFromAddress,
      calendlyLink: original.calendlyLink,
      dailySendLimit: original.dailySendLimit,
      followUp1DelayDays: original.followUp1DelayDays,
      followUp2DelayDays: original.followUp2DelayDays,
    },
  });

  // Copy all leads (reset to PENDING, clear send timestamps)
  if (original.campaignLeads.length > 0) {
    await prisma.campaignLead.createMany({
      data: original.campaignLeads.map((cl) => ({
        campaignId: duplicate.id,
        leadId: cl.leadId,
        outreachCopyId: cl.outreachCopyId,
        status: "PENDING" as const,
        followUpStep: 0,
      })),
    });
  }

  return NextResponse.json({ campaign: duplicate }, { status: 201 });
}
