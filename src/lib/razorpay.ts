import Razorpay from "razorpay";

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const razorpay = new (require("razorpay"))({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
}) as InstanceType<typeof Razorpay>;

// Prices in INR (Razorpay native currency).
// USD reference shown in UI only. INR amounts = USD * ~83.
export const PLANS = {
  FREE: {
    name: "Free",
    priceUsd: 0,
    priceInr: 0,           // ₹0 — no Razorpay plan needed
    currency: "INR",
    generationLimit: 50,
    seats: 1,
    features: ["50 lifetime generations", "1 seat", "1 campaign"],
    razorpayPlanId: null as string | null,
  },
  STARTER: {
    name: "Starter",
    priceUsd: 49,
    priceInr: 4099,        // ₹4,099/mo
    currency: "INR",
    generationLimit: 500,
    seats: 1,
    features: ["500 generations/mo", "1 seat", "5 campaigns", "CSV import", "Email outreach"],
    razorpayPlanId: process.env.RAZORPAY_STARTER_PLAN_ID ?? null,
  },
  GROWTH: {
    name: "Growth",
    priceUsd: 99,
    priceInr: 8299,        // ₹8,299/mo
    currency: "INR",
    generationLimit: 2000,
    seats: 5,
    features: ["2,000 generations/mo", "5 seats", "Unlimited campaigns", "Priority queue", "Analytics"],
    razorpayPlanId: process.env.RAZORPAY_GROWTH_PLAN_ID ?? null,
  },
  AGENCY: {
    name: "Agency",
    priceUsd: 249,
    priceInr: 20799,       // ₹20,799/mo
    currency: "INR",
    generationLimit: -1,   // unlimited
    seats: 20,
    features: ["Unlimited generations", "20 seats", "Unlimited campaigns", "White-label ready", "Dedicated support"],
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
