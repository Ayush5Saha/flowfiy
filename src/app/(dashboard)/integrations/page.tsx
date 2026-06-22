import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IntegrationCenter } from "@/components/integrations/IntegrationCenter";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  // Cache hits — layout already fetched these this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const integrations = await prisma.integration.findMany({
    where: { organizationId: membership.organization.id },
    select: { type: true, status: true, lastValidatedAt: true },
  });

  const statusMap = Object.fromEntries(
    integrations.map((i) => [i.type, { status: i.status, lastValidatedAt: i.lastValidatedAt }])
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your tools to power the AI outbound pipeline
        </p>
      </div>
      <IntegrationCenter
        organizationId={membership.organization.id}
        statusMap={statusMap as Record<string, { status: string; lastValidatedAt: Date | null }>}
      />
    </div>
  );
}
