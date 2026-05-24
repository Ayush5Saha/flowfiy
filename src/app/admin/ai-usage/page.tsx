import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Zap } from "lucide-react";

const PLAN_BUDGETS: Record<string, number> = {
  FREE:    500_000,
  INDIE:   2_000_000,
  STARTER: 6_000_000,
  GROWTH:  20_000_000,
  AGENCY:  -1,
};

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  INDIE:   "bg-teal-500/20 text-teal-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH:  "bg-violet-500/20 text-violet-300",
  AGENCY:  "bg-amber-500/20 text-amber-300",
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default async function AdminAiUsagePage() {
  await requireAdmin();

  const orgs = await prisma.organization.findMany({
    orderBy: { monthlyTokensUsed: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      apiMode: true,
      monthlyTokensUsed: true,
      tokenBudgetResetAt: true,
      generationCount: true,
    },
  });

  const totalTokens = orgs.reduce((sum, o) => sum + Number(o.monthlyTokensUsed), 0);
  const byokOrgs = orgs.filter((o) => o.apiMode === "BYOK").length;
  const centralOrgs = orgs.filter((o) => o.apiMode === "CENTRAL").length;
  const orgsAtLimit = orgs.filter((o) => {
    const budget = PLAN_BUDGETS[o.plan];
    if (budget === -1) return false;
    return Number(o.monthlyTokensUsed) >= budget;
  }).length;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">AI Usage</h1>
        <p className="text-zinc-400 text-sm mt-1">Token consumption and API mode across all organizations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Tokens</p>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-amber-400">{formatTokens(totalTokens)}</p>
          <p className="text-xs text-zinc-600 mt-1">used this month</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Central API</p>
          <p className="text-3xl font-bold font-mono text-blue-400">{centralOrgs}</p>
          <p className="text-xs text-zinc-600 mt-1">orgs using Flowfiy key</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">BYOK</p>
          <p className="text-3xl font-bold font-mono text-violet-400">{byokOrgs}</p>
          <p className="text-xs text-zinc-600 mt-1">orgs with own key</p>
        </div>

        <div className={`bg-zinc-900 border rounded-xl p-5 ${orgsAtLimit > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">At Budget Limit</p>
          <p className={`text-3xl font-bold font-mono ${orgsAtLimit > 0 ? "text-red-400" : "text-zinc-400"}`}>
            {orgsAtLimit}
          </p>
          <p className="text-xs text-zinc-600 mt-1">orgs blocked</p>
        </div>
      </div>

      {/* Token Usage Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Token Usage by Organization</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">API Mode</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Tokens Used</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Budget</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Reset At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orgs.map((org) => {
                const used = Number(org.monthlyTokensUsed);
                const budget = PLAN_BUDGETS[org.plan] ?? 500_000;
                const unlimited = budget === -1;
                const pct = unlimited ? 0 : Math.min(Math.round((used / budget) * 100), 100);
                const atLimit = !unlimited && used >= budget;

                return (
                  <tr key={org.id} className={`hover:bg-zinc-800/40 transition-colors ${atLimit ? "bg-red-500/3" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{org.name}</p>
                      <p className="text-xs text-zinc-600">{org.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[org.plan] ?? "bg-zinc-700 text-zinc-300"}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        org.apiMode === "BYOK"
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-blue-500/15 text-blue-300"
                      }`}>
                        {org.apiMode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-mono font-medium ${atLimit ? "text-red-400" : "text-white"}`}>
                        {formatTokens(used)}
                      </p>
                      {atLimit && (
                        <p className="text-xs text-red-400">Budget reached</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs text-zinc-400">
                          {unlimited ? "∞ Unlimited" : formatTokens(budget)}
                        </p>
                        {!unlimited && (
                          <div className="w-24 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-violet-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {org.tokenBudgetResetAt
                        ? new Date(org.tokenBudgetResetAt).toLocaleDateString()
                        : "Never reset"}
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
