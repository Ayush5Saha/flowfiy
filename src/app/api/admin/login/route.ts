import { NextRequest, NextResponse } from "next/server";
import {
  validateAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE_NAME,
} from "@/lib/admin-auth";
import { enforceRateLimit, loginRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Brute-force protection: cap login attempts per source IP.
  const limited = await enforceRateLimit(
    loginRateLimit,
    `admin-login:${getClientIp(request)}`,
    "Too many login attempts. Please wait a few minutes and try again."
  );
  if (limited) return limited;

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
