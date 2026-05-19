import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_PLANS, getStripePlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * POST /api/billing/stripe-webhook
 *
 * Receives Stripe webhook events and keeps the org's plan + subscription
 * status in sync. Register this URL in the Stripe dashboard:
 *   https://dashboard.stripe.com/webhooks
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET  (from Stripe webhook signing secret)
 *
 * Events handled:
 *   checkout.session.completed   → activate subscription after first payment
 *   invoice.payment_succeeded    → mark active on renewal
 *   invoice.payment_failed       → mark payment_failed
 *   customer.subscription.updated → plan change / cancellation schedule
 *   customer.subscription.deleted → subscription ended, revert to FREE
 */

// Next.js App Router requires raw body for Stripe signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe-webhook] ${event.type}`);

  try {
    switch (event.type) {

      // ── First payment completed via Checkout Session ───────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { organizationId, planKey } = session.metadata ?? {};
        const subId = session.subscription as string | null;

        if (!organizationId || !planKey || !subId) break;

        const planConfig = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];
        if (!planConfig) break;

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: planKey as never,
            stripeSubscriptionId: subId,
            billingGateway: "stripe",
            subscriptionStatus: "active",
            generationLimit: planConfig.generationLimit,
          },
        });

        await createAuditLog({
          organizationId,
          action: "billing.upgraded",
          resourceType: "subscription",
          resourceId: subId,
          metadata: { plan: planKey, gateway: "stripe" },
        });
        break;
      }

      // ── Renewal succeeded ──────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as unknown as { parent?: { subscription_details?: { subscription?: string } } };
        const subId = invoice.parent?.subscription_details?.subscription;
        if (!subId) break;

        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "active" },
          });
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { parent?: { subscription_details?: { subscription?: string } } };
        const subId = invoice.parent?.subscription_details?.subscription;
        if (!subId) break;

        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subId },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "payment_failed" },
          });
        }
        break;
      }

      // ── Plan changed or cancellation scheduled ────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!org) break;

        // Detect plan change via price ID
        const priceId = sub.items.data[0]?.price.id;
        const newPlanKey = priceId ? getStripePlanByPriceId(priceId) : null;

        // Cancellation scheduled (cancel_at_period_end = true)
        const isCancelScheduled = sub.cancel_at_period_end;

        const updates: Record<string, unknown> = {
          subscriptionStatus: isCancelScheduled ? "pending_cancellation" : sub.status,
        };

        if (newPlanKey && STRIPE_PLANS[newPlanKey]) {
          updates.plan = newPlanKey;
          updates.generationLimit = STRIPE_PLANS[newPlanKey].generationLimit;
        }

        await prisma.organization.update({
          where: { id: org.id },
          data: updates as never,
        });
        break;
      }

      // ── Subscription ended (cancelled at period end, or immediately) ───────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            subscriptionStatus: "cancelled",
            generationLimit: 100, // FREE plan limit
          },
        });

        await createAuditLog({
          organizationId: org.id,
          action: "billing.cancelled",
          resourceType: "subscription",
          resourceId: sub.id,
          metadata: { gateway: "stripe" },
        });
        break;
      }

      default:
        // Ignore unhandled events — Stripe sends many we don't care about
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error processing ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry endlessly — log it and investigate
    return NextResponse.json({ received: true, error: "processing_error" });
  }

  return NextResponse.json({ received: true });
}
