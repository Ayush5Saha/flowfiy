import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, Megaphone, Settings, BookOpen, Coins, Sparkles } from "lucide-react";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { getWallet } from "@/lib/credits/service";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = "force-dynamic";

const CHART_DAYS = 14;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const chartStart = new Date(todayStart);
  chartStart.setDate(todayStart.getDate() - (CHART_DAYS - 1));

  const [
    totalLeads, qualifiedLeads, totalSent, totalReplied, activeCampaigns,
    recentLists, integrations, businessProfile, sentToday, sends, wallet,
  ] = await Promise.all([
    prisma.lead.count({ where: { organizationId: organization.id } }),
    prisma.lead.count({ where: { organizationId: organization.id, status: "QUALIFIED" } }),
    prisma.campaignLead.count({ where: { campaign: { organizationId: organization.id }, status: { in: ["SENT", "REPLIED"] } } }),
    prisma.campaignLead.count({ where: { campaign: { organizationId: organization.id }, status: "REPLIED" } }),
    prisma.campaign.count({ where: { organizationId: organization.id, status: "ACTIVE" } }),
    prisma.leadList.findMany({
      where: { organizationId: organization.id, status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, name: true, status: true, totalLeads: true, qualifiedLeads: true, createdAt: true },
    }),
    prisma.integration.findMany({ where: { organizationId: organization.id, status: "CONNECTED" }, select: { type: true } }),
    prisma.businessProfile.findUnique({ where: { organizationId: organization.id } }),
    prisma.campaignLead.count({ where: { campaign: { organizationId: organization.id }, sentAt: { gte: todayStart } } }),
    prisma.campaignLead.findMany({
      where: { campaign: { organizationId: organization.id }, sentAt: { gte: chartStart } },
      select: { sentAt: true }, take: 5000,
    }),
    getWallet(organization.id).catch(() => ({ balance: 0, held: 0 })),
  ]);

  const connectedTypes = new Set(integrations.map((i) => i.type));
  const gmailConnected = connectedTypes.has("GMAIL");

  // ── 14-day outreach series (real data, bucketed by send day) ────────────────
  const buckets = Array.from({ length: CHART_DAYS }, (_, i) => {
    const d = new Date(chartStart);
    d.setDate(chartStart.getDate() + i);
    return { date: d, count: 0 };
  });
  for (const s of sends) {
    if (!s.sentAt) continue;
    const idx = Math.floor((new Date(s.sentAt).setHours(0, 0, 0, 0) - chartStart.getTime()) / 86_400_000);
    if (idx >= 0 && idx < CHART_DAYS) buckets[idx].count++;
  }
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const chartTotal = buckets.reduce((a, b) => a + b.count, 0);

  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;
  const qualRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  const checklistSteps = [
    { id: "workspace", label: "Create your workspace", description: "Name your organization and set it up", href: "/settings", done: true },
    { id: "business-profile", label: "Set your business profile & ICP", description: "Tell Flowfiy who your ideal customer is, so it can find and qualify the right leads", href: "/settings", done: !!businessProfile },
    { id: "gmail", label: "Connect Gmail to send outreach", description: "Emails go out from your own inbox — no shared IPs, full deliverability", href: "/integrations", done: gmailConnected },
    { id: "first-leads", label: "Generate your first lead list", description: "Describe the leads you want — Flowfiy discovers, researches, qualifies and writes the outreach", href: "/leads", done: totalLeads > 0 },
    { id: "first-campaign", label: "Send your first campaign", description: "Review the qualified leads and personalized copy, then send", href: "/campaigns", done: totalSent > 0 },
  ];
  const onboardingDone = checklistSteps.every((s) => s.done);

  const displayName =
    ((user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "there").split(" ")[0];

  const stats = [
    { label: "Total leads", value: totalLeads.toLocaleString(), sub: `${qualifiedLeads.toLocaleString()} qualified` },
    { label: "Qualified", value: qualifiedLeads.toLocaleString(), sub: totalLeads > 0 ? `${qualRate}% of total` : "No leads yet" },
    { label: "Emails sent", value: totalSent.toLocaleString(), sub: `${sentToday.toLocaleString()} today` },
    { label: "Reply rate", value: `${replyRate}%`, sub: `${totalReplied.toLocaleString()} replies` },
  ];

  const quickActions = [
    { href: "/leads", label: "Describe new leads", icon: Sparkles },
    { href: "/campaigns/new", label: "New campaign", icon: Megaphone, badge: activeCampaigns > 0 ? `${activeCampaigns} active` : undefined },
    { href: "/settings", label: "Edit ICP & profile", icon: Settings },
    { href: "/blog/how-to-set-up-flowfiy", label: "Setup guide", icon: BookOpen },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s how your outbound is doing.</p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Describe new leads
        </Link>
      </div>

      {/* ── Onboarding (only until complete) ───────────── */}
      {!onboardingDone && (
        <div className="mb-10">
          <OnboardingChecklist steps={checklistSteps} organizationId={organization.id} guideHref="/blog/how-to-set-up-flowfiy" />
        </div>
      )}

      {/* ── Stat strip (ruled, not boxed) ──────────────── */}
      <section className="border-y border-border py-8 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8">
          {stats.map((s, i) => (
            <div key={s.label} className={i === 0 ? "lg:pr-8" : "lg:px-8 lg:border-l lg:border-border"}>
              <p className="text-[13px] text-muted-foreground">{s.label}</p>
              <p className="mt-2.5 text-[34px] leading-none font-semibold tracking-tight tabular-nums">{s.value}</p>
              <p className="mt-2.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gmail nudge (subtle, only if not connected) ── */}
      {!gmailConnected && (
        <Link
          href="/integrations"
          className="flex items-center gap-3 mb-10 rounded-lg bg-secondary/40 px-4 py-3 hover:bg-secondary/70 transition-colors group"
        >
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="text-sm font-medium">Connect Gmail to start sending</p>
            <p className="text-xs text-muted-foreground mt-0.5">Outreach sends from your own inbox after you review it.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* ── Main ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left */}
        <div className="lg:col-span-2 space-y-10">

          {/* Outreach */}
          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold">Outreach</h2>
                <p className="text-xs text-muted-foreground mt-1">Emails sent · last {CHART_DAYS} days</p>
              </div>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">{chartTotal.toLocaleString()}</span>
            </div>

            {chartTotal === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center border-t border-border">
                <p className="text-sm text-muted-foreground">No emails sent in the last {CHART_DAYS} days</p>
                <Link href="/campaigns" className="text-xs text-primary hover:underline mt-1">Launch a campaign →</Link>
              </div>
            ) : (
              <div>
                <div className="flex items-end gap-1.5 h-44 border-b border-border">
                  {buckets.map((bar, i) => {
                    const pct = Math.round((bar.count / maxCount) * 100);
                    const isToday = i === CHART_DAYS - 1;
                    return (
                      <div key={i} className="flex-1 h-full flex items-end group" title={`${bar.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${bar.count} sent`}>
                        <div
                          className={`w-full rounded-t-[2px] transition-colors ${isToday ? "bg-primary" : "bg-primary/25 group-hover:bg-primary/45"}`}
                          style={{ height: `${Math.max(pct, bar.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {buckets.map((bar, i) => (
                    <span key={i} className="flex-1 text-center text-[10px] text-muted-foreground/60 tabular-nums">{bar.date.getDate()}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Recent lead lists */}
          <section className="border-t border-border pt-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold">Recent lead lists</h2>
              <Link href="/leads" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentLists.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium">No lead lists yet</p>
                <p className="text-xs text-muted-foreground mt-1">Describe the leads you want and Flowfiy builds your first list.</p>
                <Link href="/leads" className="text-primary text-sm hover:underline mt-3 inline-block">Generate your first leads →</Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLists.map((list) => (
                  <Link key={list.id} href={`/leads/${list.id}`} className="flex items-center justify-between py-4 group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{list.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">{list.totalLeads} leads · {list.qualifiedLeads} qualified</p>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <StatusBadge status={list.status} />
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-8 lg:border-l lg:border-border lg:pl-10">

          {/* Credits */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Credits</h2>
              <Coins className="w-4 h-4 text-muted-foreground/60" strokeWidth={1.75} />
            </div>
            <p className="text-[34px] leading-none font-semibold tracking-tight tabular-nums">{wallet.balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-2.5">
              available{wallet.held > 0 ? ` · ${wallet.held.toLocaleString()} reserved` : ""}
            </p>
            <Link href="/billing" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3">
              Buy credits <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>

          {/* Quick actions */}
          <section className="border-t border-border pt-6">
            <h2 className="text-sm font-semibold mb-1">Quick actions</h2>
            <div className="divide-y divide-border">
              {quickActions.map(({ href, label, icon: Icon, badge }) => (
                <Link key={href} href={href} className="flex items-center gap-3 py-3 group">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                  <span className="text-sm flex-1">{label}</span>
                  {badge && <span className="text-[11px] text-muted-foreground tabular-nums">{badge}</span>}
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </section>

          {/* Managed AI note */}
          <section className="border-t border-border pt-6">
            <h2 className="text-sm font-semibold mb-1.5">Fully managed AI</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Discovery, research, scoring and copywriting run on managed AI — no API keys. You only spend credits on qualified leads.
            </p>
          </section>

        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; dot: string }> = {
    DRAFT: { label: "Draft", dot: "bg-muted-foreground/50" },
    QUEUED: { label: "Queued", dot: "bg-muted-foreground/50" },
    RESEARCHING: { label: "Running", dot: "bg-primary" },
    READY: { label: "Ready", dot: "bg-emerald-400" },
    FAILED: { label: "Failed", dot: "bg-destructive" },
    ARCHIVED: { label: "Archived", dot: "bg-muted-foreground/50" },
  };
  const { label, dot } = config[status] ?? { label: status, dot: "bg-muted-foreground/50" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
