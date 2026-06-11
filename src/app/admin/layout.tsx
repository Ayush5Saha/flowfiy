import { cookies } from "next/headers";
import { getAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin — Flowfiy" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow login page without auth check
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {session ? (
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar role={session.role} />
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
