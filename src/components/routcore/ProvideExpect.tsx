"use client";

import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import { EASE, MaskReveal } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { NEEDS, PROMISE, DATA_PROMISE } from "./content";

export function ProvideExpect() {
  return (
    <section id="promise" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          {/* What we need from you */}
          <div>
            <Pill>What we need</Pill>
            <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.03em] text-white text-[clamp(1.75rem,3vw,2.5rem)]">
              <MaskReveal>Five things from your side.</MaskReveal>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
              Short list, deliberately. Everything else is ours to build.
            </p>

            <ul className="mt-10 space-y-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
              {NEEDS.map((need, i) => (
                <motion.li
                  key={need}
                  className="group bg-[#050508] p-6 transition-colors duration-300 hover:bg-[#0a0a12]"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-[11px] text-violet-300">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-zinc-300">{need}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* What we will — and won't — promise */}
          <div>
            <Pill>What we promise</Pill>
            <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.03em] text-white text-[clamp(1.75rem,3vw,2.5rem)]">
              <MaskReveal>
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  What we will — and won&apos;t.
                </span>
              </MaskReveal>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
              An honest line between what we can guarantee and what we can&apos;t.
            </p>

            <motion.div
              className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-7"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p className="text-sm leading-relaxed text-zinc-300">{PROMISE.body}</p>
            </motion.div>

            <ul className="mt-5 space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-zinc-400">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                Speed, coverage &amp; consistency — ours to deliver
              </li>
              <li className="flex items-start gap-2.5 text-sm text-zinc-400">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                Sales results — down to your offer &amp; your market, not just the system
              </li>
            </ul>
          </div>
        </div>

        {/* Data-handling strip */}
        <motion.div
          className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-7 sm:flex-row sm:items-center sm:p-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/15 to-indigo-500/10">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </span>
          <p className="text-sm leading-relaxed text-zinc-400">{DATA_PROMISE}</p>
        </motion.div>

        {/* Founders strip */}
        <motion.div
          className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center sm:flex-row sm:justify-center sm:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex -space-x-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#030305] bg-gradient-to-br from-cyan-400 to-indigo-500 text-sm font-bold text-white">
              AS
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#030305] bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
              YA
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Built by <span className="font-medium text-zinc-200">Ayush Saha</span> &amp;{" "}
            <span className="font-medium text-zinc-200">Yaswanth Alok</span>, co-founders of
            Flowfiy. You work with us directly.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
