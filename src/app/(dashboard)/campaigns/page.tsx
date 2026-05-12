import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Megaphone, Plus, ArrowRight, Mail, Users, Plug } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
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
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">Outreach campaigns and email sequences</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Megaphone className="w-7 h-7 text-primary" />
          </div>

          <h2 className="font-semibold text-lg mb-2">Launch your first outreach campaign</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Select qualified leads, preview AI-written emails, and send directly from your
            Gmail account. Track replies and meeting bookings in one place.
          </p>

          {blockers.length > 0 ? (
            <div className="max-w-sm mx-auto mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Before you can send
              </p>
              <div className="space-y-2 text-left">
                {blockers.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href + label}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                      {label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create campaign
            </Link>
          )}

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
            {[
              { stat: "Gmail", label: "sends from your inbox" },
              { stat: "3-touch", label: "automated sequence" },
              { stat: "50/hr", label: "max send rate" },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-3">
                <p className="text-lg font-mono font-bold">{stat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {campaign._count.campaignLeads} leads · {campaign.sentCount} sent · {campaign.replyCount} replies
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  campaign.status === "ACTIVE" ? "bg-green-500/10 text-green-400" :
                  campaign.status === "PAUSED" ? "bg-yellow-500/10 text-yellow-400" :
                  campaign.status === "COMPLETED" ? "bg-secondary text-muted-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
