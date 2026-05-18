import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const planColors: Record<string, string> = {
  FREE: "bg-zinc-700 text-zinc-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH: "bg-violet-500/20 text-violet-300",
  AGENCY: "bg-amber-500/20 text-amber-300",
};

const planOrder = ["FREE", "STARTER", "GROWTH", "AGENCY"];

export default async function AdminBillingPage() {
  await requireAdmin();

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      razorpayCustomerId: true,
      razorpaySubscriptionId: true,
      generationCount: true,
      generationLimit: true,
      createdAt: true,
    },
  });

  // Plan breakdown
  const planBreakdown = planOrder.map((plan) => ({
    plan,
    count: orgs.filter((o) => o.plan === plan).length,
  }));

  const paidOrgs = orgs.filter((o) => o.plan !== "FREE");
  const orgsWithRazorpay = orgs.filter((o) => o.razorpayCustomerId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {paidOrgs.length} paid organizations · {orgsWithRazorpay.length} with Razorpay
        </p>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {planBreakdown.map(({ plan, count }) => (
          <div key={plan} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{plan}</p>
            <p className="text-3xl font-bold text-white">{count}</p>
            <p className="text-xs text-zinc-500 mt-1">organizations</p>
          </div>
        ))}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Razorpay Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Generation Usage</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orgs.map((org) => {
                const usagePct = org.generationLimit === -1
                  ? 0
                  : Math.round((org.generationCount / org.generationLimit) * 100);
                return (
                  <tr key={org.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{org.name}</p>
                      <p className="text-xs text-zinc-500">{org.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[org.plan]}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {org.subscriptionStatus ? (
                        <span className={`text-xs font-medium ${
                          org.subscriptionStatus === "active" ? "text-emerald-400" :
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
                      {org.razorpayCustomerId ? (
                        <div>
                          <p className="text-xs text-zinc-400 font-mono">{org.razorpayCustomerId}</p>
                          {org.razorpaySubscriptionId && (
                            <p className="text-xs text-zinc-600 font-mono">{org.razorpaySubscriptionId.slice(0, 20)}…</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">No Razorpay</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-zinc-300">
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
