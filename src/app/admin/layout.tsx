import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — Flowfiy" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow login page without auth check
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = token ? verifyAdminToken(token) : false;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {isAuthenticated ? (
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto bg-[#09090b] pt-14 md:pt-0">
            {/* Amber top bar — visual indicator this is admin */}
            <div className="h-0.5 bg-gradient-to-r from-amber-600/80 via-amber-400/60 to-amber-600/80" />
            <div className="p-6 lg:p-8">{children}</div>
          </main>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export async function generateAdminGuard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminToken(token)) {
    redirect("/admin/login");
  }
}
