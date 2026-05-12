import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay, PLANS, type PlanKey } from "@/lib/razorpay";

const schema = z.object({
  organizationId: z.string().uuid(),
  plan: z.enum(["STARTER", "GROWTH", "AGENCY"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { organizationId, plan } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    include: { organization: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organization } = member;
  const planConfig = PLANS[plan as PlanKey];

  if (!planConfig.razorpayPlanId) {
    return NextResponse.json(
      { error: `Plan "${plan}" is not configured. Set RAZORPAY_${plan}_PLAN_ID in your environment variables.` },
      { status: 400 }
    );
  }

  // Guard: Razorpay keys not yet set (billing coming soon)
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: "Billing is not available yet. Please contact support@flowfiy.com." },
      { status: 503 }
    );
  }

  const rzp = getRazorpay();

  // ── Create or reuse Razorpay Customer ────────────────────────────────────────
  let customerId = organization.razorpayCustomerId;

  if (!customerId) {
    const customerName = organization.name || user.email?.split("@")[0] || "Customer";
    try {
      const customer = await rzp.customers.create({
        name: customerName,
        email: user.email ?? "",
        fail_existing: 0,
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: organizationId },
        data: { razorpayCustomerId: customerId },
      });
    } catch (err) {
      console.error("[billing] Failed to create Razorpay customer:", err);
    }
  }

  // ── Create Razorpay Subscription ──────────────────────────────────────────────
  const subscription = await rzp.subscriptions.create({
    plan_id: planConfig.razorpayPlanId,
    customer_notify: 1,
    total_count: 120,
    ...(customerId ? { customer_id: customerId } : {}),
    notes: {
      organizationId,
      planKey: plan,
      userId: user.id,
      userEmail: user.email ?? "",
      orgName: organization.name,
    },
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { razorpaySubscriptionId: subscription.id },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId: process.env.RAZORPAY_KEY_ID,
    planName: planConfig.name,
    priceInr: planConfig.priceInr,
    prefill: {
      name: organization.name,
      email: user.email ?? "",
    },
  });
}
