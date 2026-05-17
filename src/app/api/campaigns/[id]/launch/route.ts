import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { enqueueEmailJob } from "@/workers/queues";

// ── POST /api/campaigns/[id]/launch ─────────────────────────────────────────
// Sets campaign status to ACTIVE and enqueues initial emails for all PENDING leads.
// Safe to call on an already-active campaign — idempotent (skips already-sent leads).
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

  if (campaign.status === "COMPLETED") {
    return NextResponse.json({ error: "Campaign is already completed" }, { status: 400 });
  }

  // Mark campaign as ACTIVE
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE" },
  });

  // Find all PENDING campaign leads (haven't been sent yet)
  const pendingLeads = await prisma.campaignLead.findMany({
    where: {
      campaignId,
      status: "PENDING",
      followUpStep: 0,
    },
    select: { id: true },
  });

  if (pendingLeads.length === 0) {
    return NextResponse.json({ queued: 0, message: "No pending leads to send. Add leads first." });
  }

  // Enqueue initial email (step 0) for each lead immediately
  // The daily send limit is enforced by the BullMQ rate limiter (50/hr)
  await Promise.all(
    pendingLeads.map((cl) =>
      enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 0,
      })
    )
  );

  return NextResponse.json({
    queued: pendingLeads.length,
    message: `Queued ${pendingLeads.length} initial emails. Follow-ups will be scheduled automatically after each send.`,
  });
}
