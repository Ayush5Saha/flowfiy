import { requireAdmin } from "@/lib/admin-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AdminUsersTable, { type AdminUserRow } from "@/components/admin/AdminUsersTable";

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

  const rows: AdminUserRow[] = users.map((user) => {
    const orgs = membersByUser[user.id] ?? [];
    const metadataPhone =
      typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "";

    return {
      id: user.id,
      name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "—",
      email: user.email ?? "",
      phone: user.phone ?? metadataPhone ?? "",
      provider: user.app_metadata?.provider ?? "email",
      isVerified: !!user.email_confirmed_at,
      isBanned: !!user.banned_until,
      orgs: orgs.map((m) => ({
        id: m.id,
        name: m.organization.name,
        plan: m.organization.plan,
        role: m.role,
      })),
      createdAt: user.created_at ?? null,
      lastSignIn: user.last_sign_in_at ?? null,
    };
  });

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

      <AdminUsersTable users={rows} />
    </div>
  );
}
