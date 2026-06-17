import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { Resend } from "resend";
import { verifyAdminToken, ADMIN_COOKIE_NAME, OWNER_EMAIL } from "@/lib/admin-auth";
import { resolveRecipients, SEGMENT_KEYS, type Recipient } from "@/lib/admin/email-recipients";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : false;
}

const schema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
  segment: z.enum(SEGMENT_KEYS),
  mode: z.enum(["preview", "test", "send"]).default("preview"),
});

const FROM = process.env.RESEND_FROM_EMAIL ?? "Flowfiy <onboarding@resend.dev>";
const BATCH = 100;       // Resend batch.send cap
const MAX_SEND = 5000;   // safety ceiling per campaign

/** Replace {{name}} and turn newlines into a simple branded HTML email. */
function renderHtml(body: string, name: string): string {
  const safe = body
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\{\{\s*name\s*\}\}/gi, name)
    .replace(/\n/g, "<br/>");
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#18181b;line-height:1.6;">${safe}<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;"/><p style="font-size:12px;color:#a1a1aa;">Flowfiy · You're receiving this because you have a Flowfiy account.</p></div>`;
}
function renderSubject(subject: string, name: string): string {
  return subject.replace(/\{\{\s*name\s*\}\}/gi, name);
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Subject, body and a valid segment are required." }, { status: 400 });
  }
  const { subject, body, segment, mode } = parsed.data;

  let recipients: Recipient[];
  try {
    recipients = await resolveRecipients(segment);
  } catch (err) {
    console.error("[email-campaign] recipient resolution failed:", err);
    return NextResponse.json({ error: "Couldn't resolve recipients." }, { status: 500 });
  }

  // ── Preview: count + a small sample, no send ──────────────────────────────
  if (mode === "preview") {
    return NextResponse.json({
      mode,
      count: recipients.length,
      sample: recipients.slice(0, 5).map((r) => r.email),
    });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email sending is not configured (RESEND_API_KEY missing)." }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── Test: send only to the owner's inbox so you can see the real email ─────
  if (mode === "test") {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [OWNER_EMAIL],
      subject: `[TEST] ${renderSubject(subject, "there")}`,
      html: renderHtml(body, "there"),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ mode, sentTo: OWNER_EMAIL, count: recipients.length });
  }

  // ── Send: batch the whole segment ─────────────────────────────────────────
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients match that segment." }, { status: 400 });
  }
  const targets = recipients.slice(0, MAX_SEND);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += BATCH) {
    const chunk = targets.slice(i, i + BATCH);
    try {
      const { error } = await resend.batch.send(
        chunk.map((r) => ({
          from: FROM,
          to: [r.email],
          subject: renderSubject(subject, r.name),
          html: renderHtml(body, r.name),
        }))
      );
      if (error) failed += chunk.length;
      else sent += chunk.length;
    } catch (err) {
      console.error("[email-campaign] batch send failed:", err);
      failed += chunk.length;
    }
  }

  console.log(`[email-campaign] segment=${segment} sent=${sent} failed=${failed} (total matched ${recipients.length})`);
  return NextResponse.json({
    mode,
    total: recipients.length,
    sent,
    failed,
    truncated: recipients.length > MAX_SEND,
  });
}
