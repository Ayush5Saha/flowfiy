import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Monthly generation count reset.
 * Called by Vercel Cron on the 1st of every month at 00:00 UTC.
 * Auth: CRON_SECRET header checked to prevent unauthorized calls.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Reset generationCount to 0 for all orgs.
    // generationLimit stays as-is — it's set by plan and only changes on upgrade/downgrade.
    const result = await prisma.organization.updateMany({
      data: { generationCount: 0 },
    });

    console.log(`[reset-usage] Reset generationCount for ${result.count} organizations`);

    return NextResponse.json({
      ok: true,
      reset: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[reset-usage] Failed:", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
