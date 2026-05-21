import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/referral";

/**
 * GET /api/referral
 * Returns the current org's referral code, auto-generating one if it doesn't exist yet.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const { organization } = membership;

  // Lazy-generate referral code
  let code = organization.referralCode;
  if (!code) {
    // Retry loop in case of (extremely unlikely) collision
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateReferralCode();
      const existing = await prisma.organization.findUnique({ where: { referralCode: candidate } });
      if (!existing) {
        const updated = await prisma.organization.update({
          where: { id: organization.id },
          data: { referralCode: candidate },
        });
        code = updated.referralCode!;
        break;
      }
    }
  }

  if (!code) {
    return NextResponse.json({ error: "Could not generate referral code" }, { status: 500 });
  }

  // Fetch stats
  const referrals = await prisma.referral.findMany({
    where: { referrerOrgId: organization.id },
    include: { referredOrg: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalReferrals = referrals.length;
  const paidConversions = referrals.filter((r) => r.rewardApplied).length;
  const freeMonthsEarned = paidConversions; // 1 per conversion

  return NextResponse.json({
    code,
    totalReferrals,
    paidConversions,
    freeMonthsEarned,
    creditBalance: organization.referralCreditMonths,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredOrgName: r.referredOrg.name,
      plan: r.referredPlan,
      rewardApplied: r.rewardApplied,
      rewardAppliedAt: r.rewardAppliedAt,
      createdAt: r.createdAt,
    })),
  });
}

/**
 * POST /api/referral
 * Validates a referral code entered by a prospective buyer.
 * Returns { valid: true, referrerName: string } or { valid: false, error: string }.
 */
const validateSchema = z.object({
  code: z.string().min(1),
  organizationId: z.string().uuid(), // the ORG that is redeeming (to prevent self-referral)
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = validateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });

  const { code, organizationId } = parsed.data;

  const referrerOrg = await prisma.organization.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true, name: true },
  });

  if (!referrerOrg) {
    return NextResponse.json({ valid: false, error: "Invalid referral code" });
  }

  if (referrerOrg.id === organizationId) {
    return NextResponse.json({ valid: false, error: "You cannot use your own referral code" });
  }

  return NextResponse.json({ valid: true, referrerName: referrerOrg.name });
}
