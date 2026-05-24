import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

export default async function AdminSystemPage() {
  await requireAdmin();

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const [
    failedLists,
    stuckLists,
    stuckLeadsCount,
    queuedLists,
    researchingLists,
    totalLeadLists,
    recentFailures,
  ] = await Promise.all([
    prisma.leadList.count({ where: { status: "FAILED" } }),
    prisma.leadList.count({
      where: { status: "RESEARCHING", updatedAt: { lt: twoHoursAgo } },
    }),
    prisma.lead.count({
      where: { status: "RESEARCHING", updatedAt: { lt: twoHoursAgo } },
    }),
    prisma.leadList.count({ where: { status: "QUEUED" } }),
    prisma.leadList.count({ where: { status: "RESEARCHING" } }),
    prisma.leadList.count(),
    prisma.leadList.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { organization: { select: { name: true } } },
    }),
  ]);

  const healthScore =
    failedLists === 0 && stuckLists === 0 && stuckLeadsCount === 0
      ? "healthy"
      : failedLists + stuckLists > 5
      ? "critical"
      : "warning";

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-zinc-400 text-sm mt-1">Pipeline status and stuck job recovery</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          healthScore === "healthy"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : healthScore === "warning"
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {healthScore === "healthy"
            ? <><CheckCircle className="w-4 h-4" /> All Systems Operational</>
            : healthScore === "warning"
            ? <><AlertTriangle className="w-4 h-4" /> Issues Detected</>
            : <><XCircle className="w-4 h-4" /> Critical Issues</>
          }
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className={`bg-zinc-900 border rounded-xl p-5 ${failedLists > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Failed Jobs</p>
            <XCircle className={`w-4 h-4 ${failedLists > 0 ? "text-red-400" : "text-zinc-600"}`} />
          </div>
          <p className={`text-3xl font-bold font-mono ${failedLists > 0 ? "text-red-400" : "text-zinc-400"}`}>
            {failedLists}
          </p>
          <p className="text-xs text-zinc-600 mt-1">lead lists failed</p>
        </div>

        <div className={`bg-zinc-900 border rounded-xl p-5 ${stuckLists > 0 ? "border-amber-500/30" : "border-zinc-800"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Stuck Jobs</p>
            <Clock className={`w-4 h-4 ${stuckLists > 0 ? "text-amber-400" : "text-zinc-600"}`} />
          </div>
          <p className={`text-3xl font-bold font-mono ${stuckLists > 0 ? "text-amber-400" : "text-zinc-400"}`}>
            {stuckLists}
          </p>
          <p className="text-xs text-zinc-600 mt-1">stuck &gt;2 hours</p>
        </div>

        <div className={`bg-zinc-900 border rounded-xl p-5 ${stuckLeadsCount > 0 ? "border-amber-500/30" : "border-zinc-800"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Stuck Leads</p>
            <AlertTriangle className={`w-4 h-4 ${stuckLeadsCount > 0 ? "text-amber-400" : "text-zinc-600"}`} />
          </div>
          <p className={`text-3xl font-bold font-mono ${stuckLeadsCount > 0 ? "text-amber-400" : "text-zinc-400"}`}>
            {stuckLeadsCount}
          </p>
          <p className="text-xs text-zinc-600 mt-1">in RESEARCHING state</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Active</p>
            <RefreshCw className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-blue-400">
            {queuedLists + researchingLists}
          </p>
          <p className="text-xs text-zinc-600 mt-1">{queuedLists} queued · {researchingLists} running</p>
        </div>
      </div>

      {/* Queue Overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Pipeline Overview</h2>
        <div className="space-y-3">
          {[
            { label: "Queued", count: queuedLists, color: "bg-blue-500", total: totalLeadLists },
            { label: "Running", count: researchingLists, color: "bg-amber-500", total: totalLeadLists },
            { label: "Failed", count: failedLists, color: "bg-red-500", total: totalLeadLists },
            { label: "Stuck", count: stuckLists, color: "bg-orange-500", total: totalLeadLists },
          ].map(({ label, count, color, total }) => (
            <div key={label} className="flex items-center gap-3">
              <p className="w-20 text-xs text-zinc-400">{label}</p>
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: total > 0 ? `${Math.min((count / total) * 100, 100)}%` : "0%" }}
                />
              </div>
              <p className="w-8 text-xs text-zinc-400 text-right font-mono">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Lead Lists */}
      {recentFailures.length > 0 && (
        <div className="bg-zinc-900 border border-red-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Failed Lead Lists</h2>
            </div>
            <span className="text-xs text-red-400 font-mono">{recentFailures.length} failures</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">List Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organization</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Error</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Failed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {recentFailures.map((ll) => (
                  <tr key={ll.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{ll.name}</p>
                      <p className="text-xs text-zinc-600 font-mono">{ll.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-sm">{ll.organization.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-red-400 max-w-xs truncate">{ll.jobError ?? "Unknown error"}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(ll.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {healthScore === "healthy" && (
        <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-300">All systems healthy</p>
            <p className="text-xs text-zinc-500 mt-0.5">No failed jobs, no stuck leads, no issues detected.</p>
          </div>
        </div>
      )}
    </div>
  );
}
