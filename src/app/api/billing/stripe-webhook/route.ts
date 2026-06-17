import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_PLANS, getStripePlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { grantCreditsOnce } from "@/lib/credits/service";
import { PLAN_CREDITS } from "@/lib/credits/rates";

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
        const meta = session.metadata ?? {};

        // ── One-time credit top-up (payment mode) ──────────────────────────
        if (meta.kind === "credit_topup" && meta.organizationId && meta.credits) {
          const granted = await grantCreditsOnce(meta.organizationId, Number(meta.credits), "topup", session.id);
          if (granted) {
            await createAuditLog({
              organizationId: meta.organizationId,
              action: "credits.topup",
              resourceType: "payment",
              resourceId: session.id,
              metadata: { credits: Number(meta.credits), gateway: "stripe" },
            }).catch(() => null);
          }
          break;
        }

        const { organizationId, planKey, referredOrgId, referrerOrgId } = meta;
        const subId = session.subscription as string | null;

        if (!organizationId || !planKey || !subId) break;

        const planConfig = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS];
        if (!planConfig) break;

        // INDIE is BYOK-only; STARTER+ defaults to Central API
        const apiMode = planConfig.apiMode === "BYOK" ? "BYOK" : "CENTRAL";

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: planKey as never,
            stripeSubscriptionId: subId,
            billingGateway: "stripe",
            subscriptionStatus: "active",
            generationLimit: planConfig.generationLimit,
            apiMode: apiMode as never,
          },
        });

        await createAuditLog({
          organizationId,
          action: "billing.upgraded",
          resourceType: "subscription",
          resourceId: subId,
          metadata: { plan: planKey, gateway: "stripe" },
        });

        // ── Grant the plan's monthly credits (idempotent) ─────────────────
        await grantCreditsOnce(organizationId, PLAN_CREDITS, "plan_grant", session.id).catch(() => null);

        // ── Apply referral reward to the referrer ─────────────────────────
        if (referredOrgId && referrerOrgId) {
          await applyStripeReferralReward({
            referredOrgId,
            referrerOrgId,
            planKey: planKey as keyof typeof STRIPE_PLANS,
          });
        }

        // ── Apply affiliate commission (first payment) ────────────────────
        await applyAffiliateConversion({
          organizationId,
          paymentRef: `stripe_session_${session.id}`,
          paymentAmount: session.amount_total ?? 0,
          plan: planKey,
          isNewSignup: true,
        });

        break;
      }

      // ── Renewal succeeded ──────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as unknown as {
          id?: string;
          amount_paid?: number;
          billing_reason?: string;
          parent?: { subscription_details?: { subscription?: string } };
        };
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

          // ── Recurring affiliate commission (lifetime, every renewal) ────
          // Skip the first invoice — checkout.session.completed already paid
          // the affiliate for it; this fires on subscription_cycle renewals.
          if (invoice.billing_reason === "subscription_cycle" && invoice.id) {
            await applyAffiliateConversion({
              organizationId: org.id,
              paymentRef: `stripe_invoice_${invoice.id}`,
              paymentAmount: invoice.amount_paid ?? 0,
              plan: org.plan,
              isNewSignup: false,
            });
            // Grant the plan's monthly credits on renewal (idempotent).
            await grantCreditsOnce(org.id, PLAN_CREDITS, "plan_grant", invoice.id).catch(() => null);
          }
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
          const newPlanConfig = STRIPE_PLANS[newPlanKey];
          updates.plan = newPlanKey;
          updates.generationLimit = newPlanConfig.generationLimit;
          // INDIE stays BYOK; upgrading to STARTER+ resets to Central API default
          updates.apiMode = newPlanConfig.apiMode === "BYOK" ? "BYOK" : "CENTRAL";
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

// ─── Referral reward helper ───────────────────────────────────────────────────

/**
 * Applies a 1-month free credit to the referrer's Stripe customer balance.
 * Stripe automatically applies negative customer balance to the next invoice.
 */
async function applyStripeReferralReward({
  referredOrgId,
  referrerOrgId,
  planKey,
}: {
  referredOrgId: string;
  referrerOrgId: string;
  planKey: keyof typeof STRIPE_PLANS;
}) {
  try {
    // Find the pending referral
    const referral = await prisma.referral.findFirst({
      where: {
        referredOrgId,
        referrerOrgId,
        rewardApplied: false,
      },
    });
    if (!referral) return; // no pending referral

    // Get referrer org
    const referrerOrg = await prisma.organization.findUnique({
      where: { id: referrerOrgId },
      select: { stripeCustomerId: true },
    });

    if (!referrerOrg?.stripeCustomerId) {
      // Referrer uses Razorpay — increment credit months instead
      await prisma.organization.update({
        where: { id: referrerOrgId },
        data: { referralCreditMonths: { increment: 1 } },
      });
    } else {
      // Referrer uses Stripe — apply customer balance credit
      const planConfig = STRIPE_PLANS[planKey];
      const amountCents = planConfig.priceUsd * 100; // cents

      await getStripe().customers.createBalanceTransaction(
        referrerOrg.stripeCustomerId,
        {
          amount: -amountCents, // negative = credit on their account
          currency: "usd",
          description: `Referral reward — 1 free month (${planConfig.name} plan)`,
        }
      );
    }

    // Mark referral as rewarded
    await prisma.referral.update({
      where: { id: referral.id },
      data: { rewardApplied: true, rewardAppliedAt: new Date() },
    });

    await createAuditLog({
      organizationId: referrerOrgId,
      action: "referral.reward_applied",
      resourceType: "referral",
      resourceId: referral.id,
      metadata: { referredOrgId, plan: planKey, gateway: "stripe" },
    });

    console.log(`[stripe-webhook] Referral reward applied: referrer=${referrerOrgId}, plan=${planKey}`);
  } catch (err) {
    console.error("[stripe-webhook] Failed to apply referral reward:", err);
    // Non-fatal — don't fail the webhook
  }
}

// ─── Affiliate commission helper ──────────────────────────────────────────────

/**
 * Create an AffiliateConversion when a Stripe-billed org (referred by an
 * affiliate) pays — first payment and every lifetime renewal. Idempotent via
 * paymentRef. NOTE: Stripe amounts are in cents (USD); the *_in_paise columns
 * store the smallest currency unit, so commission % is correct but the unit is
 * USD-cents for Stripe rows vs INR-paise for Razorpay rows. Payouts must convert.
 */
async function applyAffiliateConversion({
  organizationId,
  paymentRef,
  paymentAmount,
  plan,
  isNewSignup,
}: {
  organizationId: string;
  paymentRef: string;
  paymentAmount: number;
  plan: string;
  isNewSignup: boolean;
}) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { referredByAffiliateId: true },
    });
    if (!org?.referredByAffiliateId) return;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: org.referredByAffiliateId, status: "ACTIVE" },
      select: { id: true, commissionRate: true },
    });
    if (!affiliate) return;

    // Idempotency: skip if this exact payment was already recorded
    const existing = await prisma.affiliateConversion.findFirst({
      where: { razorpayPaymentId: paymentRef },
      select: { id: true },
    });
    if (existing) return;

    const commissionAmountInPaise = BigInt(
      Math.floor(paymentAmount * affiliate.commissionRate)
    );

    await prisma.$transaction([
      prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliate.id,
          organizationId,
          plan: plan as never,
          paymentAmountInPaise: BigInt(paymentAmount),
          commissionAmountInPaise,
          razorpayPaymentId: paymentRef,
          status: "APPROVED",
        },
      }),
      prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          ...(isNewSignup ? { totalSignups: { increment: 1 } } : {}),
          totalEarningsInPaise: { increment: commissionAmountInPaise },
        },
      }),
    ]);

    console.log(`[stripe-webhook] Affiliate commission created: affiliate=${affiliate.id}, ref=${paymentRef}`);
  } catch (err) {
    console.error("[stripe-webhook] Failed to apply affiliate commission:", err);
  }
}
