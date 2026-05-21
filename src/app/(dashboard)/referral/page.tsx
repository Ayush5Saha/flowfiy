import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { generateReferralCode } from "@/lib/referral";
import { ReferralClient } from "@/components/referral/ReferralClient";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  // Lazy-generate referral code if needed
  let code = organization.referralCode;
  if (!code) {
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateReferralCode();
      const existing = await prisma.organization.findUnique({ where: { referralCode: candidate } });
      if (!existing) {
        const updated = await prisma.organization.update({
          where: { id: organization.id },
          data: { referralCode: candidate },
        });
        code = updated.referralCode!;
        break;
      }
    }
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerOrgId: organization.id },
    include: { referredOrg: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const paidConversions = referrals.filter((r) => r.rewardApplied).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Referral Program</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Earn 1 free month for every friend who upgrades to a paid plan using your link.
        </p>
      </div>

      <ReferralClient
        code={code ?? ""}
        totalReferrals={referrals.length}
        paidConversions={paidConversions}
        freeMonthsEarned={paidConversions}
        creditBalance={organization.referralCreditMonths}
        referrals={referrals.map((r) => ({
          id: r.id,
          referredOrgName: r.referredOrg.name,
          plan: r.referredPlan as string,
          rewardApplied: r.rewardApplied,
          rewardAppliedAt: r.rewardAppliedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
