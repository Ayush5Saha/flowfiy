import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/integrations/gmail";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams, origin } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  // Derive redirect URI from request origin — works in any environment automatically
  const redirectUri = `${origin}/api/integrations/gmail/callback`;

  // Store org ID + redirectUri in state so callback can use the same URI for token exchange
  const state = Buffer.from(JSON.stringify({ organizationId, userId: user.id, redirectUri })).toString("base64");
  const url = new URL(getGoogleAuthUrl(redirectUri));
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
