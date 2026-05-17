"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  BarChart2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { MemberRole, Organization } from "@prisma/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/integrations", icon: Plug, label: "Integrations" },
];

const bottomItems = [
  { href: "/billing", icon: CreditCard, label: "Billing" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  organization: Organization;
  userRole: MemberRole;
  userEmail: string;
  userFullName: string;
  activeCampaignReplies?: number;
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

export function Sidebar({ organization, userEmail, userFullName, activeCampaignReplies = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const planColors: Record<string, string> = {
    FREE: "text-muted-foreground",
    STARTER: "text-blue-400",
    GROWTH: "text-purple-400",
    AGENCY: "text-yellow-400",
  };

  return (
    <aside className="hidden md:flex w-56 border-r border-border bg-sidebar flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.svg" alt="Flowfiy" width={100} height={30} priority />
        </Link>
      </div>

      {/* Org switcher */}
      <div className="px-3 py-2 border-b border-border">
        <div className="px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer">
          <p className="text-xs font-medium truncate">{organization.name}</p>
          <p className={`text-xs ${planColors[organization.plan] ?? "text-muted-foreground"}`}>
            {organization.plan} plan
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const showBadge = href === "/campaigns" && activeCampaignReplies > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {showBadge && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-green-500 text-white text-[10px] font-bold leading-none">
                  {activeCampaignReplies > 99 ? "99+" : activeCampaignReplies}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-3 border-t border-border space-y-0.5">
        {bottomItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>

        {/* User avatar strip */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2.5 py-2 mt-1 rounded-md hover:bg-sidebar-accent transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {getInitials(userFullName, userEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight">
              {userFullName || userEmail.split("@")[0]}
            </p>
            <p className="text-[10px] text-muted-foreground truncate leading-tight">{userEmail}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
