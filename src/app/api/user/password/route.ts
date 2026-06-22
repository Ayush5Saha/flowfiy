import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit, authRateLimit, getClientIp } from "@/lib/rate-limit";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cap password changes per user + IP to blunt session-hijack abuse.
  const limited = await enforceRateLimit(authRateLimit, `password:${user.id}:${getClientIp(req)}`);
  if (limited) return limited;

  const { password } = await req.json();
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
