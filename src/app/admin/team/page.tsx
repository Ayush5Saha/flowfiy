import { requireAdminOwner } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/admin-auth";
import AdminTeamManager, { type TeamAdmin } from "@/components/admin/AdminTeamManager";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const session = await requireAdminOwner();

  const rows = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  const admins: TeamAdmin[] = rows.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    isActive: a.isActive,
    lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <AdminTeamManager admins={admins} ownerEmail={OWNER_EMAIL} currentEmail={session.email} />
  );
}
