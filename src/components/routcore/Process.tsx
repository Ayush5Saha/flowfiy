"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { EASE, MaskReveal, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { PROCESS, CONSULT_POINTS } from "./content";

export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();

  // The connecting line draws itself as the section passes through the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="process" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Pill>How we work</Pill>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>From first call to</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                live system, in four steps.
              </span>
            </MaskReveal>
          </h2>
        </div>

        <div ref={ref} className="relative mt-16">
          {/* Track + progress line */}
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

          <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
            {PROCESS.map((p, i) => (
              <motion.li
                key={p.n}
                className="relative pl-14 lg:pl-0 lg:pt-14"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12%" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              >
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-[#080810] font-mono text-[13px] font-semibold text-white">
                  <span aria-hidden className="absolute inset-0 rounded-full bg-violet-500/25 blur-md" />
                  <span className="relative z-10">{p.n}</span>
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-white">{p.title}</h3>
                <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-zinc-500">{p.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Highlighted consultation-call card */}
        <motion.div
          className="mt-14 grid gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/12 via-transparent to-violet-600/10 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-300">
              The consultation call
            </p>
            <h3 className="mt-3 max-w-lg text-2xl font-bold leading-snug tracking-[-0.02em] text-white sm:text-3xl">
              You walk away with a complete written plan — whether you build
              with us or not.
            </h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {CONSULT_POINTS.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#contact"
            className="group relative inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-50 blur-lg transition-opacity duration-300 group-hover:opacity-90" />
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent" />
            <span className="relative z-10 inline-flex items-center gap-2">
              Book your consultation call
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
