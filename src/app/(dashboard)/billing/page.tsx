import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/razorpay";
import { BillingClient } from "@/components/billing/BillingClient";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const usageThisMonth = await prisma.usageEvent.count({
    where: {
      organizationId: organization.id,
      eventType: "lead_generation",
      createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    },
  });

  const plans = Object.entries(PLANS).map(([key, value]) => ({
    key,
    name: value.name,
    priceUsd: value.priceUsd,
    priceInr: value.priceInr,
    generationLimit: value.generationLimit,
    seats: value.seats,
    features: value.features,
  }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription and usage</p>
      </div>

      {/* Suspense needed because BillingClient uses useSearchParams */}
      <Suspense fallback={<div className="h-96 bg-card border border-border rounded-xl animate-pulse" />}>
        <BillingClient
          organization={{
            id: organization.id,
            name: organization.name,
            plan: organization.plan,
            generationCount: organization.generationCount,
            generationLimit: organization.generationLimit,
            subscriptionStatus: organization.subscriptionStatus,
            razorpaySubscriptionId: organization.razorpaySubscriptionId,
          }}
          usageThisMonth={usageThisMonth}
          plans={plans}
        />
      </Suspense>
    </div>
  );
}
