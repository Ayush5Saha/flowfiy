import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Mail, TrendingUp, Plus, ArrowRight, MessageSquare, Megaphone, Zap } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { SystemHealthCheck } from "@/components/dashboard/SystemHealthCheck";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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

  // ── System health data ───────────────────────────────────────────────────────
  const healthIntegrations = [
    {
      type: "APOLLO",
      label: "Apollo.io",
      icon: "🚀",
      description: "Lead discovery — required to run the generation pipeline",
      tier: "required" as const,
      connected: connectedTypes.has("APOLLO"),
    },
    {
      type: "GMAIL",
      label: "Gmail",
      icon: "📧",
      description: "Email sending — required to launch outreach campaigns",
      tier: "required" as const,
      connected: connectedTypes.has("GMAIL"),
    },
    {
      type: "APIFY",
      label: "Apify",
      icon: "🕷️",
      description: "Lead discovery + web scraping — primary lead source if Apollo not connected",
      tier: "required" as const,
      connected: connectedTypes.has("APIFY"),
    },
    {
      type: "CALENDLY",
      label: "Calendly",
      icon: "📅",
      description: "Meeting booking — auto-inserts your scheduling link into emails",
      tier: "optional" as const,
      connected: connectedTypes.has("CALENDLY"),
    },
  ];

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
      id: "apollo-key",
      label: "Connect a lead source (Apollo or Apify)",
      description: "Apollo finds 275M+ verified contacts — or use Apify as a free alternative with validated emails",
      href: "/integrations",
      done: connectedTypes.has("APOLLO") || connectedTypes.has("APIFY"),
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

  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  const stats = [
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Users,
      accentFrom: "from-blue-500/40",
      accentTo: "to-blue-500/0",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Qualified",
      value: qualifiedLeads,
      icon: TrendingUp,
      accentFrom: "from-emerald-500/40",
      accentTo: "to-emerald-500/0",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Emails Sent",
      value: totalSent,
      icon: Mail,
      accentFrom: "from-violet-500/40",
      accentTo: "to-violet-500/0",
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "Reply Rate",
      value: `${replyRate}%`,
      icon: MessageSquare,
      accentFrom: "from-amber-500/40",
      accentTo: "to-amber-500/0",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back — here&apos;s your outbound overview
          </p>
        </div>
        <Link
          href="/leads"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-px"
        >
          <Plus className="w-4 h-4" />
          Generate Leads
        </Link>
      </div>

      {/* ── System health check ──────────────────────── */}
      <SystemHealthCheck integrations={healthIntegrations} />

      {/* ── Onboarding checklist ─────────────────────── */}
      <OnboardingChecklist steps={checklistSteps} organizationId={organization.id} />

      {/* ── Stats grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, accentFrom, accentTo, iconColor, iconBg }) => (
          <div key={label} className="relative bg-card border border-border rounded-xl p-5 overflow-hidden group hover:border-border/80 transition-colors">
            {/* Gradient top accent */}
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentFrom} via-transparent ${accentTo}`} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Today's activity strip ───────────────────── */}
      {(sentToday > 0 || repliedToday > 0) && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground font-mono">{sentToday}</strong> emails sent today
            {repliedToday > 0 && (
              <> · <strong className="text-emerald-400 font-mono">{repliedToday}</strong> new repl{repliedToday === 1 ? "y" : "ies"} today</>
            )}
          </p>
          <Link href="/campaigns" className="ml-auto text-xs text-primary hover:underline shrink-0">
            View campaigns →
          </Link>
        </div>
      )}

      {/* ── Main content grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent lead lists */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Recent Lead Lists</h2>
            <Link href="/leads" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentLists.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No lead lists yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Generate your first leads to get started</p>
              <Link href="/leads" className="text-primary text-sm hover:underline mt-3 inline-block font-medium">
                Generate your first leads →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentLists.map((list) => (
                <Link
                  key={list.id}
                  href={`/leads/${list.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/40 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{list.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {list.totalLeads} leads · {list.qualifiedLeads} qualified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={list.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-1.5">
              <Link href="/leads" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm flex-1 font-medium">Generate Leads</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/campaigns/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">New Campaign</span>
                  {activeCampaigns > 0 && (
                    <span className="ml-2 text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                      {activeCampaigns} active
                    </span>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/60 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm flex-1 font-medium">Edit ICP / Profile</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* AI Engine status */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-sm">AI Engine</h2>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Claude Sonnet is fully managed by Flowfiy. No API key required — AI is included in your plan.
            </p>
            {organization.plan === "FREE" && (
              <Link
                href="/billing"
                className="mt-3 block w-full text-center py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
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
    DRAFT:       { label: "Draft",     class: "bg-secondary text-muted-foreground" },
    QUEUED:      { label: "Queued",    class: "bg-amber-500/10 text-amber-400" },
    RESEARCHING: { label: "Running",   class: "bg-blue-500/10 text-blue-400" },
    READY:       { label: "Ready",     class: "bg-emerald-500/10 text-emerald-400" },
    FAILED:      { label: "Failed",    class: "bg-destructive/10 text-destructive" },
    ARCHIVED:    { label: "Archived",  class: "bg-secondary text-muted-foreground" },
  };
  const { label, class: cls } = config[status] ?? { label: status, class: "bg-secondary text-muted-foreground" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
  );
}
