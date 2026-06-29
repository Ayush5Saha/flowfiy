import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const addLeadsSchema = z.object({
  /** Pass specific leadIds, or omit to auto-add all QUALIFIED leads from the campaign's leadList */
  leadIds: z.array(z.string().uuid()).optional(),
});

// ── POST /api/campaigns/[id]/leads ───────────────────────────────────────────
// Add qualified leads (with outreach copy) to a campaign.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, organizationId: true, leadListId: true, status: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (campaign.status === "COMPLETED") {
    return NextResponse.json({ error: "Cannot add leads to a completed campaign" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = addLeadsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // Resolve which leads to add
  let leadsToAdd: { id: string; outreachCopyId?: string }[] = [];
  // Qualified leads that have no email address — they can never be emailed, so
  // we never add them to the campaign. Tracked so we can tell the user.
  let skippedNoEmail = 0;

  // Keep only leads that actually have a deliverable email address.
  const hasEmail = (l: { email: string | null }) => !!l.email && l.email.trim() !== "";

  if (parsed.data.leadIds?.length) {
    // Explicit lead IDs provided
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: parsed.data.leadIds },
        organizationId: campaign.organizationId,
        status: "QUALIFIED",
      },
      include: { outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const emailable = leads.filter(hasEmail);
    skippedNoEmail = leads.length - emailable.length;
    leadsToAdd = emailable.map((l) => ({
      id: l.id,
      outreachCopyId: l.outreachCopies[0]?.id,
    }));
  } else if (campaign.leadListId) {
    // Auto-add all qualified leads from the campaign's lead list
    const leads = await prisma.lead.findMany({
      where: {
        leadListId: campaign.leadListId,
        organizationId: campaign.organizationId,
        status: "QUALIFIED",
      },
      include: { outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const emailable = leads.filter(hasEmail);
    skippedNoEmail = leads.length - emailable.length;
    leadsToAdd = emailable.map((l) => ({
      id: l.id,
      outreachCopyId: l.outreachCopies[0]?.id,
    }));
  } else {
    return NextResponse.json(
      { error: "Provide leadIds or attach a leadList to the campaign" },
      { status: 400 }
    );
  }

  if (leadsToAdd.length === 0) {
    return NextResponse.json({
      added: 0,
      skippedNoEmail,
      message: skippedNoEmail > 0
        ? `None of these ${skippedNoEmail} qualified lead${skippedNoEmail === 1 ? "" : "s"} have an email address, so there's nothing to email. Reach them via WhatsApp/phone, or pick a list that has emails.`
        : "No qualified leads with outreach copy found",
    });
  }

  // Upsert — skip leads already in this campaign
  const existing = await prisma.campaignLead.findMany({
    where: { campaignId, leadId: { in: leadsToAdd.map((l) => l.id) } },
    select: { leadId: true },
  });
  const existingIds = new Set(existing.map((e) => e.leadId));
  const newLeads = leadsToAdd.filter((l) => !existingIds.has(l.id));

  if (newLeads.length === 0) {
    return NextResponse.json({ added: 0, skippedNoEmail, message: "All selected leads are already in this campaign" });
  }

  await prisma.campaignLead.createMany({
    data: newLeads.map((l) => ({
      campaignId,
      leadId: l.id,
      outreachCopyId: l.outreachCopyId ?? null,
      status: "PENDING",
      followUpStep: 0,
    })),
  });

  return NextResponse.json({ added: newLeads.length, skippedNoEmail });
}
