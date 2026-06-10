"use client";
import { Sidebar } from "@/components/layout/Sidebar";

const mockOrg = {
  id: "demo-org", name: "Acme Corp", slug: "acme-corp", plan: "GROWTH" as const,
  razorpayCustomerId: null, razorpaySubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null, billingGateway: null, subscriptionStatus: "active",
  generationCount: 847, generationLimit: 7500, createdAt: new Date(), updatedAt: new Date(), members: [],
  referralCode: null, referralCreditMonths: 0,
  referredByAffiliateId: null,
  monthlyTokensUsed: BigInt(0), tokenBudgetResetAt: null, apiMode: "CENTRAL" as const,
  llmProvider: "ANTHROPIC" as const, openRouterModel: null,
};

const plans = [
  { key: "FREE", name: "Free", price: 0, gens: 50, seats: 1, current: false },
  { key: "STARTER", name: "Starter", price: 4900, gens: 500, seats: 1, current: false },
  { key: "GROWTH", name: "Growth", price: 9900, gens: 7500, seats: 5, current: true },
  { key: "AGENCY", name: "Agency", price: 24900, gens: -1, seats: 20, current: false },
];

export default function DemoBillingPage() {
  const usagePct = Math.round((847 / 7500) * 100);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar organization={mockOrg} userRole="OWNER" userEmail="demo@flowfiy.com" userFullName="Demo User" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Billing</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your subscription and usage</p>
          </div>

          {/* Current plan + usage */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Growth Plan</p>
                <p className="text-sm text-muted-foreground">₹9,900/month · Renews June 12, 2026</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">Active</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Lead generations used</span>
                <span className="font-mono text-xs">847 / 2,000</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${usagePct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">1,153 generations remaining this month</p>
            </div>
            <button className="mt-2 text-sm px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">
              Manage Billing →
            </button>
          </div>

          {/* Plan cards */}
          <h2 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Available Plans</h2>
          <div className="grid grid-cols-4 gap-3">
            {plans.map((plan) => (
              <div key={plan.key} className={`bg-card border rounded-xl p-4 relative ${plan.current ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
                {plan.current && (
                  <span className="absolute -top-2.5 left-3 text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-medium">Current</span>
                )}
                <p className="font-semibold text-sm mb-0.5">{plan.name}</p>
                <p className="text-2xl font-mono font-bold mb-1">
                  {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                  {plan.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                </p>
                <div className="space-y-1 text-xs text-muted-foreground mb-4">
                  <p>{plan.gens === -1 ? "Unlimited" : plan.gens.toLocaleString()} generations</p>
                  <p>{plan.seats} seat{plan.seats > 1 ? "s" : ""}</p>
                </div>
                <button className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${plan.current ? "bg-secondary text-muted-foreground cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
                  {plan.current ? "Current plan" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">Powered by Razorpay. Cancel anytime. Unused generations don&apos;t roll over.</p>
        </div>
      </main>
    </div>
  );
}
