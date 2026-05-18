import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";

function StatCard({
  label,
  value,
  sub,
  color = "violet",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "violet" | "blue" | "green" | "amber" | "red";
}) {
  const colors = {
    violet: "text-violet-400",
    blue: "text-blue-400",
    green: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();

  const supabase = createServiceClient();

  const [
    orgCount,
    campaignCount,
    leadListCount,
    leadCount,
    sentCount,
    replyCount,
    activeCampaignCount,
    paidOrgCount,
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
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const userCount = usersData?.users?.length ?? 0;
  const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(1) : "0.0";

  // Recent orgs
  const recentOrgs = await prisma.organization.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true, leadLists: true, members: true } } },
  });

  const planColors: Record<string, string> = {
    FREE: "bg-zinc-700 text-zinc-300",
    STARTER: "bg-blue-500/20 text-blue-300",
    GROWTH: "bg-violet-500/20 text-violet-300",
    AGENCY: "bg-amber-500/20 text-amber-300",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-zinc-400 text-sm mt-1">Complete platform statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={userCount} color="violet" />
        <StatCard label="Organizations" value={orgCount} sub={`${paidOrgCount} paid`} color="blue" />
        <StatCard label="Total Leads" value={leadCount.toLocaleString()} color="green" />
        <StatCard label="Emails Sent" value={sentCount.toLocaleString()} color="amber" />
        <StatCard label="Replies" value={replyCount.toLocaleString()} sub={`${replyRate}% reply rate`} color="green" />
        <StatCard label="Active Campaigns" value={activeCampaignCount} color="violet" />
        <StatCard label="Lead Lists" value={leadListCount} color="blue" />
        <StatCard label="Campaigns Total" value={campaignCount} color="amber" />
      </div>

      {/* Recent Organizations */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Recently Created Organizations</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {recentOrgs.map((org) => (
            <div key={org.id} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{org.name}</p>
                <p className="text-xs text-zinc-500">{org.slug} · {new Date(org.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs text-zinc-400">
                  <p>{org._count.members} members</p>
                  <p>{org._count.campaigns} campaigns</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[org.plan]}`}>
                  {org.plan}
                </span>
              </div>
            </div>
          ))}
          {recentOrgs.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">No organizations yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
