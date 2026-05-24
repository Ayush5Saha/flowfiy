import { requireAdmin } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AdminUserActions from "@/components/admin/AdminUserActions";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  INDIE:   "bg-teal-500/20 text-teal-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH:  "bg-violet-500/20 text-violet-300",
  AGENCY:  "bg-amber-500/20 text-amber-300",
};

export default async function AdminUsersPage() {
  await requireAdmin();

  const supabase = await createServiceClient();
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const users = data?.users ?? [];

  const members = await prisma.organizationMember.findMany({
    include: { organization: { select: { id: true, name: true, plan: true } } },
  });

  const membersByUser = members.reduce<Record<string, typeof members>>((acc, m) => {
    if (!acc[m.userId]) acc[m.userId] = [];
    acc[m.userId].push(m);
    return acc;
  }, {});

  const verifiedCount = users.filter((u) => !!u.email_confirmed_at).length;
  const bannedCount = users.filter((u) => u.banned_until).length;
  const googleCount = users.filter((u) => u.app_metadata?.provider === "google").length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-zinc-400 text-sm mt-1">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span><span className="text-emerald-400 font-medium">{verifiedCount}</span> verified</span>
          <span><span className="text-blue-400 font-medium">{googleCount}</span> Google OAuth</span>
          {bannedCount > 0 && (
            <span><span className="text-red-400 font-medium">{bannedCount}</span> banned</span>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Auth</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organizations</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Sign In</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((user) => {
                const orgs = membersByUser[user.id] ?? [];
                const provider = user.app_metadata?.provider ?? "email";
                const isBanned = !!user.banned_until;
                const isVerified = !!user.email_confirmed_at;

                return (
                  <tr key={user.id} className={`hover:bg-zinc-800/40 transition-colors ${isBanned ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">
                          {user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                        <p className="text-[10px] text-zinc-700 font-mono mt-0.5">{user.id.slice(0, 12)}…</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300 capitalize">
                        {provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-medium ${isVerified ? "text-emerald-400" : "text-amber-400"}`}>
                          {isVerified ? "✓ Verified" : "⚠ Unverified"}
                        </span>
                        {isBanned && (
                          <span className="text-xs text-red-400">🚫 Banned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {orgs.length === 0 ? (
                          <span className="text-zinc-600 text-xs">—</span>
                        ) : (
                          orgs.map((m) => (
                            <span
                              key={m.id}
                              className={`px-2 py-0.5 rounded-full text-xs ${planColors[m.organization.plan] ?? "bg-zinc-700 text-zinc-300"}`}
                            >
                              {m.organization.name} ({m.role})
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <AdminUserActions
                        userId={user.id}
                        userName={user.user_metadata?.full_name ?? user.email ?? user.id}
                        isBanned={isBanned}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}
