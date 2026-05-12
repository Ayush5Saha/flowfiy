import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/integrations/gmail";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  // Store org ID in state param to retrieve after OAuth
  const state = Buffer.from(JSON.stringify({ organizationId, userId: user.id })).toString("base64");
  const url = new URL(getGoogleAuthUrl());
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
