"use client";

import { motion } from "framer-motion";
import {
  Target, Radar, Sparkles, Inbox, LayoutDashboard, Plug,
  Phone, MessageCircle, Infinity as InfinityIcon, Rocket,
  GraduationCap, TrendingUp,
} from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { TiltCard } from "./TiltCard";
import { DELIVERABLES } from "./content";

const ICONS = [
  Target, Radar, Sparkles, Inbox, LayoutDashboard, Plug,
  Phone, MessageCircle, InfinityIcon, Rocket,
  GraduationCap, TrendingUp,
];

export function Deliverables() {
  return (
    <section id="included" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.14),transparent_68%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>What&apos;s included</Eyebrow>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>Every deliverable.</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                One handover.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              Everything below is built, tested and deployed into your own
              environment — then handed to your team with documentation.
            </p>
          </MaskReveal>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DELIVERABLES.map((d, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.07, ease: EASE }}
              >
                <TiltCard className="h-full">
                  <div className="flex h-full flex-col p-7">
                    <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
                      <Icon className="h-5 w-5 text-violet-300" />
                    </span>
                    <h3 className="text-base font-semibold tracking-[-0.01em] text-white">
                      {d.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-zinc-500">
                      {d.body}
                    </p>
                    {/* Marks the deliverables that only ship on a higher tier,
                        so this list can't be read as "all of it, any price". */}
                    {d.tier && (
                      <span className="mt-3 inline-flex w-fit rounded-full border border-violet-400/25 bg-violet-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-violet-300">
                        {d.tier}
                      </span>
                    )}
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
