import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SUPPORT_FROM,
  getResend,
  escapeHtml,
  emailShell,
  detailRows,
} from "@/lib/support-email";
import { enforceRateLimit, contactRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Routcore enquiry form (/routcore#contact).
 *
 * Separate from /api/contact because these are sales enquiries for the
 * done-for-you service and route to info@ rather than support@.
 */
const ROUTCORE_INBOX = process.env.ROUTCORE_INBOX_EMAIL || "info@flowfiy.com";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid work email is required").max(200),
  phone: z.string().trim().max(40).optional().default(""),
  companyName: z.string().trim().max(160).optional().default(""),
  region: z.string().trim().max(60).optional().default("Not specified"),
  packageTier: z.string().trim().max(160).optional().default("Not specified"),
  message: z.string().trim().min(1, "Please tell us what you sell and who to").max(5000),
  // Honeypot — bots fill hidden fields; humans never do. Deliberately NOT
  // `.max(0)`: that makes the schema reject a filled honeypot with a 400 and a
  // confusing validation message, which both tells the bot it was caught and
  // makes the silent-accept branch below unreachable.
  company: z.string().max(400).optional(),
});

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(
    contactRateLimit,
    `routcore:${getClientIp(req)}`,
    "You've sent several requests already. Please wait a few minutes before sending another."
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Please check your details and try again.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  // Honeypot tripped — silently accept so bots don't learn they were caught.
  if (parsed.data.company) return NextResponse.json({ success: true });

  const { name, email, phone, companyName, region, packageTier, message } = parsed.data;

  const resend = getResend();
  if (!resend) {
    console.error("[routcore] RESEND_API_KEY not configured");
    return NextResponse.json(
      { error: `Messaging is temporarily unavailable. Please email us directly at ${ROUTCORE_INBOX}.` },
      { status: 503 }
    );
  }

  try {
    const { error } = await resend.emails.send({
      from: SUPPORT_FROM,
      to: [ROUTCORE_INBOX],
      replyTo: email,
      subject: `[Routcore · ${region}] ${name}${companyName ? ` — ${companyName}` : ""}`,
      html: emailShell(
        "New Routcore enquiry",
        `${detailRows([
          ["Name", escapeHtml(name)],
          ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:#a855f7;">${escapeHtml(email)}</a>`],
          ["Phone", phone ? escapeHtml(phone) : "—"],
          ["Company", companyName ? escapeHtml(companyName) : "—"],
          ["Region", escapeHtml(region)],
          ["Package", escapeHtml(packageTier)],
        ])}
        <hr style="border:none;border-top:1px solid #27272a;margin:16px 0;" />
        <p style="color:#a1a1aa;margin-bottom:8px;">What they sell &amp; who to</p>
        <p style="color:#ffffff;white-space:pre-wrap;background:#18181b;padding:16px;border-radius:8px;border:1px solid #27272a;">${escapeHtml(message)}</p>`
      ),
    });

    if (error) {
      console.error("[routcore] Resend error:", error);
      return NextResponse.json({ error: "Failed to send your request. Please try again." }, { status: 502 });
    }

    // Best-effort confirmation to the sender — never block the response on it.
    resend.emails
      .send({
        from: SUPPORT_FROM,
        to: [email],
        subject: "We've received your Routcore enquiry — Flowfiy",
        html: emailShell(
          "Thanks for reaching out",
          `<p style="color:#d4d4d8;line-height:1.6;">Hi ${escapeHtml(name)},</p>
           <p style="color:#a1a1aa;line-height:1.6;">We've received your Routcore enquiry and will reply within 24 hours (Mon–Fri, 9am–6pm IST) to set up a short discovery call. Here's what you sent:</p>
           <p style="color:#ffffff;white-space:pre-wrap;background:#18181b;padding:16px;border-radius:8px;border:1px solid #27272a;">${escapeHtml(message)}</p>
           <p style="color:#52525b;font-size:12px;margin-top:20px;">Need us sooner? Call +91 93946 59992 or reply to this email.</p>`
        ),
      })
      .catch((e) => console.error("[routcore] confirmation send failed:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[routcore] route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
