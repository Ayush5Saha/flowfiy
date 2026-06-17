import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/razorpay";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  FLOWFIY: "bg-emerald-500/20 text-emerald-300",
  INDIE:   "bg-teal-500/20 text-teal-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH:  "bg-violet-500/20 text-violet-300",
  AGENCY:  "bg-amber-500/20 text-amber-300",
};

// Current model leads with FREE + FLOWFIY; legacy tiers shown only if still in use.
const planOrder = ["FREE", "FLOWFIY", "INDIE", "STARTER", "GROWTH", "AGENCY"];

export default async function AdminBillingPage() {
  await requireAdmin();

  const cycleStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      billingGateway: true,
      razorpayCustomerId: true,
      stripeCustomerId: true,
      createdAt: true,
    },
  });

  // Credit data — guarded so the page renders before `prisma db push`.
  let creditsReady = true;
  const balanceById = new Map<string, number>();
  const consumedById = new Map<string, number>();
  try {
    const wallets = await prisma.creditWallet.findMany({ select: { organizationId: true, balance: true } });
    for (const w of wallets) balanceById.set(w.organizationId, w.balance);
    const consumed = await prisma.creditLedger.groupBy({
      by: ["organizationId"],
      where: { type: "CONSUME", createdAt: { gte: cycleStart } },
      _sum: { amount: true },
    });
    for (const c of consumed) consumedById.set(c.organizationId, Math.abs(c._sum.amount ?? 0));
  } catch {
    creditsReady = false;
  }

  const planBreakdown = planOrder
    .map((plan) => ({ plan, count: orgs.filter((o) => o.plan === plan).length }))
    .filter((p) => p.count > 0 || p.plan === "FREE" || p.plan === "FLOWFIY");

  const paidOrgs = orgs.filter((o) => o.plan !== "FREE");
  const activeSubscriptions = orgs.filter((o) => o.plan !== "FREE" && o.subscriptionStatus === "active").length;
  const razorpayOrgs = orgs.filter((o) => o.razorpayCustomerId).length;
  const stripeOrgs = orgs.filter((o) => o.stripeCustomerId).length;

  // MRR from active paid subs, priced from the plan catalog (INR).
  const mrrInr = orgs
    .filter((o) => o.plan !== "FREE" && o.subscriptionStatus === "active")
    .reduce((sum, o) => sum + (PLANS[o.plan as keyof typeof PLANS]?.priceInr ?? 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {paidOrgs.length} paid orgs · {activeSubscriptions} active subs · {razorpayOrgs} Razorpay · {stripeOrgs} Stripe
        </p>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {planBreakdown.map(({ plan, count }) => (
          <div key={plan} className={`bg-zinc-900 border rounded-xl p-4 ${count > 0 ? "border-zinc-700" : "border-zinc-800/50"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[plan] ?? "bg-zinc-700 text-zinc-300"}`}>
                {plan}
              </span>
            </div>
            <p className={`text-3xl font-bold font-mono ${count > 0 ? "text-white" : "text-zinc-600"}`}>{count}</p>
            <p className="text-xs text-zinc-500 mt-0.5">organizations</p>
          </div>
        ))}
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">MRR (est.)</p>
          <p className="text-2xl font-bold font-mono text-violet-400">₹{mrrInr.toLocaleString()}</p>
          <p className="text-xs text-zinc-600 mt-0.5">active subs × plan price</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Active Subscriptions</p>
          <p className="text-2xl font-bold font-mono text-emerald-400">{activeSubscriptions}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Credits Used (cycle)</p>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {creditsReady ? [...consumedById.values()].reduce((a, b) => a + b, 0).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      {/* Billing Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">All Organizations — Billing Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Sub Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Gateway</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Balance</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Used (cycle)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{org.name}</p>
                    <p className="text-xs text-zinc-500">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[org.plan] ?? "bg-zinc-700 text-zinc-300"}`}>
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {org.subscriptionStatus ? (
                      <span className={`text-xs font-medium ${
                        org.subscriptionStatus === "active"        ? "text-emerald-400" :
                        org.subscriptionStatus === "payment_failed" ? "text-red-400" :
                        org.subscriptionStatus === "halted"         ? "text-red-400" :
                        "text-zinc-400"
                      }`}>
                        {org.subscriptionStatus.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {org.billingGateway ? (
                      <span className="text-xs text-zinc-300 capitalize">{org.billingGateway}</span>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">
                    {creditsReady ? (balanceById.get(org.id) ?? 0).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {creditsReady ? (consumedById.get(org.id) ?? 0).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orgs.length === 0 && <p className="text-center py-12 text-zinc-500">No organizations yet</p>}
        </div>
      </div>
    </div>
  );
}
