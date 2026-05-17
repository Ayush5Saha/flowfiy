import { NextRequest, NextResponse } from "next/server";
import { processFollowUpSchedule } from "@/workers/processors/followup-scheduler.processor";

// POST /api/campaigns/process-followups
//
// Trigger the follow-up scheduler — finds all campaign leads where a follow-up
// is now due (based on each campaign's current delay settings) and queues them.
//
// Call this on a schedule (every hour). Vercel Cron is configured in vercel.json.
// Protected by CRON_SECRET env var (or authenticated user for manual calls).
export async function POST(req: NextRequest) {
  // Allow cron runners (Vercel/Railway) via secret header
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronCall) {
    // Fall back to Supabase auth for manual dashboard calls
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
