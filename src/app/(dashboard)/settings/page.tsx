import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  // Cache hits — layout already fetched these this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // getOrgMembership includes _count.members — no extra query needed
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { organizationId: organization.id },
  });

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your workspace and business profile</p>
      </div>

      <SettingsClient
        organization={{
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          memberCount: organization._count.members,
        }}
        businessProfile={businessProfile ? {
          companyName: businessProfile.companyName,
          website: businessProfile.website ?? "",
          serviceOffered: businessProfile.serviceOffered,
          icpDescription: businessProfile.icpDescription,
          targetIndustries: businessProfile.targetIndustries,
          targetGeographies: businessProfile.targetGeographies,
          companySizeRange: businessProfile.companySizeRange ?? "",
          painPointsSolved: businessProfile.painPointsSolved,
          offerPositioning: businessProfile.offerPositioning,
          outreachTone: businessProfile.outreachTone,
        } : null}
        user={{
          email: user.email ?? "",
          role: membership.role,
        }}
      />
    </div>
  );
}
