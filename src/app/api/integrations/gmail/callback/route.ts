import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/integrations/gmail";
import { encryptCredentials } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/integrations?error=gmail_oauth_failed`);
  }

  let organizationId: string;
  let redirectUri: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
    organizationId = decoded.organizationId;
    // Use the redirectUri stored in state (same one used to start the OAuth flow)
    redirectUri = decoded.redirectUri ?? `${origin}/api/integrations/gmail/callback`;
  } catch {
    return NextResponse.redirect(`${origin}/integrations?error=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/integrations?error=no_refresh_token`);
    }

    // Get user's Gmail address
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    auth.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profile.data.emailAddress ?? "";

    const encrypted = encryptCredentials({
      refreshToken: tokens.refresh_token,
      emailAddress,
    });

    await prisma.integration.upsert({
      where: { organizationId_type: { organizationId, type: "GMAIL" } },
      create: {
        organizationId,
        type: "GMAIL",
        encryptedCredentials: encrypted,
        status: "CONNECTED",
        lastValidatedAt: new Date(),
      },
      update: {
        encryptedCredentials: encrypted,
        status: "CONNECTED",
        lastValidatedAt: new Date(),
      },
    });

    return NextResponse.redirect(`${origin}/integrations?success=gmail_connected`);
  } catch (err) {
    console.error("[Gmail OAuth] callback error:", err);
    return NextResponse.redirect(`${origin}/integrations?error=gmail_connection_failed`);
  }
}
