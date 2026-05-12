import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getClaudeClient } from "@/ai/client";
import { runPersonalization } from "@/ai/agents/personalization";
import { decryptCredentials } from "@/lib/encryption";

const schema = z.object({
  leadId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { leadId, organizationId } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [lead, profile, research] = await Promise.all([
    prisma.lead.findFirst({ where: { id: leadId, organizationId } }),
    prisma.businessProfile.findUnique({ where: { organizationId } }),
    prisma.leadResearch.findUnique({ where: { leadId } }),
  ]);

  if (!lead || !profile || !research) {
    return NextResponse.json({ error: "Lead or profile not found" }, { status: 404 });
  }

  const calendlyIntegration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: "CALENDLY" } },
  });
  const calendlyLink = calendlyIntegration?.status === "CONNECTED"
    ? decryptCredentials(calendlyIntegration.encryptedCredentials).schedulingLink
    : undefined;

  const claude = await getClaudeClient(organizationId);
  const outreach = await runPersonalization(claude, {
    lead: {
      firstName: lead.firstName ?? undefined,
      lastName: lead.lastName ?? undefined,
      title: lead.title ?? undefined,
      companyName: lead.companyName ?? undefined,
      industry: lead.industry ?? undefined,
    },
    businessProfile: {
      companyName: profile.companyName,
      serviceOffered: profile.serviceOffered,
      offerPositioning: profile.offerPositioning,
      outreachTone: profile.outreachTone,
    },
    bestAngle: research.opportunityAngle ?? "",
    painPointMatch: research.painPointMatch ?? "",
    personalizationHooks: (research.personalizationNotes ?? "").split("; ").filter(Boolean),
    calendlyLink,
  });

  const existing = await prisma.outreachCopy.findFirst({
    where: { leadId, organizationId },
    orderBy: { version: "desc" },
  });

  const outreachCopy = await prisma.outreachCopy.create({
    data: {
      leadId,
      organizationId,
      channel: "email",
      subjectLine: outreach.subjectLine,
      body: outreach.emailBody,
      followUp1: outreach.followUp1,
      followUp2: outreach.followUp2,
      version: (existing?.version ?? 0) + 1,
    },
  });

  return NextResponse.json({ outreachCopy });
}
