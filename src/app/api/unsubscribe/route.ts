import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

/**
 * GET /api/unsubscribe?id={campaignLeadId}&token={hmac}
 *
 * Public endpoint — no auth required (clicked from email).
 * Verifies the HMAC token, adds the email to the org's suppression list,
 * marks the campaign lead as UNSUBSCRIBED, and returns a confirmation page.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignLeadId = searchParams.get("id");
  const token = searchParams.get("token");

  if (!campaignLeadId || !token) {
    return htmlResponse("Invalid Link", "This unsubscribe link appears to be invalid or incomplete.", false);
  }

  // Load the campaign lead
  const cl = await prisma.campaignLead.findUnique({
    where: { id: campaignLeadId },
    include: {
      lead: { select: { email: true } },
      campaign: { select: { organizationId: true } },
    },
  });

  if (!cl || !cl.lead.email) {
    return htmlResponse("Link Expired", "This unsubscribe link has expired or is no longer valid.", false);
  }

  // Verify HMAC token
  if (!verifyUnsubscribeToken(campaignLeadId, cl.lead.email, token)) {
    return htmlResponse("Invalid Link", "This unsubscribe link is invalid. Please contact us directly if you'd like to be removed.", false);
  }

  // Already unsubscribed — idempotent
  if (cl.status === "UNSUBSCRIBED") {
    return htmlResponse("Already Unsubscribed", `${cl.lead.email} has already been removed from our mailing list.`, true);
  }

  const email = cl.lead.email;
  const organizationId = cl.campaign.organizationId;

  // Atomic: mark the lead + add to suppression list
  await prisma.$transaction([
    prisma.campaignLead.update({
      where: { id: campaignLeadId },
      data: { status: "UNSUBSCRIBED" },
    }),
    prisma.suppressedEmail.upsert({
      where: { organizationId_email: { organizationId, email } },
      create: { organizationId, email, reason: "unsubscribed" },
      update: { reason: "unsubscribed", suppressedAt: new Date() },
    }),
  ]);

  console.log(`[unsubscribe] ${email} removed from org ${organizationId}`);

  return htmlResponse(
    "You've Been Unsubscribed",
    `${email} has been successfully removed. You won't receive any further emails from us.`,
    true
  );
}

// ─── HTML response helper ─────────────────────────────────────────────────────

function htmlResponse(title: string, message: string, success: boolean) {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "✓" : "✗";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Flowfiy</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           background: #f9fafb; display: flex; align-items: center;
           justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 12px; padding: 48px 40px;
            max-width: 480px; width: 100%; text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06); }
    .icon { font-size: 40px; color: ${color}; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 12px; }
    p  { font-size: 15px; color: #555; line-height: 1.6; }
    .brand { margin-top: 32px; font-size: 12px; color: #aaa; }
    .brand a { color: #aaa; text-decoration: none; }
    .brand a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="brand">Powered by <a href="https://flowfiy.com">Flowfiy</a></div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
