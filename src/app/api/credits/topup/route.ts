import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { getRazorpay } from "@/lib/razorpay";
import { getStripe, resolveGateway } from "@/lib/stripe";
import { CREDIT_VALUE_INR, TOPUP_MIN_CREDITS, TOPUP_MAX_CREDITS, TRIAL_LEADS, TRIAL_MIN_CREDITS } from "@/lib/credits/rates";
import { CURRENCIES } from "@/lib/currency";

const schema = z.object({
  credits: z.number().int(),
  country: z.string().length(2).optional().default("IN"),
});

// POST /api/credits/topup — buy N custom credits. 403 unless the org has an
// active subscription (credit top-ups are subscription-gated).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const org = membership.organization;

  // ── Trial gate ────────────────────────────────────────────────────────────
  // Non-subscribers may top up to fund their first TRIAL_LEADS leads. Once that
  // allowance is used, an active subscription is required to add more credits.
  const subscribed = org.plan !== "FREE" && org.subscriptionStatus === "active";
  if (!subscribed && org.trialLeadsUsed >= TRIAL_LEADS) {
    return NextResponse.json(
      { error: `You've used your ${TRIAL_LEADS} free leads — subscribe to keep generating.`, requiresSubscription: true },
      { status: 403 }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { credits, country } = parsed.data;

  // Non-subscribers must deposit enough to fund the trial (covers high-condition leads).
  const minCredits = subscribed ? TOPUP_MIN_CREDITS : TRIAL_MIN_CREDITS;
  if (credits < minCredits || credits > TOPUP_MAX_CREDITS) {
    return NextResponse.json(
      { error: `Choose between ${minCredits} and ${TOPUP_MAX_CREDITS} credits.` },
      { status: 400 }
    );
  }

  const inr = credits * CREDIT_VALUE_INR;
  const notes = { kind: "credit_topup", organizationId: org.id, credits: String(credits) };
  const gateway = resolveGateway(country);

  // ── Razorpay order (INR) ──────────────────────────────────────────────────
  if (gateway === "razorpay") {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Billing is not available yet." }, { status: 503 });
    }
    const order = await getRazorpay().orders.create({
      amount: inr * 100, // paise
      currency: "INR",
      notes,
    });
    return NextResponse.json({
      gateway: "razorpay",
      orderId: order.id,
      amount: inr * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      credits,
      prefill: { name: org.name, email: user.email ?? "" },
    });
  }

  // ── Stripe one-time checkout (USD) ────────────────────────────────────────
  const usdCents = Math.max(50, Math.round(inr * CURRENCIES.USD.rateFromInr * 100));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${credits} Flowfiy credits` },
          unit_amount: usdCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/billing?topup=success&credits=${credits}`,
    cancel_url: `${appUrl}/billing`,
    metadata: notes,
    ...(org.stripeCustomerId ? { customer: org.stripeCustomerId } : { customer_email: user.email ?? undefined }),
  });

  return NextResponse.json({ gateway: "stripe", checkoutUrl: session.url, credits });
}
