import { redirect } from "next/navigation";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { BugReportWidget } from "@/components/support/BugReportWidget";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// Lead source integrations — at least ONE must be connected (Apollo preferred, Apify accepted)
const LEAD_SOURCE_TYPES = ["APOLLO", "APIFY"] as const;

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

  // Count missing required integrations:
  // - At least one lead source (Apollo OR Apify) must be connected
  // - Gmail must be connected
  const hasLeadSource = LEAD_SOURCE_TYPES.some((t) => connectedTypes.has(t));
  const hasGmail = connectedTypes.has("GMAIL");
  const missingRequired = (hasLeadSource ? 0 : 1) + (hasGmail ? 0 : 1);

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
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
      <BugReportWidget />
    </ToastProvider>
  );
}
