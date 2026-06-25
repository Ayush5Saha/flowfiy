import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getRazorpay, PLANS, getPlanByRazorpayPlanId } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { grantCreditsOnce } from "@/lib/credits/service";
import { PLAN_CREDITS } from "@/lib/credits/rates";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  // Fail closed: no secret configured → reject everything rather than throw.
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting");
    return false;
  }
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  // Constant-time comparison; mismatched lengths can't be equal.
  return a.length === b.length && timingSafeEqual(a, b);
}

type RazorpayEvent = {
  event: string;
  payload: {
    subscription?: { entity: Record<string, unknown> };
    payment?: { entity: Record<string, unknown> };
  };
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifySignature(body, signature)) {
    console.error("[webhook] Invalid Razorpay signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as RazorpayEvent;
  const sub = event.payload.subscription?.entity;
  const payment = event.payload.payment?.entity;

  console.log(`[webhook] Received: ${event.event}`);

  try {
    switch (event.event) {

      // ── Subscription created but not yet paid ───────────────────────────────
      case "subscription.pending": {
        if (!sub) break;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: sub.id as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "pending" },
          });
        }
        break;
      }

      // ── First payment completed — plan goes live ────────────────────────────
      case "subscription.activated": {
        if (!sub) break;
        const notes = sub.notes as Record<string, string> | undefined;
        const organizationId = notes?.organizationId;
        const planKey = notes?.planKey as keyof typeof PLANS | undefined;

        if (organizationId && planKey && PLANS[planKey]) {
          // Idempotency guard — Razorpay can retry if it doesn't receive a
          // fast 200. Check the audit log before writing to prevent duplicate
          // plan upgrades and double referral rewards on replayed events.
          const alreadyProcessed = await prisma.auditLog.findFirst({
            where: {
              organizationId,
              action: "billing.upgraded",
              resourceId: sub.id as string,
            },
            select: { id: true },
          });
          if (alreadyProcessed) {
            console.log(`[webhook] subscription.activated already processed for sub=${sub.id as string} — skipping`);
            break;
          }

          const planConfig = PLANS[planKey];
          // INDIE is BYOK-only; STARTER+ defaults to Central API
          const apiMode = planConfig.apiMode === "BYOK" ? "BYOK" : "CENTRAL";
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              plan: planKey as never,
              razorpaySubscriptionId: sub.id as string,
              subscriptionStatus: "active",
              generationLimit: planConfig.generationLimit,
              apiMode: apiMode as never,
            },
          });
          await createAuditLog({
            organizationId,
            action: "billing.upgraded",
            resourceType: "subscription",
            resourceId: sub.id as string,
            metadata: { plan: planKey },
          });

          // ── Apply referral reward ─────────────────────────────────────────
          await applyRazorpayReferralReward({ referredOrgId: organizationId });

          // ── Apply affiliate commission (first payment) ────────────────────
          // Only record when the payment id is present, otherwise the conversion
          // has no idempotency key and subscription.charged (which fires for the
          // same first payment) would create a second, double-counted commission.
          const firstPayment = event.payload.payment?.entity as Record<string, unknown> | undefined;
          if (firstPayment?.id) {
            await applyAffiliateConversion({
              organizationId,
              razorpayPaymentId: firstPayment.id as string,
              paymentAmountInPaise: firstPayment.amount as number | undefined ?? 0,
              plan: planKey,
              isNewSignup: true,
            });
          }

          // ── Grant the plan's monthly credits (idempotent) ─────────────────
          await grantCreditsOnce(
            organizationId,
            PLAN_CREDITS,
            "plan_grant",
            (firstPayment?.id as string) ?? (sub.id as string)
          ).catch(() => null);
        }
        break;
      }

      // ── Renewal payment succeeded ───────────────────────────────────────────
      case "subscription.charged": {
        if (!sub) break;
        const chargedPayment = event.payload.payment?.entity as Record<string, unknown> | undefined;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: sub.id as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "active" },
          });

          // ── Redeem a referral credit month (refund this renewal) ──────────
          if (org.referralCreditMonths > 0 && chargedPayment?.id) {
            await redeemRazorpayCreditMonth({
              org,
              paymentId: chargedPayment.id as string,
              paymentAmount: chargedPayment.amount as number,
            });
          }

          // ── Recurring affiliate commission ────────────────────────────────
          if (chargedPayment?.id) {
            await applyAffiliateConversion({
              organizationId: org.id,
              razorpayPaymentId: chargedPayment.id as string,
              paymentAmountInPaise: chargedPayment.amount as number,
              plan: org.plan,
              isNewSignup: false,
            });
          }

          // ── Grant the plan's monthly credits on each renewal (idempotent) ──
          if (chargedPayment?.id) {
            await grantCreditsOnce(org.id, PLAN_CREDITS, "plan_grant", chargedPayment.id as string).catch(() => null);
          }
        }
        break;
      }

      // ── Plan changed (upgrade / downgrade) ─────────────────────────────────
      case "subscription.updated": {
        if (!sub) break;
        const planId = sub.plan_id as string | undefined;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: sub.id as string },
        });
        if (org && planId) {
          const newPlanKey = getPlanByRazorpayPlanId(planId);
          if (newPlanKey && PLANS[newPlanKey]) {
            const newPlanConfig = PLANS[newPlanKey];
            // INDIE stays BYOK; upgrading to STARTER+ resets to Central API default
            const apiMode = newPlanConfig.apiMode === "BYOK" ? "BYOK" : "CENTRAL";
            await prisma.organization.update({
              where: { id: org.id },
              data: {
                plan: newPlanKey as never,
                generationLimit: newPlanConfig.generationLimit,
                subscriptionStatus: "active",
                apiMode: apiMode as never,
              },
            });
          }
        }
        break;
      }

      // ── Payment failed — Razorpay will retry, access stays active ──────────
      case "payment.failed": {
        if (!payment) break;
        const p = payment as Record<string, unknown>;
        const inv = p.invoice as Record<string, unknown> | undefined;
        const subId = (p.subscription_id ?? inv?.subscription_id) as string | undefined;
        if (!subId) break;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: subId },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { subscriptionStatus: "payment_failed" },
          });
        }
        break;
      }

      // ── Subscription halted after all retries exhausted ────────────────────
      case "subscription.halted": {
        if (!sub) break;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: sub.id as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: "FREE",
              subscriptionStatus: "halted",
              generationLimit: PLANS.FREE.generationLimit,
            },
          });
        }
        break;
      }

      // ── User cancelled — access continues until period end ─────────────────
      case "subscription.cancelled": {
        if (!sub) break;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: sub.id as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: "FREE",
              razorpaySubscriptionId: null,
              subscriptionStatus: "cancelled",
              generationLimit: PLANS.FREE.generationLimit,
            },
          });
          await createAuditLog({
            organizationId: org.id,
            action: "billing.cancelled",
            resourceType: "subscription",
            resourceId: sub.id as string,
          });
        }
        break;
      }

      // ── Subscription fully completed (total_count exhausted) ───────────────
      case "subscription.completed": {
        if (!sub) break;
        const org = await prisma.organization.findFirst({
          where: { razorpaySubscriptionId: sub.id as string },
        });
        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: "FREE",
              razorpaySubscriptionId: null,
              subscriptionStatus: "completed",
              generationLimit: PLANS.FREE.generationLimit,
            },
          });
        }
        break;
      }

      // ── One-time credit top-up captured ────────────────────────────────────
      case "payment.captured": {
        if (!payment) break;
        const p = payment as Record<string, unknown>;
        let notes = (p.notes ?? {}) as Record<string, string>;
        const orderId = p.order_id as string | undefined;
        // Top-up metadata lives on the order — fetch it when the payment lacks it.
        if (notes.kind !== "credit_topup" && orderId) {
          try {
            const order = await getRazorpay().orders.fetch(orderId);
            notes = (order.notes ?? {}) as Record<string, string>;
          } catch { /* ignore */ }
        }
        if (notes.kind === "credit_topup" && notes.organizationId && notes.credits) {
          const granted = await grantCreditsOnce(
            notes.organizationId,
            Number(notes.credits),
            "topup",
            p.id as string
          ).catch(() => false);
          if (granted) {
            await createAuditLog({
              organizationId: notes.organizationId,
              action: "credits.topup",
              resourceType: "payment",
              resourceId: p.id as string,
              metadata: { credits: Number(notes.credits), gateway: "razorpay" },
            }).catch(() => null);
          }
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.event}`);
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${event.event}:`, err);
    // Return 200 anyway — Razorpay retries on non-2xx, which could cause duplicate processing
    return NextResponse.json({ received: true, error: "processing_error" });
  }

  return NextResponse.json({ received: true });
}

// ─── Referral reward helpers ──────────────────────────────────────────────────

/**
 * When a referred user's Razorpay subscription activates, find the pending
 * referral and increment the referrer's credit months balance.
 */
async function applyRazorpayReferralReward({ referredOrgId }: { referredOrgId: string }) {
  try {
    const referral = await prisma.referral.findFirst({
      where: { referredOrgId, rewardApplied: false },
    });
    if (!referral) return;

    await prisma.$transaction([
      prisma.organization.update({
        where: { id: referral.referrerOrgId },
        data: { referralCreditMonths: { increment: 1 } },
      }),
      prisma.referral.update({
        where: { id: referral.id },
        data: { rewardApplied: true, rewardAppliedAt: new Date() },
      }),
    ]);

    await createAuditLog({
      organizationId: referral.referrerOrgId,
      action: "referral.reward_applied",
      resourceType: "referral",
      resourceId: referral.id,
      metadata: { referredOrgId, gateway: "razorpay" },
    });

    console.log(`[webhook] Referral reward credited to org=${referral.referrerOrgId}`);
  } catch (err) {
    console.error("[webhook] Failed to apply referral reward:", err);
  }
}

/**
 * On the referrer's renewal, if they have credit months, issue a full refund
 * for that charge — giving them a free month.
 */
async function redeemRazorpayCreditMonth({
  org,
  paymentId,
  paymentAmount,
}: {
  org: { id: string; referralCreditMonths: number };
  paymentId: string;
  paymentAmount: number; // in paise
}) {
  try {
    const rzp = getRazorpay();
    await rzp.payments.refund(paymentId, { amount: paymentAmount });

    await prisma.organization.update({
      where: { id: org.id },
      data: { referralCreditMonths: { decrement: 1 } },
    });

    await createAuditLog({
      organizationId: org.id,
      action: "referral.month_refunded",
      resourceType: "payment",
      resourceId: paymentId,
      metadata: { amountRefunded: paymentAmount, gateway: "razorpay" },
    });

    console.log(`[webhook] Referral free month redeemed for org=${org.id}, refunded payment=${paymentId}`);
  } catch (err) {
    console.error("[webhook] Failed to redeem referral credit month:", err);
  }
}

// ─── Affiliate commission helpers ─────────────────────────────────────────────

/**
 * Create an AffiliateConversion record whenever a referred org makes a payment.
 * Idempotent: skips if a conversion for this paymentId already exists.
 */
async function applyAffiliateConversion({
  organizationId,
  razorpayPaymentId,
  paymentAmountInPaise,
  plan,
  isNewSignup,
}: {
  organizationId: string;
  razorpayPaymentId?: string;
  paymentAmountInPaise: number;
  plan: string;
  isNewSignup: boolean;
}) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { referredByAffiliateId: true, plan: true },
    });

    if (!org?.referredByAffiliateId) return;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: org.referredByAffiliateId, status: "ACTIVE" },
      select: { id: true, commissionRate: true },
    });

    if (!affiliate) return;

    // Idempotency: skip if this exact payment was already recorded
    if (razorpayPaymentId) {
      const existing = await prisma.affiliateConversion.findFirst({
        where: { razorpayPaymentId },
        select: { id: true },
      });
      if (existing) return;
    }

    const commissionAmountInPaise = BigInt(
      Math.floor(paymentAmountInPaise * affiliate.commissionRate)
    );

    await prisma.$transaction([
      prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliate.id,
          organizationId,
          plan: plan as never,
          paymentAmountInPaise: BigInt(paymentAmountInPaise),
          commissionAmountInPaise,
          razorpayPaymentId: razorpayPaymentId ?? null,
          status: "APPROVED",
        },
      }),
      prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          // Only count new customers — not recurring renewals
          ...(isNewSignup ? { totalSignups: { increment: 1 } } : {}),
          totalEarningsInPaise: { increment: commissionAmountInPaise },
        },
      }),
    ]);

    console.log(`[webhook] Affiliate commission created: affiliate=${affiliate.id}, commission=₹${Number(commissionAmountInPaise) / 100}`);
  } catch (err) {
    console.error("[webhook] Failed to apply affiliate commission:", err);
  }
}
