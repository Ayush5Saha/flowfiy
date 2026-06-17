import Razorpay from "razorpay";

// Lazy singleton — won't throw at import time if keys aren't set yet.
// Call getRazorpay() inside route handlers; it throws a clear error if unconfigured.
let _razorpay: InstanceType<typeof Razorpay> | null = null;

export function getRazorpay(): InstanceType<typeof Razorpay> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!_razorpay) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _razorpay = new (require("razorpay"))({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    }) as InstanceType<typeof Razorpay>;
  }
  return _razorpay;
}

/** @deprecated use getRazorpay() inside route handlers */
export const razorpay = {
  get subscriptions() { return getRazorpay().subscriptions; },
  get customers()     { return getRazorpay().customers; },
  get orders()        { return getRazorpay().orders; },
};

// Prices in INR (Razorpay native currency).
// USD reference shown in UI only. INR amounts = USD * ~83.
export const PLANS = {
  FREE: {
    name: "Free",
    priceUsd: 0,
    priceInr: 0,           // ₹0 — no Razorpay plan needed
    currency: "INR",
    generationLimit: 100,
    seats: 1,
    apiMode: "BYOK" as const,   // BYOK only — user must connect own Anthropic key
    features: ["100 generations/mo", "1 seat", "1 campaign", "Gmail integration", "BYOK (own Anthropic key)", "Community support"],
    razorpayPlanId: null as string | null,
  },
  // ── Current model: one managed plan, metered by credits ──────────────────────
  // $50/mo grants 400 credits (≈600–800 leads). The webhook grants PLAN_CREDITS
  // on activation + each renewal. generationLimit is legacy/ignored under credits.
  FLOWFIY: {
    name: "Flowfiy",
    priceUsd: 50,
    priceInr: 4200,        // ₹4,200/mo (≈ $50)
    currency: "INR",
    generationLimit: 400,  // legacy field — credits are the real meter
    seats: 1,
    apiMode: "CENTRAL" as const, // fully managed AI + data, no BYOK
    features: ["400 credits / month (≈600–800 leads)", "Describe leads in plain English", "Condition-based targeting", "Fully managed AI — no API keys", "Sends from your own Gmail", "Top up extra credits anytime"],
    razorpayPlanId: process.env.RAZORPAY_FLOWFIY_PLAN_ID ?? null,
  },
  INDIE: {
    name: "Indie",
    priceUsd: 20,
    priceInr: 1700,        // ₹1,700/mo
    currency: "INR",
    generationLimit: 2500,
    seats: 1,
    apiMode: "BYOK" as const,   // BYOK only — no central API access
    features: ["2,500 generations/mo", "1 seat", "3 campaigns", "Gmail integration", "BYOK (own Anthropic key)", "Email support"],
    razorpayPlanId: process.env.RAZORPAY_INDIE_PLAN_ID ?? null,
  },
  STARTER: {
    name: "Starter",
    priceUsd: 49,
    priceInr: 4900,        // ₹4,900/mo
    currency: "INR",
    generationLimit: 2500,
    seats: 1,
    apiMode: "CHOICE" as const,  // Central API (default) or BYOK — user's choice
    features: ["2,500 generations/mo", "1 seat", "5 campaigns", "CSV import", "Email outreach", "Central AI or BYOK", "Email support"],
    razorpayPlanId: process.env.RAZORPAY_STARTER_PLAN_ID ?? null,
  },
  GROWTH: {
    name: "Growth",
    priceUsd: 119,
    priceInr: 9900,        // ₹9,900/mo
    currency: "INR",
    generationLimit: 7500,
    seats: 5,
    apiMode: "CHOICE" as const,  // Central API (default) or BYOK — user's choice
    features: ["7,500 generations/mo", "5 seats", "Unlimited campaigns", "Priority queue", "Analytics", "A/B testing", "Webhooks & export", "Central AI or BYOK"],
    razorpayPlanId: process.env.RAZORPAY_GROWTH_PLAN_ID ?? null,
  },
  AGENCY: {
    name: "Agency",
    priceUsd: 299,
    priceInr: 24900,       // ₹24,900/mo
    currency: "INR",
    generationLimit: -1,   // unlimited
    seats: 20,
    apiMode: "CHOICE" as const,  // Central API (default) or BYOK — user's choice
    features: ["Unlimited generations", "20 seats", "Unlimited campaigns", "White-label ready", "API access", "Central AI or BYOK", "Dedicated support"],
    razorpayPlanId: process.env.RAZORPAY_AGENCY_PLAN_ID ?? null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByRazorpayPlanId(planId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.razorpayPlanId === planId) return key as PlanKey;
  }
  return null;
}
