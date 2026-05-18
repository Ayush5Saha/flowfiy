import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditLogsPage() {
  await requireAdmin();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  const actionGroups = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] ?? 0) + 1;
    return acc;
  }, {});

  const topActions = Object.entries(actionGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Latest {logs.length} events across all organizations
        </p>
      </div>

      {/* Top Actions */}
      {topActions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {topActions.map(([action, count]) => (
            <div key={action} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1 truncate">{action}</p>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Resource</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Metadata</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-white">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{log.organization.name}</td>
                  <td className="px-4 py-3">
                    {log.resourceType ? (
                      <div>
                        <p className="text-xs text-zinc-400">{log.resourceType}</p>
                        {log.resourceId && (
                          <p className="text-xs text-zinc-600 font-mono">{log.resourceId.slice(0, 8)}…</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs font-mono">
                    {log.userId ? log.userId.slice(0, 8) + "…" : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
                      ? (log.metadata as Record<string, unknown>).ip as string ?? "—"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No audit logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
