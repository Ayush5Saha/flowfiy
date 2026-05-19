import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { getStripe } from "@/lib/stripe";

const schema = z.object({ organizationId: z.string().uuid() });

/**
 * POST /api/billing/portal
 *
 * Cancel or manage subscription. Behaviour depends on billing gateway:
 *
 * Razorpay: cancel at end of current period (Razorpay API).
 * Stripe:   create a Stripe Customer Portal session and return the URL.
 *           The client redirects the user there to self-manage.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { organizationId } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    include: { organization: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organization } = member;
  const gateway = organization.billingGateway ?? "razorpay";

  // ── Stripe portal ─────────────────────────────────────────────────────────
  if (gateway === "stripe") {
    if (!organization.stripeCustomerId) {
      return NextResponse.json({ error: "No active Stripe subscription" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";

    const session = await getStripe().billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ gateway: "stripe", portalUrl: session.url });
  }

  // ── Razorpay cancel ───────────────────────────────────────────────────────
  if (!organization.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  // false = cancel at end of current billing cycle
  await getRazorpay().subscriptions.cancel(organization.razorpaySubscriptionId, false);

  await prisma.organization.update({
    where: { id: organizationId },
    data: { subscriptionStatus: "pending_cancellation" },
  });

  return NextResponse.json({ gateway: "razorpay", cancelled: true });
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
