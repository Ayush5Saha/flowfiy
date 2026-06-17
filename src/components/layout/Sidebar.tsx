"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  BarChart2,
  Gift,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { MemberRole, Organization } from "@prisma/client";
import { CreditBalancePill } from "@/components/leads/CreditBalancePill";

const mainNav = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/analytics",    icon: BarChart2,        label: "Analytics" },
  { href: "/leads",        icon: Users,            label: "Leads" },
  { href: "/campaigns",    icon: Megaphone,        label: "Campaigns" },
  { href: "/integrations", icon: Plug,             label: "Integrations" },
];

const accountNav = [
  { href: "/referral", icon: Gift,       label: "Referral" },
  { href: "/billing",  icon: CreditCard, label: "Billing" },
  { href: "/settings", icon: Settings,   label: "Settings" },
];

const planMeta: Record<string, { label: string; color: string; dot: string }> = {
  FREE:    { label: "Free",    color: "text-zinc-400",   dot: "bg-zinc-500" },
  INDIE:   { label: "Indie",   color: "text-teal-400",   dot: "bg-teal-500" },
  STARTER: { label: "Starter", color: "text-blue-400",   dot: "bg-blue-500" },
  GROWTH:  { label: "Growth",  color: "text-violet-400", dot: "bg-violet-500" },
  AGENCY:  { label: "Agency",  color: "text-amber-400",  dot: "bg-amber-500" },
};

interface SidebarProps {
  organization: Organization;
  userRole: MemberRole;
  userEmail: string;
  userFullName: string;
  activeCampaignReplies?: number;
  /** Number of required integrations that are not yet connected */
  missingIntegrations?: number;
}

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  badgeVariant = "green",
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  badgeVariant?: "green" | "red";
}) {
  const pathname = usePathname();
  const active =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const badgeColor =
    badgeVariant === "red"
      ? "bg-red-500 text-white"
      : "bg-emerald-500 text-white";

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
        active
          ? "bg-primary/10 text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
      }`}
    >
      {/* Left accent bar for active state */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-sm" />
      )}
      <Icon
        className={`w-4 h-4 shrink-0 transition-colors ${
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className={`ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold leading-none ${badgeColor}`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  organization,
  userEmail,
  userFullName,
  activeCampaignReplies = 0,
  missingIntegrations = 0,
}: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const plan     = planMeta[organization.plan] ?? planMeta.FREE;

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials    = getInitials(userFullName, userEmail);
  const displayName = userFullName || userEmail.split("@")[0];

  // ── Shared nav content (used in both desktop aside and mobile drawer) ──────
  function NavContent({ onClose }: { onClose?: () => void }) {
    return (
      <>
        {/* ── Org switcher ─────────────────────────────── */}
        <div className="px-3 pt-3 pb-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary/80 to-violet-600/80 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {organization.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{organization.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${plan.dot}`} />
                <p className={`text-[10px] font-medium ${plan.color}`}>{plan.label}</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* ── Main Navigation ───────────────────────────── */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {mainNav.map(({ href, icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              badge={
                href === "/campaigns"
                  ? activeCampaignReplies
                  : href === "/integrations"
                  ? missingIntegrations
                  : undefined
              }
              badgeVariant={href === "/integrations" ? "red" : "green"}
            />
          ))}

          {/* ── Credit balance ────────────────────────── */}
          <div className="mx-1 mt-4 mb-1 flex">
            <CreditBalancePill className="w-full justify-center" />
          </div>

          {/* ── Account section ───────────────────────── */}
          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              Account
            </p>
          </div>
          {accountNav.map(({ href, icon, label }) => (
            <NavItem key={href} href={href} icon={icon} label={label} />
          ))}
        </nav>

        {/* ── Bottom: Sign out + User strip ────────────── */}
        <div className="px-2 pb-3 pt-2 border-t border-sidebar-border space-y-0.5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-destructive" />
            Sign out
          </button>

          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg hover:bg-sidebar-accent transition-all duration-150 group border border-transparent hover:border-sidebar-border"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{userEmail}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-sidebar border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.svg" alt="Flowfiy" width={90} height={26} priority />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-60 border-r border-sidebar-border bg-sidebar flex-col h-full shrink-0 select-none">
        {/* ── Logo ─────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-sidebar-border flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.svg" alt="Flowfiy" width={100} height={28} priority />
          </Link>
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
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-sidebar border-r border-sidebar-border select-none"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Header with logo + close */}
              <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between shrink-0">
                <Link href="/dashboard" className="flex items-center">
                  <Image src="/logo.svg" alt="Flowfiy" width={100} height={28} priority />
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NavContent onClose={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
