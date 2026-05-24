import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  INDIE:   "bg-teal-500/20 text-teal-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH:  "bg-violet-500/20 text-violet-300",
  AGENCY:  "bg-amber-500/20 text-amber-300",
};

const planOrder = ["FREE", "INDIE", "STARTER", "GROWTH", "AGENCY"];

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default async function AdminBillingPage() {
  await requireAdmin();

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      apiMode: true,
      subscriptionStatus: true,
      billingGateway: true,
      razorpayCustomerId: true,
      razorpaySubscriptionId: true,
      stripeCustomerId: true,
      generationCount: true,
      generationLimit: true,
      monthlyTokensUsed: true,
      createdAt: true,
    },
  });

  // Plan breakdown
  const planBreakdown = planOrder.map((plan) => ({
    plan,
    count: orgs.filter((o) => o.plan === plan).length,
  }));

  const paidOrgs = orgs.filter((o) => o.plan !== "FREE");
  const activeSubscriptions = orgs.filter((o) => o.subscriptionStatus === "active").length;
  const razorpayOrgs = orgs.filter((o) => o.razorpayCustomerId).length;
  const stripeOrgs = orgs.filter((o) => o.stripeCustomerId).length;
  const totalTokensUsed = orgs.reduce((sum, o) => sum + Number(o.monthlyTokensUsed), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {paidOrgs.length} paid orgs · {activeSubscriptions} active subs · {razorpayOrgs} Razorpay · {stripeOrgs} Stripe
        </p>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
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

      {/* Token overview */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Total Tokens This Month</p>
          <p className="text-2xl font-bold font-mono text-amber-400">{formatTokens(totalTokensUsed)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Active Subscriptions</p>
          <p className="text-2xl font-bold font-mono text-emerald-400">{activeSubscriptions}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">MRR (est.)</p>
          <p className="text-2xl font-bold font-mono text-violet-400">
            ₹{(
              orgs.filter((o) => o.plan === "STARTER" && o.subscriptionStatus === "active").length * 1700 +
              orgs.filter((o) => o.plan === "GROWTH" && o.subscriptionStatus === "active").length * 4900 +
              orgs.filter((o) => o.plan === "AGENCY" && o.subscriptionStatus === "active").length * 9900 +
              orgs.filter((o) => o.plan === "INDIE" && o.subscriptionStatus === "active").length * 699
            ).toLocaleString()}
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">based on active subs</p>
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
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">API Mode</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Sub Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Gateway</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Gen Usage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Tokens</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orgs.map((org) => {
                const usagePct = org.generationLimit === -1
                  ? 0
                  : Math.round((org.generationCount / org.generationLimit) * 100);
                const tokensUsed = Number(org.monthlyTokensUsed);

                return (
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        org.apiMode === "BYOK"
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-blue-500/15 text-blue-300"
                      }`}>
                        {org.apiMode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {org.subscriptionStatus ? (
                        <span className={`text-xs font-medium ${
                          org.subscriptionStatus === "active"   ? "text-emerald-400" :
                          org.subscriptionStatus === "trialing" ? "text-blue-400" :
                          org.subscriptionStatus === "past_due" ? "text-red-400" :
                          "text-zinc-400"
                        }`}>
                          {org.subscriptionStatus}
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
                    <td className="px-4 py-3">
                      <p className="text-xs text-zinc-300">
                        {org.generationCount} / {org.generationLimit === -1 ? "∞" : org.generationLimit}
                      </p>
                      {org.generationLimit !== -1 && (
                        <div className="w-20 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usagePct > 80 ? "bg-red-500" : "bg-violet-500"}`}
                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-zinc-300">{formatTokens(tokensUsed)}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(org.createdAt).toLocaleDateString()}
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
