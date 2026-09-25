"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE, MaskReveal } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { LEAKS } from "./content";

export function Challenge() {
  return (
    <section id="leaks" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      {/* Faint perspective grid floor — depth without a second GL context */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          transform: "perspective(420px) rotateX(62deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1100px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Pill>The problem</Pill>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>Where your business</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-zinc-500 to-zinc-700 bg-clip-text text-transparent">
                quietly leaks time.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              Six ways this shows up, day after day. Routcore removes all six.
            </p>
          </MaskReveal>
        </div>

        {/* Column labels — desktop only; rows carry their own label on mobile */}
        <div className="mt-14 hidden grid-cols-2 gap-8 px-7 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600 sm:grid">
          <span>What happens</span>
          <span>What it means</span>
        </div>

        <div className="mt-3 space-y-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:mt-4">
          {LEAKS.map((l, i) => (
            <motion.div
              key={l.n}
              className="group grid gap-3 bg-[#050508] p-7 transition-colors duration-300 hover:bg-[#0a0a12] sm:grid-cols-2 sm:gap-8"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.55, delay: i * 0.05, ease: EASE }}
            >
              <div className="flex items-start gap-4">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] tracking-[0.25em] text-zinc-600 transition-colors group-hover:text-violet-400">
                  {l.n}
                </span>
                <p className="text-[15px] font-semibold leading-snug text-white">{l.what}</p>
              </div>
              <div className="flex items-start gap-4">
                <ArrowRight className="mt-1 hidden h-3.5 w-3.5 shrink-0 text-zinc-700 sm:block" />
                <p className="text-sm leading-relaxed text-zinc-500">{l.means}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Turns the problem into the promise */}
        <motion.div
          className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/15 to-violet-600/10 p-7 sm:flex-row sm:items-center sm:p-8"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
        >
          <p className="text-base font-semibold leading-snug text-white sm:max-w-md">
            One system that takes on the repeated work — and runs it the same
            way, every time.
          </p>
          <a
            href="#areas"
            className="inline-flex w-fit shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:text-cyan-200"
          >
            See what we automate →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
