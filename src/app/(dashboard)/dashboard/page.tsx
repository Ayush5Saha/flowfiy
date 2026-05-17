import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Mail, TrendingUp, Plus, ArrowRight, MessageSquare, Megaphone } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // These are cache hits — layout already called them this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalLeads, qualifiedLeads, totalSent, totalReplied, activeCampaigns, recentLists, integrations, businessProfile, sentToday, repliedToday] =
    await Promise.all([
      prisma.lead.count({ where: { organizationId: organization.id } }),
      prisma.lead.count({ where: { organizationId: organization.id, status: "QUALIFIED" } }),
      prisma.campaignLead.count({
        where: { campaign: { organizationId: organization.id }, status: { in: ["SENT", "REPLIED"] } },
      }),
      prisma.campaignLead.count({
        where: { campaign: { organizationId: organization.id }, status: "REPLIED" },
      }),
      prisma.campaign.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.leadList.findMany({
        where: { organizationId: organization.id, status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, status: true, totalLeads: true, qualifiedLeads: true, createdAt: true },
      }),
      prisma.integration.findMany({
        where: { organizationId: organization.id, status: "CONNECTED" },
        select: { type: true },
      }),
      prisma.businessProfile.findUnique({ where: { organizationId: organization.id } }),
      prisma.campaignLead.count({
        where: { campaign: { organizationId: organization.id }, sentAt: { gte: todayStart } },
      }),
      prisma.campaignLead.count({
        where: { campaign: { organizationId: organization.id }, status: "REPLIED", updatedAt: { gte: todayStart } },
      }),
    ]);

  const connectedTypes = new Set(integrations.map((i) => i.type));

  const checklistSteps = [
    {
      id: "workspace",
      label: "Create your workspace",
      description: "Name your organization and set it up",
      href: "/settings",
      done: true,
    },
    {
      id: "business-profile",
      label: "Set up your business profile & ICP",
      description: "Tell Flowfiy who your ideal customer is so it can find and qualify leads",
      href: "/settings",
      done: !!businessProfile,
    },
    {
      id: "claude-key",
      label: "Connect your Flowfiy API key",
      description: "Add your Anthropic API key — Flowfiy powers the entire research pipeline",
      href: "/integrations",
      done: connectedTypes.has("CLAUDE"),
    },
    {
      id: "apollo-key",
      label: "Connect Apollo for lead discovery",
      description: "Apollo finds contacts matching your ICP from 275M+ verified professionals",
      href: "/integrations",
      done: connectedTypes.has("APOLLO"),
    },
    {
      id: "gmail",
      label: "Connect Gmail to send outreach",
      description: "Emails send from your own Gmail account — no shared IP, full deliverability",
      href: "/integrations",
      done: connectedTypes.has("GMAIL"),
    },
    {
      id: "first-leads",
      label: "Generate your first lead list",
      description: "Run the 5-agent pipeline: ICP → discover → research → qualify → personalize",
      href: "/leads",
      done: totalLeads > 0,
    },
    {
      id: "first-campaign",
      label: "Send your first campaign",
      description: "Select qualified leads, preview copy, and launch your outreach",
      href: "/campaigns",
      done: totalSent > 0,
    },
  ];

  const usagePercent = organization.generationLimit === -1
    ? 0
    : Math.round((organization.generationCount / organization.generationLimit) * 100);

  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: Users, color: "text-blue-400" },
    { label: "Qualified", value: qualifiedLeads, icon: TrendingUp, color: "text-green-400" },
    { label: "Emails Sent", value: totalSent, icon: Mail, color: "text-purple-400" },
    { label: "Reply Rate", value: `${replyRate}%`, icon: MessageSquare, color: "text-yellow-400" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back — here&apos;s your outbound overview
          </p>
        </div>
        <Link
          href="/leads"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Leads
        </Link>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist steps={checklistSteps} organizationId={organization.id} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-xs">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-semibold font-mono">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Today's activity strip */}
      {(sentToday > 0 || repliedToday > 0) && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground font-mono">{sentToday}</strong> emails sent today
            {repliedToday > 0 && (
              <> · <strong className="text-green-400 font-mono">{repliedToday}</strong> new repl{repliedToday === 1 ? "y" : "ies"} today</>
            )}
          </p>
          <Link href="/campaigns" className="ml-auto text-xs text-primary hover:underline">
            View campaigns →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent lead lists */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Recent Lead Lists</h2>
            <Link href="/leads" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLists.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No lead lists yet</p>
              <Link href="/leads" className="text-primary text-sm hover:underline mt-1 inline-block">
                Generate your first leads →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/leads/${list.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{list.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {list.totalLeads} leads · {list.qualifiedLeads} qualified
                    </p>
                  </div>
                  <StatusBadge status={list.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Quick actions + Usage */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-medium mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/leads" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-sm flex-1">Generate Leads</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/campaigns/new" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm">New Campaign</span>
                  {activeCampaigns > 0 && (
                    <span className="ml-2 text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">
                      {activeCampaigns} active
                    </span>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-sm flex-1">Edit ICP / Profile</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-medium mb-3">Usage</h2>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Generations used</span>
                <span className="font-mono text-xs">
                  {organization.generationCount}
                  {organization.generationLimit !== -1 && ` / ${organization.generationLimit}`}
                </span>
              </div>
              {organization.generationLimit !== -1 && (
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${usagePercent > 80 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="border border-border rounded-lg p-3 mb-3">
              <p className="text-xs font-medium capitalize">{organization.plan.toLowerCase()} Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {organization.generationLimit === -1
                  ? "Unlimited generations"
                  : `${Math.max(0, organization.generationLimit - organization.generationCount)} remaining`}
              </p>
            </div>
            {organization.plan === "FREE" && (
              <Link
                href="/billing"
                className="block w-full text-center py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Draft", class: "bg-secondary text-muted-foreground" },
    QUEUED: { label: "Queued", class: "bg-yellow-500/10 text-yellow-400" },
    RESEARCHING: { label: "Running", class: "bg-blue-500/10 text-blue-400" },
    READY: { label: "Ready", class: "bg-green-500/10 text-green-400" },
    FAILED: { label: "Failed", class: "bg-destructive/10 text-destructive" },
    ARCHIVED: { label: "Archived", class: "bg-secondary text-muted-foreground" },
  };
  const { label, class: cls } = config[status] ?? { label: status, class: "bg-secondary text-muted-foreground" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
  );
}
