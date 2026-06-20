import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Zap, Activity } from "lucide-react";

type AccentColor = "amber" | "blue" | "emerald" | "violet" | "red" | "rose" | "teal";

const accentMap: Record<AccentColor, { text: string; iconBg: string; bar: string; top: string }> = {
  amber:   { text: "text-amber-400",   iconBg: "bg-amber-500/10",   bar: "bg-amber-500",   top: "from-amber-500/50" },
  blue:    { text: "text-blue-400",    iconBg: "bg-blue-500/10",    bar: "bg-blue-500",    top: "from-blue-500/50" },
  emerald: { text: "text-emerald-400", iconBg: "bg-emerald-500/10", bar: "bg-emerald-500", top: "from-emerald-500/50" },
  violet:  { text: "text-violet-400",  iconBg: "bg-violet-500/10",  bar: "bg-violet-500",  top: "from-violet-500/50" },
  red:     { text: "text-red-400",     iconBg: "bg-red-500/10",     bar: "bg-red-500",     top: "from-red-500/50" },
  rose:    { text: "text-rose-400",    iconBg: "bg-rose-500/10",    bar: "bg-rose-500",    top: "from-rose-500/50" },
  teal:    { text: "text-teal-400",    iconBg: "bg-teal-500/10",    bar: "bg-teal-500",    top: "from-teal-500/50" },
};

function StatCard({
  label, value, sub, color = "amber", icon,
}: {
  label: string; value: string | number; sub?: string; color?: AccentColor; icon?: React.ReactNode;
}) {
  const a = accentMap[color];
  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${a.top} via-transparent to-transparent`} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${a.iconBg} flex items-center justify-center`}>
            <span className={a.text}>{icon}</span>
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold font-mono tracking-tight ${a.text}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1.5">{sub}</p>}
    </div>
  );
}

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700/60 text-zinc-300",
  FLOWFIY: "bg-emerald-500/15 text-emerald-300",
};

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [
    orgCount,
    campaignCount,
    leadListCount,
    leadCount,
    sentCount,
    replyCount,
    activeCampaignCount,
    paidOrgCount,
    failedListCount,
    stuckListCount,
    activeSubCount,
    { data: usersData },
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.campaign.count(),
    prisma.leadList.count(),
    prisma.lead.count(),
    prisma.campaignLead.count({ where: { status: { in: ["SENT", "OPENED", "REPLIED"] } } }),
    prisma.campaignLead.count({ where: { status: "REPLIED" } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { plan: { not: "FREE" } } }),
    prisma.leadList.count({ where: { status: "FAILED" } }),
    prisma.leadList.count({ where: { status: "RESEARCHING", updatedAt: { lt: twoHoursAgo } } }),
    prisma.organization.count({ where: { plan: { not: "FREE" }, subscriptionStatus: "active" } }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const userCount = usersData?.users?.length ?? 0;
  const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(1) : "0.0";

  const recentOrgs = await prisma.organization.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true, leadLists: true, members: true } } },
  });

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
          <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
            Internal
          </span>
        </div>
        <p className="text-zinc-400 text-sm">Platform-wide statistics and activity</p>
      </div>

      {/* System Alerts */}
      {(failedListCount > 0 || stuckListCount > 0) && (
        <div className="mb-6 space-y-2">
          {failedListCount > 0 && (
            <Link href="/admin/system" className="flex items-center gap-3 p-3.5 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                <span className="font-semibold">{failedListCount} lead list{failedListCount > 1 ? "s" : ""} failed</span>
                {" "}— view in System Health
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-red-400 ml-auto" />
            </Link>
          )}
          {stuckListCount > 0 && (
            <Link href="/admin/system" className="flex items-center gap-3 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-colors">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">
                <span className="font-semibold">{stuckListCount} job{stuckListCount > 1 ? "s" : ""} stuck</span>
                {" "}(running &gt;2h) — view in System Health
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 ml-auto" />
            </Link>
          )}
        </div>
      )}

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Users"     value={userCount}                  color="amber"   icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard label="Organizations"  value={orgCount}  sub={`${paidOrgCount} paid`}  color="blue"    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <StatCard label="Total Leads"    value={leadCount.toLocaleString()} color="emerald" icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="Emails Sent"    value={sentCount.toLocaleString()} color="violet"  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Replies"          value={replyCount.toLocaleString()} sub={`${replyRate}% reply rate`} color="emerald" />
        <StatCard label="Active Campaigns" value={activeCampaignCount}                                          color="amber" />
        <StatCard label="Active Subs"      value={activeSubCount}              sub={`${orgCount - paidOrgCount} on free`}         color="violet" />
        <StatCard label="Failed Jobs"      value={failedListCount}             sub={stuckListCount > 0 ? `${stuckListCount} stuck` : "No stuck jobs"} color={failedListCount > 0 ? "red" : "emerald"} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/admin/system" className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">System Health</p>
            <p className="text-xs text-zinc-500">Failed jobs, stuck leads, queue status</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
        </Link>
        <Link href="/admin/ai-usage" className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">AI Usage</p>
            <p className="text-xs text-zinc-500">Gemini usage, credit COGS &amp; margins</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
        </Link>
      </div>

      {/* Recent Organizations */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recently Created Organizations</h2>
          <Link href="/admin/organizations" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-12 px-5 py-2 border-b border-zinc-800/50 bg-zinc-950/40">
              <span className="col-span-4 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Organization</span>
              <span className="col-span-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Plan</span>
              <span className="col-span-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider text-right">Members</span>
              <span className="col-span-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider text-right">Campaigns</span>
              <span className="col-span-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider text-right">Created</span>
            </div>

            <div>
              {recentOrgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="grid grid-cols-12 px-5 py-3.5 border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/30 transition-colors items-center group"
                >
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors truncate">{org.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 truncate">{org.slug}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[org.plan] ?? "bg-zinc-700/60 text-zinc-300"}`}>
                      {org.plan}
                    </span>
                  </div>
                  <p className="col-span-2 text-sm text-zinc-400 text-right font-mono">{org._count.members}</p>
                  <p className="col-span-2 text-sm text-zinc-400 text-right font-mono">{org._count.campaigns}</p>
                  <p className="col-span-2 text-xs text-zinc-600 text-right">
                    {new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </Link>
              ))}
              {recentOrgs.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-zinc-600">No organizations yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
