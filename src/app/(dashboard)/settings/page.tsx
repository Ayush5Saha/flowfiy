import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: { include: { _count: { select: { members: true } } } } },
  });
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const businessProfile = await prisma.businessProfile.findUnique({
    where: { organizationId: organization.id },
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
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
