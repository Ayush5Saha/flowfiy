import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/razorpay";
import { BillingClient } from "@/components/billing/BillingClient";
import { BuyCreditsPanel } from "@/components/billing/BuyCreditsPanel";
import { getWallet, getLedger } from "@/lib/credits/service";
import { PLAN_CREDITS } from "@/lib/credits/rates";
import { Suspense } from "react";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  // Cache hits — layout already fetched these this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  // The single managed plan (credits are the meter).
  const p = PLANS.FLOWFIY;
  const plan = {
    key: "FLOWFIY",
    name: p.name,
    priceUsd: p.priceUsd,
    priceInr: p.priceInr,
    credits: PLAN_CREDITS,
    features: p.features as readonly string[],
  };

  // Wallet + recent ledger + credits consumed this cycle.
  const cycleStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [wallet, ledgerRaw, consumed] = await Promise.all([
    getWallet(organization.id).catch(() => ({ balance: 0, held: 0 })),
    getLedger(organization.id, 12).catch(() => []),
    prisma.creditLedger
      .aggregate({
        where: { organizationId: organization.id, type: "CONSUME", createdAt: { gte: cycleStart } },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: 0 } })),
  ]);
  const creditsUsedThisCycle = Math.abs(consumed._sum.amount ?? 0);
  const ledger = ledgerRaw.map((e) => ({
    id: e.id,
    type: e.type as string,
    amount: e.amount,
    createdAt: e.createdAt.toISOString(),
  }));

  const subscriptionActive = organization.plan !== "FREE" && organization.subscriptionStatus === "active";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription, credits and usage</p>
      </div>

      {/* Suspense needed because BillingClient uses useSearchParams */}
      <Suspense fallback={<div className="h-96 bg-card border border-border rounded-xl animate-pulse" />}>
        <BillingClient
          organization={{
            id: organization.id,
            name: organization.name,
            plan: organization.plan,
            subscriptionStatus: organization.subscriptionStatus,
            razorpaySubscriptionId: organization.razorpaySubscriptionId,
            stripeSubscriptionId: organization.stripeSubscriptionId,
            billingGateway: organization.billingGateway,
          }}
          plan={plan}
          wallet={wallet}
          creditsUsedThisCycle={creditsUsedThisCycle}
          subscriptionActive={subscriptionActive}
          ledger={ledger}
        />
      </Suspense>

      <div id="buy-credits" className="mt-8 scroll-mt-24">
        <BuyCreditsPanel active={subscriptionActive} balance={wallet.balance} held={wallet.held} />
      </div>
    </div>
  );
}
