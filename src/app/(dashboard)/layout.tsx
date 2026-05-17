import { redirect } from "next/navigation";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  // Count active campaigns with at least one reply (for the badge)
  const activeCampaignReplies = await prisma.campaignLead.count({
    where: {
      campaign: { organizationId: organization.id, status: "ACTIVE" },
      status: "REPLIED",
    },
  });

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          organization={organization}
          userRole={membership.role}
          userEmail={user.email ?? ""}
          userFullName={fullName}
          activeCampaignReplies={activeCampaignReplies}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
