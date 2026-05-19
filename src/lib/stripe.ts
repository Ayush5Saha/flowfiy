import Stripe from "stripe";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// ─── Plan config ──────────────────────────────────────────────────────────────
// Price IDs are created once in the Stripe dashboard and stored in env vars.
// Amounts in USD cents — shown in UI, not charged (Stripe uses the price object).

export const STRIPE_PLANS = {
  STARTER: {
    name: "Starter",
    priceUsd: 59,
    currency: "usd",
    generationLimit: 2500,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID ?? null,
  },
  GROWTH: {
    name: "Growth",
    priceUsd: 119,
    currency: "usd",
    generationLimit: 7500,
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID ?? null,
  },
  AGENCY: {
    name: "Agency",
    priceUsd: 299,
    currency: "usd",
    generationLimit: -1,
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID ?? null,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

export function getStripePlanByPriceId(priceId: string): StripePlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.stripePriceId === priceId) return key as StripePlanKey;
  }
  return null;
}

// ─── Gateway routing ──────────────────────────────────────────────────────────

/**
 * Returns "razorpay" for Indian users, "stripe" for everyone else.
 * Caller should fall back to "razorpay" if Stripe is not configured.
 */
export function resolveGateway(countryCode: string): "razorpay" | "stripe" {
  if (countryCode?.toUpperCase() === "IN") return "razorpay";
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "razorpay";
}
