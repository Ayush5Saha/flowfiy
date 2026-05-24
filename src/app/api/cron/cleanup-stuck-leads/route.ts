import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Hourly cron: finds and resolves stuck lead generation jobs.
 *
 * A job is "stuck" if it has been in RESEARCHING/QUEUED state for more than
 * 2 hours without updating. This can happen when:
 *   - The worker crashed mid-run (no graceful shutdown)
 *   - A scrape hung and the job timeout wasn't triggered
 *   - Redis connection dropped during processing
 *
 * Resolution:
 *   - Stuck LeadLists → marked FAILED with a clear error message
 *   - Stuck Leads (RESEARCHING >2h) → marked DISQUALIFIED so the list can
 *     finalise correctly without leaving phantom "in-progress" rows
 *
 * Protected by CRON_SECRET — Vercel sends this automatically via
 * Authorization: Bearer <CRON_SECRET> when invoking scheduled cron jobs.
 */
export async function GET(req: NextRequest) {
  const authHeader   = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const now         = new Date().toISOString();

  // ── 1. Fix stuck LeadLists ─────────────────────────────────────────────────
  const stuckLists = await prisma.leadList.updateMany({
    where: {
      status:    { in: ["RESEARCHING", "QUEUED"] },
      updatedAt: { lt: twoHoursAgo },
    },
    data: {
      status:   "FAILED",
      jobStatus: "failed",
      jobError: "Job timed out — pipeline did not complete within 2 hours. Please retry.",
    },
  });

  // ── 2. Fix stuck Leads ─────────────────────────────────────────────────────
  //
  // Leads stuck in RESEARCHING more than 2 hours are considered unprocessable.
  // Mark them DISQUALIFIED so downstream queries (qualified count, list status)
  // don't get polluted by phantom in-progress rows.
  const stuckLeads = await prisma.lead.updateMany({
    where: {
      status:    "RESEARCHING",
      updatedAt: { lt: twoHoursAgo },
    },
    data: {
      status:            "DISQUALIFIED",
      qualificationScore: 0,
    },
  });

  console.log(
    `[cron] cleanup-stuck-leads — lists fixed: ${stuckLists.count}, leads fixed: ${stuckLeads.count}`
  );

  return NextResponse.json({
    success:       true,
    cleanedAt:     now,
    stuckLists:    stuckLists.count,
    stuckLeads:    stuckLeads.count,
  });
}
