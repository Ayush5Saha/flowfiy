import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/razorpay";
import { BillingClient } from "@/components/billing/BillingClient";

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription and usage</p>
      </div>

      <BillingClient
        organization={{
          id: organization.id,
          plan: organization.plan,
          generationCount: organization.generationCount,
          generationLimit: organization.generationLimit,
          subscriptionStatus: organization.subscriptionStatus,
          razorpaySubscriptionId: organization.razorpaySubscriptionId,
        }}
        usageThisMonth={usageThisMonth}
        plans={Object.entries(PLANS).map(([key, value]) => ({
          key,
          name: value.name,
          price: value.price,
          generationLimit: value.generationLimit,
          seats: value.seats,
        }))}
      />
    </div>
  );
}
