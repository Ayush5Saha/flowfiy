import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession, ADMIN_COOKIE_NAME, type AdminSession } from "@/lib/admin-auth";

/** Returns the current admin session from the cookie, or null. */
export async function getAdminSessionFromCookies(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/** Any authenticated admin. Redirects to login if not signed in. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login");
  return session;
}

/** Owner-only pages (e.g. team management). Redirects non-owners to /admin. */
export async function requireAdminOwner(): Promise<AdminSession> {
  const session = await getAdminSessionFromCookies();
  if (!session) redirect("/admin/login");
  if (session.role !== "OWNER") redirect("/admin");
  return session;
}
