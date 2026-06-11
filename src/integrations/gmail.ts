import { google } from "googleapis";

// Send-only Gmail access. gmail.send is a "sensitive" scope (standard OAuth
// verification, no CASA). We intentionally do NOT request gmail.readonly (a
// "restricted" scope that would require a costly CASA security assessment).
// openid + userinfo.email are non-sensitive and only used to read the
// connected account's email address. Trade-off: no automatic reply detection.
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getGoogleOAuthClient(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri ?? process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(redirectUri: string): string {
  const client = getGoogleOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const client = getGoogleOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  return tokens;
}

export interface GmailSendParams {
  refreshToken: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  /** If provided the email is sent as HTML; plain-text `body` is ignored. */
  htmlBody?: string;
  replyToMessageId?: string;
  threadId?: string;
}

export async function sendGmail(params: GmailSendParams): Promise<{ messageId: string; threadId: string }> {
  const client = getGoogleOAuthClient();
  client.setCredentials({ refresh_token: params.refreshToken });

  const gmail = google.gmail({ version: "v1", auth: client });

  const contentType = params.htmlBody
    ? "text/html; charset=utf-8"
    : "text/plain; charset=utf-8";

  const headers = [
    `To: ${params.to}`,
    `From: ${params.from}`,
    `Subject: ${params.subject}`,
    `Content-Type: ${contentType}`,
    "MIME-Version: 1.0",
  ];

  if (params.replyToMessageId) {
    headers.push(`In-Reply-To: ${params.replyToMessageId}`);
    headers.push(`References: ${params.replyToMessageId}`);
  }

  const rawMessage = [
    ...headers,
    "",
    params.htmlBody ?? params.body,
  ].join("\n");

  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const requestBody: { raw: string; threadId?: string } = { raw: encoded };
  if (params.threadId) {
    requestBody.threadId = params.threadId;
  }

  const res = await gmail.users.messages.send({ userId: "me", requestBody });

  return {
    messageId: res.data?.id ?? "",
    threadId: res.data?.threadId ?? "",
  };
}
