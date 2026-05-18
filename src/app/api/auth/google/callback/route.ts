import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_failed`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();
    const idToken: string = tokens.id_token;

    if (!idToken) {
      throw new Error("No id_token in response");
    }

    // Sign into Supabase using the Google ID token
    const supabase = await createClient();
    const { error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (supabaseError) {
      console.error("Supabase signInWithIdToken error:", supabaseError);
      return NextResponse.redirect(`${appUrl}/login?error=supabase_auth_failed`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=google_auth_failed`);
  }
}
