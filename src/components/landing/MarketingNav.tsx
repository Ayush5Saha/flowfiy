"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Affiliates", href: "/affiliates" },
  {
    label: "Resources",
    children: [
      { label: "Blog", href: "/blog", desc: "AI sales tips & guides" },
      { label: "AI Lead Generation", href: "/use-cases/ai-lead-generation", desc: "Use case deep dive" },
      { label: "Cold Email Automation", href: "/use-cases/cold-email-automation", desc: "Automate outreach" },
      { label: "About", href: "/about", desc: "Our story & mission" },
      { label: "Founder", href: "/founder", desc: "Meet the person behind Flowfiy" },
    ],
  },
  {
    label: "Compare",
    children: [
      { label: "vs Clay", href: "/vs/clay", desc: "Workflow builder vs AI pipeline" },
      { label: "vs Apollo", href: "/vs/apollo", desc: "Database vs end-to-end platform" },
    ],
  },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 20));
  }, [scrollY]);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

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

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Get started free
          </Link>
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
            <div className="pt-4 flex flex-col gap-2 border-t border-white/10 mt-3">
              <Link href="/login" className="text-sm text-center py-2.5 border border-white/10 rounded-lg text-zinc-300">Sign in</Link>
              <Link href="/signup" className="text-sm text-center py-2.5 bg-primary rounded-lg text-white font-medium">Get started free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
