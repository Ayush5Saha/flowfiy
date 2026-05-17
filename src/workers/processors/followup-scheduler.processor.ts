/**
 * Follow-up Scheduler
 *
 * Runs on a schedule (e.g. every hour) to find campaign leads where a follow-up
 * is now due, based on the campaign's CURRENT delay settings.
 *
 * Because we check the DB at trigger time (not at send time), users can change
 * followUp1DelayDays / followUp2DelayDays on a live campaign and the change
 * takes effect for all unsent follow-ups immediately.
 */
import { prisma } from "@/lib/prisma";
import { enqueueEmailJob } from "@/workers/queues";

const DAYS_MS = 24 * 60 * 60 * 1000;

export interface ScheduleResult {
  checked: number;
  queued: number;
  skipped: number;
}

export async function processFollowUpSchedule(): Promise<ScheduleResult> {
  const now = new Date();

  // Find all ACTIVE campaigns that have follow-up content configured
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      organizationId: true,
      followUp1DelayDays: true,
      followUp2DelayDays: true,
    },
  });

  let checked = 0;
  let queued = 0;
  let skipped = 0;

  for (const campaign of activeCampaigns) {
    const fu1Threshold = new Date(now.getTime() - campaign.followUp1DelayDays * DAYS_MS);
    const fu2Threshold = new Date(now.getTime() - campaign.followUp2DelayDays * DAYS_MS);

    // ── Follow-up 1: initial sent, no follow-up yet, delay elapsed ────────────
    const dueForFU1 = await prisma.campaignLead.findMany({
      where: {
        campaignId: campaign.id,
        status: "SENT",
        followUpStep: 1,       // initial sent, not yet at FU1
        followUp1SentAt: null,
        sentAt: { lte: fu1Threshold },
        // Stop if lead replied or unsubscribed
        lead: { status: { notIn: ["REPLIED"] } },
      },
      include: {
        outreachCopy: { select: { followUp1: true } },
      },
    });

    for (const cl of dueForFU1) {
      checked++;
      if (!cl.outreachCopy?.followUp1) { skipped++; continue; }

      await enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 1,
      });
      queued++;
    }

    // ── Follow-up 2: FU1 sent, no FU2 yet, delay elapsed ─────────────────────
    const dueForFU2 = await prisma.campaignLead.findMany({
      where: {
        campaignId: campaign.id,
        status: "SENT",
        followUpStep: 2,        // FU1 sent, not yet at FU2
        followUp1SentAt: { not: null, lte: fu2Threshold },
        followUp2SentAt: null,
        lead: { status: { notIn: ["REPLIED"] } },
      },
      include: {
        outreachCopy: { select: { followUp2: true } },
      },
    });

    for (const cl of dueForFU2) {
      checked++;
      if (!cl.outreachCopy?.followUp2) { skipped++; continue; }

      await enqueueEmailJob({
        campaignLeadId: cl.id,
        organizationId: campaign.organizationId,
        step: 2,
      });
      queued++;
    }
  }

  console.log(
    `[followup-scheduler] checked=${checked} queued=${queued} skipped=${skipped}`
  );
  return { checked, queued, skipped };
}
