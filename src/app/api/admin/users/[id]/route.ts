import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : false;
}

// Ban or unban a user (disable/enable their login)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = await createServiceClient();

  if (body.ban === true) {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: "876600h", // ~100 years
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, banned: true });
  }

  if (body.unban === true) {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: "none",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, banned: false });
  }

  return NextResponse.json({ error: "No valid action" }, { status: 400 });
}

// Delete a user entirely
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServiceClient();

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
