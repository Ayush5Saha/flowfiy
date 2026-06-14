import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { icpSummary, type IcpAnswers } from "@/lib/icp";

// Legacy free-text shape (still accepted by the settings page).
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

// New structured shape: one free-text business description + MCQ ICP answers.
const structuredSchema = z.object({
  organizationId: z.string().uuid(),
  companyName: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal("")),
  businessDetails: z.string().min(10).max(4000),
  outreachTone: z.enum(["professional", "conversational", "direct"]).default("professional"),
  icp: z.object({
    customerType: z.string().optional(),
    companySize: z.string().optional(),
    countries: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional(),
    decisionMakers: z.array(z.string()).optional(),
    revenueRange: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    problemSolved: z.string().optional(),
    goodSignals: z.array(z.string()).optional(),
    avoidCompanies: z.array(z.string()).optional(),
    dealSize: z.string().optional(),
    qualificationStrictness: z.string().optional(),
  }),
});

/** Build the legacy (NOT NULL) BusinessProfile columns from the structured answers,
 *  so the existing research/qualification/personalization pipeline keeps working. */
function deriveLegacyFields(companyName: string, website: string | undefined, businessDetails: string, tone: string, icp: IcpAnswers) {
  const geos = (icp.countries ?? []).map((c) => (c === "Worldwide" ? "Global" : c));
  const inds = (icp.industries ?? []).slice(0, 10);
  return {
    companyName,
    website: website || null,
    serviceOffered: businessDetails.slice(0, 1000),
    icpDescription: (icpSummary(icp) || businessDetails).slice(0, 2000),
    targetIndustries: inds.length ? inds : [icp.customerType ?? "Other"],
    targetGeographies: geos.length ? geos : ["Global"],
    companySizeRange: icp.companySize ?? null,
    painPointsSolved: (icp.problemSolved ?? businessDetails).slice(0, 1000),
    offerPositioning: businessDetails.slice(0, 1000),
    outreachTone: tone,
    businessDetails,
    icp: icp as Prisma.InputJsonValue,
  };
}

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

  // Structured path (new onboarding) when an `icp` object is present.
  let organizationId: string;
  let data: Record<string, unknown>;
  if (body && typeof body === "object" && "icp" in body) {
    const parsed = structuredSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    organizationId = parsed.data.organizationId;
    data = deriveLegacyFields(parsed.data.companyName, parsed.data.website, parsed.data.businessDetails, parsed.data.outreachTone, parsed.data.icp);
  } else {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    ({ organizationId, ...data } = parsed.data);
  }

  const member = await getOrgMembership(user.id, organizationId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Clear the cached ICP analysis whenever the profile changes so the next
  // lead-gen run regenerates it from the updated ICP.
  const profile = await prisma.businessProfile.upsert({
    where: { organizationId },
    create: { organizationId, ...data } as Prisma.BusinessProfileUncheckedCreateInput,
    update: { ...data, icpAnalysisCache: Prisma.DbNull } as Prisma.BusinessProfileUncheckedUpdateInput,
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
