import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay, PLANS, type PlanKey } from "@/lib/razorpay";
import { getStripe, STRIPE_PLANS, type StripePlanKey, resolveGateway } from "@/lib/stripe";

const schema = z.object({
  organizationId: z.string().uuid(),
  plan: z.enum(["FLOWFIY", "INDIE", "STARTER", "GROWTH", "AGENCY"]),
  /** Country code from /api/geo — determines which gateway to use */
  country: z.string().length(2).optional().default("IN"),
  /** Optional referral code entered by the buyer */
  referralCode: z.string().min(1).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { organizationId, plan, country, referralCode } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    include: { organization: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organization } = member;

  // ── Resolve referral or affiliate code ────────────────────────────────────
  let referrerOrgId: string | null = null;
  if (referralCode) {
    const code = referralCode.toUpperCase();

    // ── Check affiliate program first ────────────────────────────────────
    const affiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode: code },
      select: { id: true, status: true },
    });

    if (affiliate && affiliate.status === "ACTIVE") {
      // Mark the org as referred by this affiliate (used on webhook to create conversion)
      await prisma.organization.update({
        where: { id: organizationId },
        data: { referredByAffiliateId: affiliate.id },
      });
    } else {
      // ── Fall through to user-to-user referral ──────────────────────────
      const referrerOrg = await prisma.organization.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      // Validate: exists, not self
      if (referrerOrg && referrerOrg.id !== organizationId) {
        referrerOrgId = referrerOrg.id;
        // Create pending referral record (reward applied on webhook after payment)
        await prisma.referral.upsert({
          where: {
            referrerOrgId_referredOrgId: {
              referrerOrgId: referrerOrg.id,
              referredOrgId: organizationId,
            },
          },
          create: {
            referrerOrgId: referrerOrg.id,
            referredOrgId: organizationId,
            referredPlan: plan as never,
            rewardApplied: false,
          },
          update: {
            referredPlan: plan as never,
            rewardApplied: false,
            rewardAppliedAt: null,
          },
        });
      }
    }
  }

  const gateway = resolveGateway(country);

  // ── Stripe checkout ───────────────────────────────────────────────────────
  if (gateway === "stripe") {
    return handleStripeCheckout({ organizationId, plan: plan as StripePlanKey, organization, userEmail: user.email ?? "", referredOrgId: organizationId, referrerOrgId });
  }

  // ── Razorpay checkout (India) ─────────────────────────────────────────────
  return handleRazorpayCheckout({ organizationId, plan: plan as PlanKey, organization, userId: user.id, userEmail: user.email ?? "" });
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

async function handleRazorpayCheckout({
  organizationId, plan, organization, userId, userEmail,
}: {
  organizationId: string;
  plan: PlanKey;
  organization: { id: string; name: string; razorpayCustomerId: string | null };
  userId: string;
  userEmail: string;
}) {
  const planConfig = PLANS[plan];

  if (!planConfig.razorpayPlanId) {
    return NextResponse.json(
      { error: `Plan "${plan}" is not configured. Set RAZORPAY_${plan}_PLAN_ID in your environment.` },
      { status: 400 }
    );
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Billing is not available yet." }, { status: 503 });
  }

  const rzp = getRazorpay();

  let customerId = organization.razorpayCustomerId;
  if (!customerId) {
    try {
      const customer = await rzp.customers.create({
        name: organization.name || userEmail.split("@")[0],
        email: userEmail,
        fail_existing: 0,
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: organizationId },
        data: { razorpayCustomerId: customerId, billingGateway: "razorpay" },
      });
    } catch (err) {
      console.error("[billing] Razorpay customer create failed:", err);
    }
  }

  const subscription = await rzp.subscriptions.create({
    plan_id: planConfig.razorpayPlanId,
    customer_notify: 1,
    total_count: 120,
    ...(customerId ? { customer_id: customerId } : {}),
    notes: { organizationId, planKey: plan, userId, userEmail, orgName: organization.name },
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { razorpaySubscriptionId: subscription.id, billingGateway: "razorpay" },
  });

  return NextResponse.json({
    gateway: "razorpay",
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
    planName: planConfig.name,
    priceInr: planConfig.priceInr,
    prefill: { name: organization.name, email: userEmail },
  });
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

async function handleStripeCheckout({
  organizationId, plan, organization, userEmail, referredOrgId, referrerOrgId,
}: {
  organizationId: string;
  plan: StripePlanKey;
  organization: { id: string; name: string; stripeCustomerId: string | null };
  userEmail: string;
  referredOrgId?: string | null;
  referrerOrgId?: string | null;
}) {
  const planConfig = STRIPE_PLANS[plan];

  if (!planConfig.stripePriceId) {
    return NextResponse.json(
      { error: `Stripe plan "${plan}" is not configured. Set STRIPE_${plan}_PRICE_ID in your environment.` },
      { status: 400 }
    );
  }

  const stripe = getStripe();

  // Create or reuse Stripe customer
  let customerId = organization.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: organization.name,
      metadata: { organizationId },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customerId, billingGateway: "stripe" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true&plan=${plan}&gateway=stripe`,
    cancel_url: `${appUrl}/billing`,
    subscription_data: {
      metadata: {
        organizationId,
        planKey: plan,
        ...(referredOrgId ? { referredOrgId } : {}),
        ...(referrerOrgId ? { referrerOrgId } : {}),
      },
    },
    metadata: {
      organizationId,
      planKey: plan,
      ...(referredOrgId ? { referredOrgId } : {}),
      ...(referrerOrgId ? { referrerOrgId } : {}),
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({
    gateway: "stripe",
    checkoutUrl: session.url,
    planName: planConfig.name,
    priceUsd: planConfig.priceUsd,
  });
}
