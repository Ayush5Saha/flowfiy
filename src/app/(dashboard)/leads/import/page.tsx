import { redirect } from "next/navigation";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import ImportPageClient from "./ImportPageClient";

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  return <ImportPageClient organizationId={membership.organization.id} />;
}
