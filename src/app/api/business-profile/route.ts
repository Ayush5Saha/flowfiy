import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const profileSchema = z.object({
  organizationId: z.string().uuid(),
  companyName: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal("")),
  serviceOffered: z.string().min(10).max(1000),
  icpDescription: z.string().min(10).max(2000),
  targetIndustries: z.array(z.string()).min(1).max(10),
  targetGeographies: z.array(z.string()).min(1).max(20),
  companySizeRange: z.string().optional(),
  painPointsSolved: z.string().min(10).max(1000),
  offerPositioning: z.string().min(10).max(1000),
  outreachTone: z.enum(["professional", "conversational", "direct"]),
});

async function getOrgMembership(userId: string, organizationId: string) {
  return prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, ...data } = parsed.data;
  const member = await getOrgMembership(user.id, organizationId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.businessProfile.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: { ...data },
  });

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "org.updated",
    resourceType: "business_profile",
    resourceId: profile.id,
  });

  return NextResponse.json({ profile });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  const member = await getOrgMembership(user.id, organizationId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.businessProfile.findUnique({ where: { organizationId } });
  return NextResponse.json({ profile });
}
