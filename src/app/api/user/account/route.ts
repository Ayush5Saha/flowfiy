import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { authRateLimit } from "@/lib/rate-limit";

/**
 * Permanently delete the signed-in user's account and all associated data.
 *
 * Order matters: we clear the app data FIRST (so we never orphan org rows that
 * have no auth user behind them), then delete the Supabase auth user. Orgs the
 * user OWNS are deleted entirely — every related row (leads, campaigns,
 * integrations, billing, members…) cascades via `onDelete: Cascade`. Orgs where
 * they're only a member just lose their membership row.
 */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Account-sensitive + irreversible — throttle hard.
  const { success } = await authRateLimit.limit(`delete-account:${user.id}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  // 1) Remove the user's app data.
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id },
      select: { id: true, organizationId: true, role: true },
    });
    const ownedOrgIds = memberships.filter((m) => m.role === "OWNER").map((m) => m.organizationId);
    const otherMembershipIds = memberships.filter((m) => m.role !== "OWNER").map((m) => m.id);

    await prisma.$transaction([
      ...ownedOrgIds.map((id) => prisma.organization.delete({ where: { id } })),
      ...(otherMembershipIds.length
        ? [prisma.organizationMember.deleteMany({ where: { id: { in: otherMembershipIds } } })]
        : []),
    ]);
  } catch {
    return NextResponse.json(
      { error: "We couldn't delete your workspace data. Please try again or contact support@flowfiy.com." },
      { status: 500 }
    );
  }

  // 2) Delete the auth user (service role). Invalidates every session.
  const admin = await createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Your data was removed, but deleting your login failed. Please contact support@flowfiy.com." },
      { status: 500 }
    );
  }

  // 3) Clear the now-orphaned session cookies (best effort).
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ ok: true });
}
