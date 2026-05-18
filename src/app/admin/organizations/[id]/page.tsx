import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminDeleteOrg from "@/components/admin/AdminDeleteOrg";
import AdminOrgLimitEditor from "@/components/admin/AdminOrgLimitEditor";

const planColors: Record<string, string> = {
  FREE: "bg-zinc-700 text-zinc-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH: "bg-violet-500/20 text-violet-300",
  AGENCY: "bg-amber-500/20 text-amber-300",
};

const statusColors: Record<string, string> = {
  DRAFT: "text-zinc-400",
  ACTIVE: "text-emerald-400",
  PAUSED: "text-amber-400",
  COMPLETED: "text-blue-400",
};

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: true,
      businessProfile: true,
      integrations: true,
      campaigns: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { campaignLeads: true } } },
      },
      leadLists: {
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: {
        select: { members: true, campaigns: true, leadLists: true },
      },
    },
  });

  if (!org) notFound();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/organizations" className="text-zinc-500 hover:text-zinc-300 text-sm">
              Organizations
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-white text-sm">{org.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{org.name}</h1>
          <p className="text-zinc-500 text-sm">{org.slug} · Created {new Date(org.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${planColors[org.plan]}`}>
            {org.plan}
          </span>
          <AdminDeleteOrg orgId={org.id} orgName={org.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Subscription & Usage */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Subscription & Usage</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Plan</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[org.plan]}`}>{org.plan}</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Subscription Status</p>
                <p className="text-sm text-white">{org.subscriptionStatus ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-zinc-500 mb-2">Generation Usage</p>
                <AdminOrgLimitEditor
                  orgId={org.id}
                  generationCount={org.generationCount}
                  generationLimit={org.generationLimit}
                />
              </div>
            </div>
          </div>

          {/* Business Profile */}
          {org.businessProfile && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Business Profile</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">Company</p>
                  <p className="text-white">{org.businessProfile.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Website</p>
                  <p className="text-white">{org.businessProfile.website ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500">Service</p>
                  <p className="text-white">{org.businessProfile.serviceOffered}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Tone</p>
                  <p className="text-white capitalize">{org.businessProfile.outreachTone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Industries</p>
                  <p className="text-white">{org.businessProfile.targetIndustries.join(", ") || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Campaigns */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Campaigns ({org.campaigns.length})</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {org.campaigns.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{c.name}</p>
                    <p className="text-xs text-zinc-500">{c._count.campaignLeads} leads · {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span>
                </div>
              ))}
              {org.campaigns.length === 0 && (
                <p className="px-5 py-6 text-xs text-zinc-600">No campaigns</p>
              )}
            </div>
          </div>

          {/* Lead Lists */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Lead Lists ({org.leadLists.length})</h2>
            </div>
            <div className="divide-y divide-zinc-800">
              {org.leadLists.map((ll) => (
                <div key={ll.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{ll.name}</p>
                    <p className="text-xs text-zinc-500">{ll.totalLeads} leads · {new Date(ll.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs text-zinc-400">{ll.status}</span>
                </div>
              ))}
              {org.leadLists.length === 0 && (
                <p className="px-5 py-6 text-xs text-zinc-600">No lead lists</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-5">
          {/* Integrations */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Integrations</h2>
            <div className="space-y-2">
              {org.integrations.map((i) => (
                <div key={i.id} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{i.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    i.status === "CONNECTED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}>
                    {i.status}
                  </span>
                </div>
              ))}
              {org.integrations.length === 0 && (
                <p className="text-xs text-zinc-600">No integrations</p>
              )}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Recent Audit Logs</h2>
            </div>
            <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
              {org.auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-2.5">
                  <p className="text-xs font-medium text-white">{log.action}</p>
                  {log.resourceType && (
                    <p className="text-xs text-zinc-500">{log.resourceType} {log.resourceId?.slice(0, 8)}</p>
                  )}
                  <p className="text-xs text-zinc-600">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {org.auditLogs.length === 0 && (
                <p className="px-4 py-6 text-xs text-zinc-600">No audit logs</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
