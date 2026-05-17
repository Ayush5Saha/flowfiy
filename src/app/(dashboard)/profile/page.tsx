import { redirect } from "next/navigation";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  // Check if user signed in with OAuth (Google) — no password management for them
  const identities = user.identities ?? [];
  const isOAuthUser = identities.some((i) => i.provider === "google");

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  return (
    <ProfileClient
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName,
        createdAt: user.created_at,
        isOAuthUser,
      }}
      membership={{
        role: membership.role,
        orgName: organization.name,
        orgPlan: organization.plan,
      }}
    />
  );
}
