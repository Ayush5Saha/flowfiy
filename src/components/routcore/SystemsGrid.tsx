"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  PhoneCall,
  Radar,
  Database,
  FileCheck2,
  Headphones,
  BellRing,
  FileText,
  ArrowLeftRight,
  Receipt,
  ListChecks,
  BarChart3,
  BrainCircuit,
  Eye,
} from "lucide-react";
import { EASE, MaskReveal, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { TiltCard } from "./TiltCard";
import { SYSTEMS } from "./content";

const ICONS: Record<string, typeof Zap> = {
  "enquiry-response": Zap,
  "voice-agent": PhoneCall,
  "outreach-engine": Radar,
  "database-reactivation": Database,
  "proposal-engine": FileCheck2,
  "support-agent": Headphones,
  "status-agent": BellRing,
  "document-generation": FileText,
  "data-movement": ArrowLeftRight,
  "payment-follow-up": Receipt,
  reconciliation: ListChecks,
  "automatic-reporting": BarChart3,
  "knowledge-assistant": BrainCircuit,
  "monitoring-agents": Eye,
};

const CATEGORIES = ["All", ...Array.from(new Set(SYSTEMS.map((s) => s.category)))];

export function SystemsGrid() {
  const [filter, setFilter] = useState<string>("All");
  const reduced = useReducedMotionSafe();

  const visible = useMemo(
    () => (filter === "All" ? SYSTEMS : SYSTEMS.filter((s) => s.category === filter)),
    [filter]
  );

  const itemTransition = reduced ? { duration: 0 } : { duration: 0.35, ease: EASE };

  return (
    <section id="systems" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[880px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.14),transparent_68%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Pill>Example systems</Pill>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>Systems we&apos;ve built</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                for businesses like yours.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              A sample of what we&apos;ve built. Yours is scoped to your own process.
            </p>
          </MaskReveal>
        </div>

        {/* Filter chips */}
        <div className="mt-10 flex flex-wrap gap-2.5" role="group" aria-label="Filter systems by category">
          {CATEGORIES.map((cat) => {
            const active = filter === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(cat)}
                className={`rounded-full border px-4 py-2 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                    : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <motion.div layout transition={itemTransition} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((s) => {
              const Icon = ICONS[s.id] ?? Zap;
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={itemTransition}
                >
                  <TiltCard className="h-full">
                    <div className="flex h-full flex-col p-7">
                      <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 transition-transform duration-300 group-hover:-translate-y-1">
                        <Icon className="h-5 w-5 text-violet-300" />
                      </span>
                      <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                        {s.category}
                      </span>
                      <h3 className="mt-3.5 text-base font-semibold tracking-[-0.01em] text-white">
                        {s.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-zinc-500">{s.body}</p>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
