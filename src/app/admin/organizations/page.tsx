import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminOrgPlanEditor from "@/components/admin/AdminOrgPlanEditor";

const planColors: Record<string, string> = {
  FREE: "bg-zinc-700 text-zinc-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH: "bg-violet-500/20 text-violet-300",
  AGENCY: "bg-amber-500/20 text-amber-300",
};

export default async function AdminOrgsPage() {
  await requireAdmin();

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { members: true, campaigns: true, leadLists: true },
      },
      businessProfile: { select: { companyName: true } },
      integrations: { select: { type: true, status: true } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Organizations</h1>
        <p className="text-zinc-400 text-sm mt-1">{orgs.length} total organizations</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Members</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Integrations</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orgs.map((org) => {
                const usagePct = org.generationLimit === -1
                  ? 0
                  : Math.round((org.generationCount / org.generationLimit) * 100);
                const connectedIntegrations = org.integrations
                  .filter((i) => i.status === "CONNECTED")
                  .map((i) => i.type);

                return (
                  <tr key={org.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{org.name}</p>
                        <p className="text-xs text-zinc-500">{org.slug}</p>
                        {org.businessProfile && (
                          <p className="text-xs text-zinc-600">{org.businessProfile.companyName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AdminOrgPlanEditor orgId={org.id} currentPlan={org.plan} />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs text-white">
                          {org.generationCount} / {org.generationLimit === -1 ? "∞" : org.generationLimit}
                        </p>
                        {org.generationLimit !== -1 && (
                          <div className="w-24 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${usagePct > 80 ? "bg-red-500" : "bg-violet-500"}`}
                              style={{ width: `${Math.min(usagePct, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{org._count.members}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {connectedIntegrations.length === 0 ? (
                          <span className="text-zinc-600 text-xs">None</span>
                        ) : (
                          connectedIntegrations.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orgs.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No organizations yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
