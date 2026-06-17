"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  Mail,
  Newspaper,
  UserCircle2,
  CreditCard,
  ScrollText,
  LogOut,
  ShieldAlert,
  Activity,
  Zap,
  HandCoins,
  UserCog,
  Menu,
  X,
} from "lucide-react";

const NAV_MAIN = [
  { label: "Overview",      href: "/admin",              icon: LayoutDashboard },
  { label: "Users",         href: "/admin/users",         icon: Users },
  { label: "Organizations", href: "/admin/organizations", icon: Building2 },
  { label: "Campaigns",     href: "/admin/campaigns",     icon: Megaphone },
  { label: "Email Campaigns", href: "/admin/email-campaigns", icon: Mail },
  { label: "Leads",         href: "/admin/leads",         icon: UserCircle2 },
  { label: "Blog",          href: "/admin/blog",          icon: Newspaper },
  { label: "Affiliates",    href: "/admin/affiliates",    icon: HandCoins },
];

const NAV_SYSTEM = [
  { label: "Billing",       href: "/admin/billing",       icon: CreditCard },
  { label: "AI Usage",      href: "/admin/ai-usage",      icon: Zap },
  { label: "System Health", href: "/admin/system",        icon: Activity },
  { label: "Audit Logs",    href: "/admin/audit-logs",    icon: ScrollText },
];

export default function AdminSidebar({ role = "ADMIN" }: { role?: "OWNER" | "ADMIN" }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // "Team" (admin-access management) is owner-only.
  const systemNav = role === "OWNER"
    ? [...NAV_SYSTEM, { label: "Team", href: "/admin/team", icon: UserCog }]
    : NAV_SYSTEM;

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // ── Shared nav content ───────────────────────────────────────────────────
  function NavContent() {
    return (
      <>
        {/* ── Navigation ──────────────────────────────── */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {/* Section: Management */}
          <p className="px-3 pb-2 text-[10px] font-semibold text-zinc-600 tracking-widest uppercase">
            Management
          </p>
          {NAV_MAIN.map(({ label, href, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
                  active ? "bg-amber-500/10 text-amber-300 font-medium" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-sm" />}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                {label}
              </Link>
            );
          })}

          {/* Section: System */}
          <p className="px-3 pt-4 pb-2 text-[10px] font-semibold text-zinc-600 tracking-widest uppercase">
            System
          </p>
          {systemNav.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
                  active ? "bg-amber-500/10 text-amber-300 font-medium" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-sm" />}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Logout ──────────────────────────────────── */}
        <div className="px-2 pb-4 pt-2 border-t border-zinc-800/80">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400" />
            Logout
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-zinc-950 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Flowfiy</p>
            <p className="text-[10px] font-semibold text-amber-400/80 tracking-wide uppercase">Admin</p>
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-zinc-950 border-r border-zinc-800/80 flex-col select-none">
        {/* ── Logo / Identity ─────────────────────────── */}
        <div className="px-4 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Flowfiy</p>
              <p className="text-[10px] font-semibold text-amber-400/80 tracking-wide uppercase">Admin Panel</p>
            </div>
          </div>
        </div>
        <NavContent />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer panel */}
            <motion.div
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-zinc-950 border-r border-zinc-800/80 select-none"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header with identity + close */}
              <div className="px-4 py-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <ShieldAlert className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Flowfiy</p>
                    <p className="text-[10px] font-semibold text-amber-400/80 tracking-wide uppercase">Admin Panel</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NavContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
