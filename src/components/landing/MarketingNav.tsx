"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import {
  Menu, X, ChevronDown,
  LayoutDashboard, User, CreditCard, Settings, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Demo", href: "/#demo" },
  {
    label: "Solutions",
    children: [
      { label: "All solutions", href: "/solutions", desc: "The whole outbound motion" },
      { label: "AI Sales Intelligence", href: "/solutions/ai-sales-intelligence", desc: "Research & score every lead" },
      { label: "AI Business Search", href: "/solutions/ai-business-search", desc: "Find companies in plain English" },
      { label: "AI Company Research", href: "/solutions/ai-company-research", desc: "Automated prospect dossiers" },
      { label: "AI Prospecting Tool", href: "/solutions/ai-prospecting-tool", desc: "Automate research & outreach" },
      { label: "Natural Language Lead Gen", href: "/solutions/natural-language-lead-generation", desc: "Describe leads, AI finds them" },
      { label: "B2B Lead Generation", href: "/solutions/b2b-lead-generation-software", desc: "End-to-end, by AI" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Affiliates", href: "/affiliates" },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog", desc: "AI sales tips & guides" },
      { label: "Use Cases", href: "/use-cases", desc: "Ways teams use Flowfiy" },
      { label: "Glossary", href: "/glossary", desc: "AI sales & outbound terms" },
      { label: "About", href: "/about", desc: "Our story & mission" },
      { label: "Founder", href: "/founder", desc: "Meet the person behind Flowfiy" },
    ],
  },
  {
    label: "Compare",
    children: [
      { label: "All comparisons", href: "/vs", desc: "How Flowfiy stacks up" },
      { label: "vs Clay", href: "/vs/clay", desc: "Workflow builder vs AI pipeline" },
      { label: "vs Apollo", href: "/vs/apollo", desc: "Database vs end-to-end platform" },
      { label: "vs Instantly", href: "/vs/instantly", desc: "Sending tool vs full pipeline" },
      { label: "vs Smartlead", href: "/vs/smartlead", desc: "Email infra vs AI SDR" },
      { label: "vs lemlist", href: "/vs/lemlist", desc: "Sequencing vs AI research" },
    ],
  },
];

const profileMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: User,            label: "Profile",   href: "/profile" },
  { icon: CreditCard,      label: "Billing",   href: "/billing" },
  { icon: Settings,        label: "Settings",  href: "/settings" },
];

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function MarketingNav() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authUser, setAuthUser]       = useState<{ email: string; fullName: string } | null>(null);

  const { scrollY } = useScroll();
  const pathname    = usePathname();
  const router      = useRouter();
  const profileRef  = useRef<HTMLDivElement>(null);

  // ── Scroll detection ────────────────────────────────────
  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 20));
  }, [scrollY]);

  // ── Close nav on route change ────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setProfileOpen(false);
  }, [pathname]);

  // ── Supabase auth state ─────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthUser({
          email: user.email ?? "",
          fullName:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            "",
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setAuthUser({
          email: session.user.email ?? "",
          fullName:
            (session.user.user_metadata?.full_name as string | undefined) ??
            (session.user.user_metadata?.name as string | undefined) ??
            "",
        });
      } else {
        setAuthUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Click-outside closes profile dropdown ───────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // ── Sign out ─────────────────────────────────────────────
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfileOpen(false);
    router.push("/");
  }

  const initials     = authUser ? getInitials(authUser.fullName, authUser.email) : "";
  const displayName  = authUser
    ? (authUser.fullName || authUser.email.split("@")[0])
    : "";

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/85 backdrop-blur-xl border-b border-white/5" : "bg-black/40 backdrop-blur-md"
      }`}
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.svg" alt="Flowfiy" width={120} height={36} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/5">
                  {item.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="flex flex-col gap-0.5 px-4 py-3 hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium text-white">{child.label}</span>
                          <span className="text-xs text-zinc-500">{child.desc}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* CTA / Profile */}
        <div className="hidden md:flex items-center gap-3">
          {authUser ? (
            /* ── Logged-in: profile avatar dropdown ── */
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition-all group"
                aria-label="Profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-violet-500/30 group-hover:ring-violet-500/60 transition-all">
                  {initials}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                          <p className="text-xs text-zinc-500 truncate">{authUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {profileMenuItems.map(({ icon: Icon, label, href }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-white/8 py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-red-400 hover:bg-red-500/8 transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ── Logged-out: original CTA buttons ── */
            <>
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-all hover:shadow-lg hover:shadow-primary/25"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-white/10 px-4 pb-5 overflow-hidden"
          >
            <div className="space-y-1 pt-2">
              {navLinks.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <p className="px-2 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="block px-2 py-2 text-sm text-zinc-300 hover:text-white">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link key={item.href} href={item.href!} className="block px-2 py-2 text-sm text-zinc-300 hover:text-white">
                    {item.label}
                  </Link>
                )
              )}
            </div>

            {/* Mobile bottom CTA */}
            <div className="pt-4 flex flex-col gap-2 border-t border-white/10 mt-3">
              {authUser ? (
                <>
                  {/* User identity strip */}
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-zinc-500 truncate">{authUser.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="text-sm text-center py-2.5 bg-primary rounded-lg text-white font-medium">
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-center py-2.5 border border-white/10 rounded-lg text-zinc-300 hover:text-red-400 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-center py-2.5 border border-white/10 rounded-lg text-zinc-300">Sign in</Link>
                  <Link href="/signup" className="text-sm text-center py-2.5 bg-primary rounded-lg text-white font-medium">Get started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
