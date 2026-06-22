import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  SUPPORT_FROM,
  SUPPORT_INBOX,
  getResend,
  escapeHtml,
  emailShell,
  detailRows,
} from "@/lib/support-email";
import { enforceRateLimit, contactRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(200),
  subject: z.string().trim().min(1).max(120).optional().default("General question"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  // Honeypot — bots fill hidden fields; humans never do.
  company: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  // Spam / abuse protection.
  const limited = await enforceRateLimit(
    contactRateLimit,
    `contact:${getClientIp(req)}`,
    "You've sent several messages already. Please wait a few minutes before sending another."
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

  const { name, email, subject, message } = parsed.data;

  const resend = getResend();
  if (!resend) {
    console.error("[contact] RESEND_API_KEY not configured");
    return NextResponse.json(
      { error: "Messaging is temporarily unavailable. Please email us directly at support@flowfiy.com." },
      { status: 503 }
    );
  }

  try {
    const { error } = await resend.emails.send({
      from: SUPPORT_FROM,
      to: [SUPPORT_INBOX],
      replyTo: email,
      subject: `[Contact · ${subject}] ${name}`,
      html: emailShell(
        "New contact form submission",
        `${detailRows([
          ["Name", escapeHtml(name)],
          ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:#a855f7;">${escapeHtml(email)}</a>`],
          ["Subject", escapeHtml(subject)],
        ])}
        <hr style="border:none;border-top:1px solid #27272a;margin:16px 0;" />
        <p style="color:#a1a1aa;margin-bottom:8px;">Message</p>
        <p style="color:#ffffff;white-space:pre-wrap;background:#18181b;padding:16px;border-radius:8px;border:1px solid #27272a;">${escapeHtml(message)}</p>`
      ),
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 502 });
    }

    // Best-effort confirmation to the sender — never block on it.
    resend.emails
      .send({
        from: SUPPORT_FROM,
        to: [email],
        subject: "We've received your message — Flowfiy",
        html: emailShell(
          "Thanks for reaching out",
          `<p style="color:#d4d4d8;line-height:1.6;">Hi ${escapeHtml(name)},</p>
           <p style="color:#a1a1aa;line-height:1.6;">We've received your message and a human will reply within 24 hours (Mon–Fri, 9am–6pm IST). For reference, here's what you sent:</p>
           <p style="color:#ffffff;white-space:pre-wrap;background:#18181b;padding:16px;border-radius:8px;border:1px solid #27272a;">${escapeHtml(message)}</p>
           <p style="color:#52525b;font-size:12px;margin-top:20px;">You can also reach us anytime at support@flowfiy.com.</p>`
        ),
      })
      .catch((e) => console.error("[contact] confirmation send failed:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact] route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
