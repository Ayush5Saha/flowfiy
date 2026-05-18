import { requireAdmin } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  await requireAdmin();

  const supabase = await createServiceClient();
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const users = data?.users ?? [];

  // Get org memberships for each user
  const members = await prisma.organizationMember.findMany({
    include: { organization: { select: { id: true, name: true, plan: true } } },
  });

  const membersByUser = members.reduce<Record<string, typeof members>>((acc, m) => {
    if (!acc[m.userId]) acc[m.userId] = [];
    acc[m.userId].push(m);
    return acc;
  }, {});

  const planColors: Record<string, string> = {
    FREE: "bg-zinc-700 text-zinc-300",
    STARTER: "bg-blue-500/20 text-blue-300",
    GROWTH: "bg-violet-500/20 text-violet-300",
    AGENCY: "bg-amber-500/20 text-amber-300",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-zinc-400 text-sm mt-1">{users.length} total users</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Provider</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organizations</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Sign In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((user) => {
                const orgs = membersByUser[user.id] ?? [];
                const provider = user.app_metadata?.provider ?? "email";
                return (
                  <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">
                          {user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300 capitalize">
                        {provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {orgs.length === 0 ? (
                          <span className="text-zinc-600 text-xs">—</span>
                        ) : (
                          orgs.map((m) => (
                            <span
                              key={m.id}
                              className={`px-2 py-0.5 rounded-full text-xs ${planColors[m.organization.plan]}`}
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
