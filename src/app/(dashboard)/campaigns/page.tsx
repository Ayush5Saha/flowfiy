import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowRight, Users, Plug } from "lucide-react";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  // Cache hits — layout already fetched these this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const orgId = membership.organization.id;

  const [campaigns, qualifiedLeadCount, gmailConnected] = await Promise.all([
    prisma.campaign.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { campaignLeads: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.count({
      where: { organizationId: orgId, status: { in: ["QUALIFIED", "CONTACTED"] } },
    }),
    prisma.integration.findUnique({
      where: { organizationId_type: { organizationId: orgId, type: "GMAIL" } },
      select: { status: true },
    }),
  ]);

  const hasGmail = gmailConnected?.status === "CONNECTED";
  const hasQualifiedLeads = qualifiedLeadCount > 0;

  const blockers = [
    !hasQualifiedLeads && {
      label: `Generate qualified leads first (${qualifiedLeadCount} qualified currently)`,
      href: "/leads",
      icon: Users,
    },
    !hasGmail && {
      label: "Connect Gmail to enable sending",
      href: "/integrations",
      icon: Plug,
    },
  ].filter(Boolean) as { label: string; href: string; icon: React.ElementType }[];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Outreach campaigns and email sequences</p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="border-t border-border pt-12 text-center">
          <h2 className="text-lg font-semibold mb-2">Launch your first outreach campaign</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
            Select qualified leads, preview AI-written emails, and send directly from your Gmail account. Track replies and meetings in one place.
          </p>

          {blockers.length > 0 ? (
            <div className="max-w-md mx-auto text-left border-y border-border divide-y divide-border">
              {blockers.map(({ label, href, icon: Icon }) => (
                <Link key={href + label} href={href} className="flex items-center gap-3 py-3.5 group">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          ) : (
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Create campaign
            </Link>
          )}

          <div className="mt-10 grid grid-cols-3 max-w-lg mx-auto border-y border-border py-5">
            {[
              { stat: "Gmail", label: "sends from your inbox" },
              { stat: "3-touch", label: "automated sequence" },
              { stat: "50/hr", label: "max send rate" },
            ].map(({ stat, label }, i) => (
              <div key={label} className={i === 0 ? "" : "border-l border-border"}>
                <p className="text-base font-semibold">{stat}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <section>
          <h2 className="text-sm font-semibold mb-1">All campaigns</h2>
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex items-center justify-between gap-4 py-4 group">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {campaign._count.campaignLeads} leads · {campaign.sentCount} sent
                    {campaign.sentCount > 0 && <> · {Math.round((campaign.replyCount / campaign.sentCount) * 100)}% reply rate</>}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <CampaignStatus status={campaign.status} />
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CampaignStatus({ status }: { status: string }) {
  const dot =
    status === "ACTIVE" ? "bg-emerald-400" :
    status === "PAUSED" ? "bg-amber-400" :
    "bg-muted-foreground/50";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
