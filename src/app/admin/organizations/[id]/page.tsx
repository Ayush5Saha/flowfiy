import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminDeleteOrg from "@/components/admin/AdminDeleteOrg";
import AdminOrgLimitEditor from "@/components/admin/AdminOrgLimitEditor";
import AdminOrgPlanEditor from "@/components/admin/AdminOrgPlanEditor";
import AdminTokenResetButton from "@/components/admin/AdminTokenResetButton";
import AdminGenerationResetButton from "@/components/admin/AdminGenerationResetButton";
import AdminApiModeToggle from "@/components/admin/AdminApiModeToggle";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  FLOWFIY: "bg-emerald-500/20 text-emerald-300",
};

const statusColors: Record<string, string> = {
  DRAFT:     "text-zinc-400",
  ACTIVE:    "text-emerald-400",
  PAUSED:    "text-amber-400",
  COMPLETED: "text-blue-400",
};

const listStatusColors: Record<string, string> = {
  QUEUED:      "bg-blue-500/15 text-blue-300",
  RESEARCHING: "bg-amber-500/15 text-amber-300",
  READY:       "bg-emerald-500/15 text-emerald-300",
  FAILED:      "bg-red-500/15 text-red-300",
  ARCHIVED:    "bg-zinc-700 text-zinc-400",
};

const PLAN_BUDGETS: Record<string, number> = {
  FREE:    500_000,
  FLOWFIY: -1, // managed, credit-metered — no separate token cap
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

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
      _count: { select: { members: true, campaigns: true, leadLists: true } },
    },
  });

  if (!org) notFound();

  const tokensUsed = Number(org.monthlyTokensUsed);
  const tokenBudget = PLAN_BUDGETS[org.plan] ?? 500_000;
  const tokenUnlimited = tokenBudget === -1;
  const tokenPct = tokenUnlimited ? 0 : Math.min(Math.round((tokensUsed / tokenBudget) * 100), 100);
  const tokenAtLimit = !tokenUnlimited && tokensUsed >= tokenBudget;

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
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${planColors[org.plan] ?? "bg-zinc-700 text-zinc-300"}`}>
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
                <p className="text-xs text-zinc-500 mb-2">Plan</p>
                <AdminOrgPlanEditor orgId={org.id} currentPlan={org.plan} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">API Mode</p>
                <AdminApiModeToggle orgId={org.id} currentMode={org.apiMode} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Subscription Status</p>
                <p className="text-sm text-white">{org.subscriptionStatus ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Billing Gateway</p>
                <p className="text-sm text-zinc-300 capitalize">{org.billingGateway ?? "—"}</p>
              </div>

              {/* Generation Usage */}
              <div className="col-span-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-500">Generation Usage</p>
                  <AdminGenerationResetButton orgId={org.id} />
                </div>
                <AdminOrgLimitEditor
                  orgId={org.id}
                  generationCount={org.generationCount}
                  generationLimit={org.generationLimit}
                />
              </div>

              {/* Token Budget */}
              <div className="col-span-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-500">Monthly Token Budget</p>
                  <AdminTokenResetButton orgId={org.id} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className={`text-sm font-mono ${tokenAtLimit ? "text-red-400" : "text-white"}`}>
                      {formatTokens(tokensUsed)} used
                      {!tokenUnlimited && ` / ${formatTokens(tokenBudget)} budget`}
                      {tokenUnlimited && " / ∞ Unlimited"}
                    </p>
                    {!tokenUnlimited && (
                      <div className="w-full h-1.5 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${tokenPct > 90 ? "bg-red-500" : tokenPct > 70 ? "bg-amber-500" : "bg-blue-500"}`}
                          style={{ width: `${tokenPct}%` }}
                        />
                      </div>
                    )}
                    {tokenAtLimit && (
                      <p className="text-xs text-red-400 mt-1">⚠ Budget reached — new jobs blocked until reset</p>
                    )}
                  </div>
                  <p className={`text-2xl font-bold font-mono ${tokenAtLimit ? "text-red-400" : "text-zinc-400"}`}>
                    {tokenUnlimited ? "∞" : `${tokenPct}%`}
                  </p>
                </div>
                {org.tokenBudgetResetAt && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Last reset: {new Date(org.tokenBudgetResetAt).toLocaleDateString()}
                  </p>
                )}
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
                  <p className="text-xs text-zinc-500">Service Offered</p>
                  <p className="text-white">{org.businessProfile.serviceOffered}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500">ICP Description</p>
                  <p className="text-zinc-300 text-xs leading-relaxed">{org.businessProfile.icpDescription}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Tone</p>
                  <p className="text-white capitalize">{org.businessProfile.outreachTone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Industries</p>
                  <p className="text-white">{org.businessProfile.targetIndustries.join(", ") || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500">Geographies</p>
                  <p className="text-white">{org.businessProfile.targetGeographies.join(", ") || "—"}</p>
                </div>
              </div>
            </div>
          )}

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
                    <p className="text-xs text-zinc-500">
                      {ll.totalLeads} leads · {ll.qualifiedLeads ?? 0} qualified · {new Date(ll.createdAt).toLocaleDateString()}
                    </p>
                    {ll.jobError && (
                      <p className="text-xs text-red-400 mt-0.5 max-w-xs truncate">{ll.jobError}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${listStatusColors[ll.status] ?? "bg-zinc-700 text-zinc-400"}`}>
                    {ll.status}
                  </span>
                </div>
              ))}
              {org.leadLists.length === 0 && (
                <p className="px-5 py-6 text-xs text-zinc-600">No lead lists</p>
              )}
            </div>
          </div>

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
                  <span className={`text-xs font-medium ${statusColors[c.status] ?? "text-zinc-400"}`}>{c.status}</span>
                </div>
              ))}
              {org.campaigns.length === 0 && (
                <p className="px-5 py-6 text-xs text-zinc-600">No campaigns</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-5">
          {/* Members */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Members ({org.members.length})</h2>
            <div className="space-y-2">
              {org.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400 font-mono">{m.userId.slice(0, 16)}…</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.role === "OWNER"
                      ? "bg-amber-500/15 text-amber-300"
                      : m.role === "ADMIN"
                      ? "bg-blue-500/15 text-blue-300"
                      : "bg-zinc-700 text-zinc-400"
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Integrations</h2>
            <div className="space-y-2">
              {org.integrations.filter((i) => i.type !== "CLAUDE").map((i) => (
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
              {org.integrations.filter((i) => i.type !== "CLAUDE").length === 0 && (
                <p className="text-xs text-zinc-600">No integrations</p>
              )}
            </div>
          </div>

          {/* Razorpay / Billing IDs */}
          {(org.razorpayCustomerId || org.stripeCustomerId) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Billing IDs</h2>
              {org.razorpayCustomerId && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-500 mb-0.5">Razorpay Customer</p>
                  <p className="text-xs font-mono text-zinc-300">{org.razorpayCustomerId}</p>
                </div>
              )}
              {org.razorpaySubscriptionId && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-500 mb-0.5">Razorpay Subscription</p>
                  <p className="text-xs font-mono text-zinc-400">{org.razorpaySubscriptionId}</p>
                </div>
              )}
              {org.stripeCustomerId && (
                <div className="mb-2">
                  <p className="text-xs text-zinc-500 mb-0.5">Stripe Customer</p>
                  <p className="text-xs font-mono text-zinc-300">{org.stripeCustomerId}</p>
                </div>
              )}
            </div>
          )}

          {/* Referral */}
          {org.referralCode && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Referral</h2>
              <p className="text-xs text-zinc-500 mb-0.5">Code</p>
              <p className="text-sm font-mono text-emerald-400">{org.referralCode}</p>
              <p className="text-xs text-zinc-500 mt-2 mb-0.5">Credit Months</p>
              <p className="text-sm text-white">{org.referralCreditMonths}</p>
            </div>
          )}

          {/* Recent Audit Logs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
            </div>
            <div className="divide-y divide-zinc-800 max-h-80 overflow-y-auto">
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
