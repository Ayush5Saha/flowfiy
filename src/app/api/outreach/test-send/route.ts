import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { sendGmail } from "@/integrations/gmail";

const schema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

// ── POST /api/outreach/test-send ─────────────────────────────────────────────
// Sends the first email from a lead's outreach copy to the currently logged-in
// user's own email address so they can preview how it looks.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { leadId, organizationId } = parsed.data;

  // Verify org membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Load lead + outreach copy
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId },
    include: {
      outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const outreachCopy = lead.outreachCopies[0];
  if (!outreachCopy) return NextResponse.json({ error: "No outreach copy for this lead" }, { status: 400 });

  // Load Gmail integration
  const gmailIntegration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: "GMAIL" } },
  });

  if (!gmailIntegration || gmailIntegration.status !== "CONNECTED") {
    return NextResponse.json({ error: "Gmail not connected. Go to Integrations to connect Gmail." }, { status: 400 });
  }

  const { refreshToken, emailAddress } = decryptCredentials(gmailIntegration.encryptedCredentials);

  // Send test email to the current user
  const subjectLine = outreachCopy.subjectLine
    ? `[TEST] ${outreachCopy.subjectLine}`
    : "[TEST] Outreach email preview";

  const testBody = `⚠️ This is a TEST email — not sent to ${lead.firstName ?? "the lead"}.
Would be sent to: ${lead.email ?? "no email on file"}
Lead: ${lead.firstName ?? ""} ${lead.lastName ?? ""} — ${lead.title ?? ""} at ${lead.companyName ?? ""}

---

${outreachCopy.body}`;

  await sendGmail({
    refreshToken,
    to: user.email,
    from: emailAddress,
    subject: subjectLine,
    body: testBody,
  });

  return NextResponse.json({ ok: true, sentTo: user.email });
}
