import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Coins, AlertTriangle } from "lucide-react";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  FLOWFIY: "bg-emerald-500/20 text-emerald-300",
};

const subColors: Record<string, string> = {
  active:         "bg-emerald-500/15 text-emerald-300",
  pending:        "bg-amber-500/15 text-amber-300",
  payment_failed: "bg-red-500/15 text-red-300",
  halted:         "bg-red-500/15 text-red-300",
  cancelled:      "bg-zinc-700 text-zinc-400",
};

export default async function AdminAiUsagePage() {
  await requireAdmin();

  const cycleStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, plan: true, subscriptionStatus: true },
  });

  // Credit data lives in tables added by Phase 1 — guard so this page renders
  // even before `prisma db push` has created them.
  let creditsReady = true;
  const balanceById = new Map<string, number>();
  const heldById = new Map<string, number>();
  const consumedById = new Map<string, number>();
  try {
    const wallets = await prisma.creditWallet.findMany({ select: { organizationId: true, balance: true, held: true } });
    for (const w of wallets) { balanceById.set(w.organizationId, w.balance); heldById.set(w.organizationId, w.held); }
    const consumed = await prisma.creditLedger.groupBy({
      by: ["organizationId"],
      where: { type: "CONSUME", createdAt: { gte: cycleStart } },
      _sum: { amount: true },
    });
    for (const c of consumed) consumedById.set(c.organizationId, Math.abs(c._sum.amount ?? 0));
  } catch {
    creditsReady = false;
  }

  const totalConsumed = [...consumedById.values()].reduce((a, b) => a + b, 0);
  const totalOutstanding = [...balanceById.values()].reduce((a, b) => a + b, 0);
  const activeSubs = orgs.filter((o) => o.plan !== "FREE" && o.subscriptionStatus === "active").length;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Credits &amp; AI Usage</h1>
        <p className="text-zinc-400 text-sm mt-1">Credit consumption and subscriptions across all organizations</p>
      </div>

      {!creditsReady && (
        <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Credit tables aren&apos;t in the database yet — run <code className="font-mono">npm run db:push</code> to enable credit metering. Subscription data below is live.</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Credits Used</p>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-amber-400">{totalConsumed.toLocaleString()}</p>
          <p className="text-xs text-zinc-600 mt-1">this billing cycle</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Credits Outstanding</p>
          <p className="text-3xl font-bold font-mono text-violet-400">{totalOutstanding.toLocaleString()}</p>
          <p className="text-xs text-zinc-600 mt-1">unspent across wallets</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Active Subs</p>
          <p className="text-3xl font-bold font-mono text-emerald-400">{activeSubs}</p>
          <p className="text-xs text-zinc-600 mt-1">paying organizations</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Organizations</p>
          <p className="text-3xl font-bold font-mono text-blue-400">{orgs.length}</p>
          <p className="text-xs text-zinc-600 mt-1">total</p>
        </div>
      </div>

      {/* Per-org table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Credits by Organization</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Subscription</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Used (cycle)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Balance</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Held</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orgs.map((org) => {
                const status = org.subscriptionStatus ?? "—";
                return (
                  <tr key={org.id} className="hover:bg-zinc-800/40 transition-colors">
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${subColors[status] ?? "bg-zinc-800 text-zinc-500"}`}>
                        {status === "—" ? "none" : status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {creditsReady ? (consumedById.get(org.id) ?? 0).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">
                      {creditsReady ? (balanceById.get(org.id) ?? 0).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-400/80">
                      {creditsReady ? (heldById.get(org.id) ?? 0).toLocaleString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orgs.length === 0 && <p className="text-center py-12 text-zinc-500">No organizations yet</p>}
        </div>
      </div>
    </div>
  );
}
