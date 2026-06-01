import { NextRequest, NextResponse } from "next/server";
import { processFollowUpSchedule } from "@/workers/processors/followup-scheduler.processor";

// GET/POST /api/campaigns/process-followups
//
// Triggered by Vercel Cron daily at 09:00 UTC (configured in vercel.json).
// Also callable manually from the dashboard by an authenticated user.
//
// Auth: Vercel Cron calls include the "x-vercel-cron: 1" header automatically.
// Manual calls require a valid Supabase session.
async function handleProcessFollowups(req: NextRequest) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processFollowUpSchedule();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[process-followups] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleProcessFollowups(req);
}

export async function POST(req: NextRequest) {
  return handleProcessFollowups(req);
}
