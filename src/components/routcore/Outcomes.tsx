"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  Gauge,
  TrendingUp,
  ClipboardCheck,
  Workflow,
  ShieldCheck,
  Repeat,
  Bot,
  Ban,
} from "lucide-react";
import { EASE, MaskReveal, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { OUTCOMES, GROWTH_FLOW } from "./content";

const ICONS: Record<string, typeof Clock> = {
  "always-on": Clock,
  "frees-team": Sparkles,
  "nothing-forgotten": CheckCircle2,
  "same-standard": Gauge,
  "scales-without-hiring": TrendingUp,
  "everything-recorded": ClipboardCheck,
  "built-around-you": Workflow,
  "stay-in-control": ShieldCheck,
};

// Positional, matched by index to GROWTH_FLOW (short, fixed-length list, so
// index-matching is simpler here than an id-keyed map).
const FLOW_ICONS = [Repeat, Bot, TrendingUp, Ban];

export function Outcomes() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="outcomes" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.14),transparent_68%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Pill>What you get</Pill>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>One system.</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Working every hour of every day.
              </span>
            </MaskReveal>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.map((o, i) => {
            const Icon = ICONS[o.id] ?? Sparkles;
            return (
              <motion.div
                key={o.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-white/20"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.06, ease: EASE }}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
                  <Icon className="h-5 w-5 text-violet-300" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-white">
                  {o.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{o.body}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Growth-flow diagram */}
        <div className="mt-20">
          <p className="mb-10 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            How growth changes
          </p>

          <div ref={ref} className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/8 lg:left-0 lg:right-0 lg:top-[19px] lg:bottom-auto lg:h-px lg:w-auto" />
            <motion.div
              aria-hidden
              className="absolute left-[19px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-cyan-400 via-indigo-500 to-violet-500 lg:hidden"
              style={reduced ? undefined : { scaleY: lineScale }}
            />
            <motion.div
              aria-hidden
              className="absolute left-0 right-0 top-[19px] hidden h-px origin-left bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 lg:block"
              style={reduced ? undefined : { scaleX: lineScale }}
            />

            <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
              {GROWTH_FLOW.map((step, i) => {
                const Icon = FLOW_ICONS[i] ?? Repeat;
                return (
                  <motion.li
                    key={step.title}
                    className="relative pl-14 lg:pl-0 lg:pt-14 lg:text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-12%" }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                  >
                    <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[#080810] lg:left-1/2 lg:-translate-x-1/2">
                      <span aria-hidden className="absolute inset-0 rounded-full bg-violet-500/25 blur-md" />
                      <Icon className="relative z-10 h-4 w-4 text-white" />
                    </span>
                    <h3 className="text-base font-semibold tracking-[-0.01em] text-white">
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed lg:mx-auto lg:max-w-[15rem] ${
                        step.emphasize
                          ? "bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-2xl font-black tracking-[-0.02em] text-transparent"
                          : "text-zinc-500"
                      }`}
                    >
                      {step.detail}
                    </p>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
