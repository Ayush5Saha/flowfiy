import Razorpay from "razorpay";

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const razorpay = new (require("razorpay"))({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
}) as InstanceType<typeof Razorpay>;

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    generationLimit: 50,
    seats: 1,
    razorpayPlanId: null as string | null,
  },
  STARTER: {
    name: "Starter",
    price: 49,
    generationLimit: 500,
    seats: 1,
    razorpayPlanId: process.env.RAZORPAY_STARTER_PLAN_ID ?? null,
  },
  GROWTH: {
    name: "Growth",
    price: 99,
    generationLimit: 2000,
    seats: 5,
    razorpayPlanId: process.env.RAZORPAY_GROWTH_PLAN_ID ?? null,
  },
  AGENCY: {
    name: "Agency",
    price: 249,
    generationLimit: -1,
    seats: 20,
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
