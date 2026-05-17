import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName } = await req.json();
  if (!fullName?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName.trim() },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
