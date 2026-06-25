import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/oauth-state";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // CSRF: a per-request nonce echoed back by Google and matched in the callback
  // against this httpOnly cookie. Stops an attacker from completing a login flow
  // they started (login CSRF / session fixation).
  const state = randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must be lax so it survives the cross-site redirect back
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return res;
}
