import { requireAdmin } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminOrgPlanEditor from "@/components/admin/AdminOrgPlanEditor";
import AdminCreditGrant from "@/components/admin/AdminCreditGrant";
import AdminUserDetailActions from "@/components/admin/AdminUserDetailActions";
import { Coins } from "lucide-react";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  FLOWFIY: "bg-emerald-500/20 text-emerald-300",
  INDIE:   "bg-teal-500/20 text-teal-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH:  "bg-violet-500/20 text-violet-300",
  AGENCY:  "bg-amber-500/20 text-amber-300",
};

const subColors: Record<string, string> = {
  active:         "bg-emerald-500/15 text-emerald-300",
  pending:        "bg-amber-500/15 text-amber-300",
  payment_failed: "bg-red-500/15 text-red-300",
  halted:         "bg-red-500/15 text-red-300",
  cancelled:      "bg-zinc-700 text-zinc-400",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(id);
  if (error || !data?.user) notFound();
  const user = data.user;

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: id },
    include: {
      organization: {
        include: {
          integrations: { select: { type: true, status: true } },
          _count: { select: { campaigns: true, leadLists: true } },
        },
      },
    },
  });

  // Credit balances/usage per org — guarded so the page renders pre-migration.
  const orgIds = memberships.map((m) => m.organization.id);
  const cycleStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const balanceById = new Map<string, number>();
  const heldById = new Map<string, number>();
  const consumedById = new Map<string, number>();
  let creditsReady = true;
  if (orgIds.length > 0) {
    try {
      const wallets = await prisma.creditWallet.findMany({
        where: { organizationId: { in: orgIds } },
        select: { organizationId: true, balance: true, held: true },
      });
      for (const w of wallets) { balanceById.set(w.organizationId, w.balance); heldById.set(w.organizationId, w.held); }
      const consumed = await prisma.creditLedger.groupBy({
        by: ["organizationId"],
        where: { organizationId: { in: orgIds }, type: "CONSUME", createdAt: { gte: cycleStart } },
        _sum: { amount: true },
      });
      for (const c of consumed) consumedById.set(c.organizationId, Math.abs(c._sum.amount ?? 0));
    } catch {
      creditsReady = false;
    }
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ?? "Unknown";
  const provider = user.app_metadata?.provider ?? "email";
  const isBanned = !!user.banned_until;
  const isVerified = !!user.email_confirmed_at;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin/users" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          Users
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-white">{displayName}</span>
      </div>

      {/* User profile card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-violet-300">{getInitials(displayName)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                {isBanned && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400 font-medium">
                    Banned
                  </span>
                )}
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm mt-0.5">{user.email}</p>
              <p className="text-zinc-600 text-xs font-mono mt-0.5">{user.id}</p>
            </div>
          </div>

          {/* Actions */}
          <AdminUserDetailActions
            userId={user.id}
            userName={displayName}
            isBanned={isBanned}
          />
        </div>

        {/* Meta info row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Auth Provider</p>
            <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300 capitalize">
              {provider}
            </span>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Organizations</p>
            <p className="text-sm text-white">{memberships.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Joined</p>
            <p className="text-sm text-white">
              {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Last Sign In</p>
            <p className="text-sm text-white">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Never"}
            </p>
          </div>
        </div>
      </div>

      {/* Organizations */}
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Organizations & Controls
      </h2>

      {memberships.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">This user doesn&apos;t belong to any organization yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map(({ role, organization: org }) => {
            const balance = balanceById.get(org.id) ?? 0;
            const held = heldById.get(org.id) ?? 0;
            const usedThisCycle = consumedById.get(org.id) ?? 0;
            const subStatus = org.subscriptionStatus ?? "none";
            const connectedIntegrations = org.integrations
              .filter((i) => i.status === "CONNECTED")
              .map((i) => i.type);

            return (
              <div key={org.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Org header */}
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{org.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColors[org.plan] ?? "bg-zinc-700 text-zinc-300"}`}>
                          {org.plan}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400">
                          {role}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{org.slug}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Full org view →
                  </Link>
                </div>

                {/* Controls grid */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Plan */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Plan</p>
                    <AdminOrgPlanEditor orgId={org.id} currentPlan={org.plan} />
                    <p className="text-[11px] text-zinc-600">Change without requiring payment</p>
                  </div>

                  {/* Subscription */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Subscription</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${subColors[subStatus] ?? "bg-zinc-800 text-zinc-500"}`}>
                      {subStatus === "none" ? "no subscription" : subStatus.replace("_", " ")}
                    </span>
                    <p className="text-[11px] text-zinc-600">Set by the billing gateway webhook</p>
                  </div>

                  {/* Credits — prominent: grant credits to this user immediately */}
                  <div className="sm:col-span-2 mt-1 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">Give credits to this user</p>
                    </div>
                    {creditsReady ? (
                      <>
                        <div className="flex gap-6 mb-3">
                          <div>
                            <p className="text-lg font-mono font-semibold text-white">{balance.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500">available</p>
                          </div>
                          <div>
                            <p className="text-lg font-mono font-semibold text-amber-400">{held.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500">reserved</p>
                          </div>
                          <div>
                            <p className="text-lg font-mono font-semibold text-white">{usedThisCycle.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500">used this cycle</p>
                          </div>
                        </div>
                        <AdminCreditGrant orgId={org.id} />
                        <p className="text-[11px] text-zinc-500 mt-2">Added to this user&apos;s wallet immediately (logged as a GRANT ledger entry). Credits are shared across the user&apos;s organization.</p>
                      </>
                    ) : (
                      <p className="text-xs text-amber-400">Credit tables not migrated — run <span className="font-mono">npm run db:push</span>.</p>
                    )}
                  </div>

                  {/* Stats & Integrations */}
                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Activity</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-white font-medium">{org._count.campaigns}</p>
                        <p className="text-xs text-zinc-500">Campaigns</p>
                      </div>
                      <div>
                        <p className="text-white font-medium">{org._count.leadLists}</p>
                        <p className="text-xs text-zinc-500">Lead Lists</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Integrations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {connectedIntegrations.length === 0 ? (
                        <span className="text-xs text-zinc-600">None connected</span>
                      ) : (
                        connectedIntegrations.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400">
                            {t}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
