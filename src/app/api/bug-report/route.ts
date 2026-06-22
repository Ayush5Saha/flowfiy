import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrgMembership } from "@/lib/session";
import { createAuditLog } from "@/lib/audit";
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
  title: z.string().trim().min(3, "Give the bug a short title").max(160),
  description: z.string().trim().min(10, "Please describe what happened").max(5000),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  url: z.string().trim().max(500).optional().default(""),
  userAgent: z.string().trim().max(500).optional().default(""),
  email: z.string().trim().email().max(200).optional(),
  company: z.string().max(0).optional(), // honeypot
});

const SEVERITY_COLOR: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(
    contactRateLimit,
    `bug-report:${getClientIp(req)}`,
    "You've submitted several reports already. Please wait a few minutes before sending another."
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
  if (parsed.data.company) return NextResponse.json({ success: true }); // honeypot

  const { title, description, severity, url, userAgent, email } = parsed.data;

  // Attach signed-in context when available (the widget lives in the dashboard).
  let reporterEmail = email ?? "";
  let organizationId: string | null = null;
  let orgName = "";
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      reporterEmail = reporterEmail || user.email || "";
      const membership = await getOrgMembership(user.id);
      if (membership) {
        organizationId = membership.organization.id;
        orgName = membership.organization.name;
      }
    }
  } catch {
    /* anonymous report — fine */
  }

  const resend = getResend();
  if (!resend) {
    console.error("[bug-report] RESEND_API_KEY not configured");
    return NextResponse.json(
      { error: "Bug reporting is temporarily unavailable. Please email support@flowfiy.com." },
      { status: 503 }
    );
  }

  const sevColor = SEVERITY_COLOR[severity] ?? "#a1a1aa";

  try {
    const { error } = await resend.emails.send({
      from: SUPPORT_FROM,
      to: [SUPPORT_INBOX],
      ...(reporterEmail ? { replyTo: reporterEmail } : {}),
      subject: `[Bug · ${severity.toUpperCase()}] ${title}`,
      html: emailShell(
        "🐞 New bug report",
        `${detailRows([
          ["Title", escapeHtml(title)],
          ["Severity", `<span style="color:${sevColor};font-weight:600;text-transform:uppercase;">${escapeHtml(severity)}</span>`],
          ["Reporter", reporterEmail ? `<a href="mailto:${escapeHtml(reporterEmail)}" style="color:#a855f7;">${escapeHtml(reporterEmail)}</a>` : "Anonymous"],
          ["Organization", orgName ? escapeHtml(orgName) : "—"],
          ["Page", url ? `<a href="${escapeHtml(url)}" style="color:#a855f7;">${escapeHtml(url)}</a>` : "—"],
          ["Browser", userAgent ? escapeHtml(userAgent) : "—"],
        ])}
        <hr style="border:none;border-top:1px solid #27272a;margin:16px 0;" />
        <p style="color:#a1a1aa;margin-bottom:8px;">What happened</p>
        <p style="color:#ffffff;white-space:pre-wrap;background:#18181b;padding:16px;border-radius:8px;border:1px solid #27272a;">${escapeHtml(description)}</p>`
      ),
    });

    if (error) {
      console.error("[bug-report] Resend error:", error);
      return NextResponse.json({ error: "Failed to submit report. Please try again." }, { status: 502 });
    }

    if (organizationId) {
      await createAuditLog({
        organizationId,
        userId,
        action: "support.bug_report",
        resourceType: "bug_report",
        metadata: { title, severity, url },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[bug-report] route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
