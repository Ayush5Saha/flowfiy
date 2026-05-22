import { redirect } from "next/navigation";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Integrations that must be connected for the core pipeline to work
const REQUIRED_INTEGRATION_TYPES = ["APOLLO", "GMAIL"] as const;

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

  // Fetch campaign replies + integration statuses in parallel
  const [activeCampaignReplies, connectedIntegrations] = await Promise.all([
    prisma.campaignLead.count({
      where: {
        campaign: { organizationId: organization.id, status: "ACTIVE" },
        status: "REPLIED",
      },
    }),
    prisma.integration.findMany({
      where: { organizationId: organization.id, status: "CONNECTED" },
      select: { type: true },
    }),
  ]);

  const connectedTypes = new Set(connectedIntegrations.map((i) => i.type));

  // Count how many required integrations are not yet connected
  const missingRequired = REQUIRED_INTEGRATION_TYPES.filter(
    (t) => !connectedTypes.has(t)
  ).length;

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          organization={organization}
          userRole={membership.role}
          userEmail={user.email ?? ""}
          userFullName={fullName}
          activeCampaignReplies={activeCampaignReplies}
          missingIntegrations={missingRequired}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
