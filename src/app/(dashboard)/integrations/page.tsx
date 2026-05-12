import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IntegrationCenter } from "@/components/integrations/IntegrationCenter";

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/onboarding");

  const integrations = await prisma.integration.findMany({
    where: { organizationId: membership.organization.id },
    select: { type: true, status: true, lastValidatedAt: true },
  });

  const statusMap = Object.fromEntries(
    integrations.map((i) => [i.type, { status: i.status, lastValidatedAt: i.lastValidatedAt }])
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Integrations</h1>
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
