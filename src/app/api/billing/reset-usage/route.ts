import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Monthly cron: resets generationCount for all metered-plan organizations.
 * Runs on the 1st of every month at midnight UTC (configured in vercel.json).
 * Protected by CRON_SECRET — Vercel sends this automatically via the
 * Authorization: Bearer <CRON_SECRET> header when invoking cron jobs.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reset generation counts for all orgs on metered plans.
  // AGENCY plan is unlimited (generationLimit = -1) — no reset needed.
  const result = await prisma.organization.updateMany({
    where: { plan: { in: ["FREE", "STARTER", "GROWTH"] } },
    data: { generationCount: 0 },
  });

  console.log(`[cron] Monthly usage reset — ${result.count} orgs reset`);
  return NextResponse.json({
    success: true,
    orgsReset: result.count,
    resetAt: new Date().toISOString(),
  });
}
