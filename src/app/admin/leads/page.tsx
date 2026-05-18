import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const statusColors: Record<string, string> = {
  DRAFT: "bg-zinc-700 text-zinc-300",
  QUEUED: "bg-blue-500/20 text-blue-300",
  RESEARCHING: "bg-amber-500/20 text-amber-300",
  READY: "bg-emerald-500/20 text-emerald-300",
  ARCHIVED: "bg-zinc-600 text-zinc-400",
  FAILED: "bg-red-500/20 text-red-300",
};

export default async function AdminLeadsPage() {
  await requireAdmin();

  const leadLists = await prisma.leadList.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, plan: true } },
    },
  });

  const totalLeads = leadLists.reduce((s, ll) => s + ll.totalLeads, 0);

  // Recent leads sample
  const recentLeads = await prisma.lead.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      leadList: { select: { name: true, organization: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {leadLists.length} lead lists · {totalLeads.toLocaleString()} total leads
        </p>
      </div>

      {/* Lead Lists Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Lead Lists</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Leads</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Qualified</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {leadLists.map((ll) => (
                <tr key={ll.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{ll.name}</p>
                    <p className="text-xs text-zinc-600">{ll.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{ll.organization.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ll.status] ?? "bg-zinc-700 text-zinc-300"}`}>
                      {ll.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{ll.totalLeads.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{ll.qualifiedLeads ?? 0} qualified</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(ll.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leadLists.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No lead lists yet</p>
          )}
        </div>
      </div>

      {/* Recent Leads Sample */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Recent Leads (latest 50)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">List</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                    </p>
                    {lead.title && <p className="text-xs text-zinc-500">{lead.title}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{lead.companyName ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{lead.email ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{lead.leadList.name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{lead.leadList.organization.name}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentLeads.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No leads yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
