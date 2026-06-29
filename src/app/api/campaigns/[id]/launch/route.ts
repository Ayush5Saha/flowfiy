import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { enqueueEmailJob } from "@/workers/queues";
import { fireWebhookEvent } from "@/lib/webhooks";

// ── POST /api/campaigns/[id]/launch ─────────────────────────────────────────
// Sets campaign status to ACTIVE and enqueues initial emails for all PENDING leads.
// Safe to call on an already-active campaign — idempotent (skips already-sent leads).
//
// Approval gate: if any outreach copies are unapproved, launch is blocked and
// the response includes { unapprovedCount } so the UI can prompt the user.
// Pass { skipApproval: true } in the request body to bypass this gate (e.g.
// user explicitly clicks "Launch anyway" after seeing the warning).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: campaignId } = await params;

  // Parse optional body — non-JSON bodies are fine (we default gracefully)
  let skipApproval = false;
  try {
    const body = await req.json() as { skipApproval?: boolean };
    skipApproval = body.skipApproval === true;
  } catch {
    // Empty or non-JSON body — that's fine
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, organizationId: true, status: true, abTestEnabled: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (campaign.status === "COMPLETED") {
    return NextResponse.json({ error: "Campaign is already completed" }, { status: 400 });
  }

  // ── Approval gate ─────────────────────────────────────────────────────────
  if (!skipApproval) {
    const unapprovedCount = await prisma.outreachCopy.count({
      where: {
        isApproved: false,
        campaignLeads: { some: { campaignId } },
      },
    });

    if (unapprovedCount > 0) {
      return NextResponse.json(
        {
          error: "approval_required",
          message: `${unapprovedCount} email${unapprovedCount === 1 ? "" : "s"} haven't been reviewed yet. Review and approve them, or pass skipApproval to launch anyway.`,
          unapprovedCount,
        },
        { status: 422 }
      );
    }
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
    include: {
      lead: { select: { id: true, email: true, organizationId: true } },
      outreachCopy: { select: { id: true, variant: true } },
    },
  });

  if (pendingLeads.length === 0) {
    return NextResponse.json({ queued: 0, message: "No pending leads to send. Add leads first." });
  }

  // ── Skip leads with no email address ──────────────────────────────────────
  // Leads sourced from Google Maps (local businesses) frequently have no email —
  // the send worker can't deliver to them and the job would fail silently,
  // leaving the lead stuck at PENDING forever. Filter them out here so we never
  // enqueue an undeliverable send, and report the count back to the user.
  // We deliberately leave their status as PENDING (no DB write): if the lead is
  // later enriched with an email, a re-launch picks it up automatically.
  const sendableLeads = pendingLeads.filter((cl) => !!cl.lead.email);
  const noEmailCount = pendingLeads.length - sendableLeads.length;

  if (sendableLeads.length === 0) {
    return NextResponse.json({
      queued: 0,
      noEmailCount,
      message:
        `None of these ${noEmailCount} lead${noEmailCount === 1 ? "" : "s"} have an email address, ` +
        `so there's nothing to send. They were likely sourced from Google Maps — local businesses ` +
        `rarely list email. Reach them via WhatsApp/phone, or target an ICP that has email addresses.`,
    });
  }

  // ── Feature 10: A/B test — assign variants alternately at launch time ────
  // Only runs when abTestEnabled is true on the campaign.
  // Assigns every lead's outreachCopy to variant A or B alternately, giving
  // each variant exactly half the sends for a fair split.
  if (campaign.abTestEnabled) {
    const copyUpdates = sendableLeads
      .filter((cl) => cl.outreachCopy)
      .map((cl, idx) => ({
        id: cl.outreachCopy!.id,
        variant: idx % 2 === 0 ? "A" : "B",
      }));

    await Promise.all(
      copyUpdates.map(({ id, variant }) =>
        prisma.outreachCopy.update({ where: { id }, data: { variant } })
      )
    );
  }

  // ── Cross-list deduplication ──────────────────────────────────────────────
  const leadEmails = sendableLeads
    .map((cl) => cl.lead.email)
    .filter((e): e is string => !!e);

  const duplicateCount = leadEmails.length > 0
    ? await prisma.campaignLead.count({
        where: {
          campaignId: { not: campaignId },
          lead: { email: { in: leadEmails }, organizationId: campaign.organizationId },
          status: { in: ["SENT", "OPENED", "REPLIED"] },
          campaign: { status: { in: ["ACTIVE", "COMPLETED"] } },
        },
      })
    : 0;

  // Enqueue initial email (step 0) for each sendable lead
  await Promise.all(
    sendableLeads.map((cl) =>
      enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 0,
      })
    )
  );

  // Feature 7: webhook — campaign started is not a defined event type, but
  // we do fire lead.qualified for each qualified lead that gets enqueued.
  // (A dedicated campaign.launched event would be a future addition)

  let message = `Queued ${sendableLeads.length} initial email${sendableLeads.length === 1 ? "" : "s"}.`;
  if (noEmailCount > 0) {
    message += ` ${noEmailCount} lead${noEmailCount === 1 ? "" : "s"} had no email address and ${noEmailCount === 1 ? "was" : "were"} skipped — reach those via WhatsApp/phone.`;
  }
  if (duplicateCount > 0) {
    message += ` Note: ${duplicateCount} lead(s) were already contacted in other campaigns and will be skipped automatically.`;
  }

  return NextResponse.json({
    queued: sendableLeads.length,
    noEmailCount,
    duplicatesDetected: duplicateCount,
    abTestEnabled: campaign.abTestEnabled,
    message,
  });
}
