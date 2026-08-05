"use client";

import { motion } from "framer-motion";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { CHALLENGES } from "./content";

export function Challenge() {
  return (
    <section id="challenge" className="relative overflow-hidden bg-[#030305] py-28 sm:py-36">
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

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>The challenge</Eyebrow>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>Every team running cold outreach</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-zinc-500 to-zinc-700 bg-clip-text text-transparent">
                hits the same five walls.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              The result is inconsistent pipeline and wasted spend. Routcore
              removes all five.
            </p>
          </MaskReveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((c, i) => (
            <motion.div
              key={c.n}
              className="group relative bg-[#050508] p-7 transition-colors duration-300 hover:bg-[#0a0a12] sm:p-8"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
            >
              <span className="font-mono text-[11px] tracking-[0.25em] text-zinc-600 transition-colors group-hover:text-violet-400">
                {c.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-white">
                {c.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{c.body}</p>
            </motion.div>
          ))}

          {/* Sixth cell closes the grid and turns the problem into the promise */}
          <motion.div
            className="relative flex flex-col justify-center bg-gradient-to-br from-indigo-600/15 to-violet-600/10 p-7 sm:p-8"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ duration: 0.6, delay: 0.36, ease: EASE }}
          >
            <p className="text-lg font-semibold leading-snug tracking-[-0.01em] text-white">
              One system that runs the entire outbound motion — and puts every
              send and every reply on a single dashboard.
            </p>
            <a
              href="#how-it-works"
              className="mt-5 inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:text-cyan-200"
            >
              See the engine →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
