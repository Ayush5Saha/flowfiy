import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const session = await validateAdminCredentials(email, password);
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = generateAdminToken(session);
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  return response;
}
