"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { PROVIDE, EXPECT } from "./content";

export function ProvideExpect() {
  return (
    <section id="scope" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">

          {/* What you provide */}
          <div>
            <Eyebrow>What you provide</Eyebrow>
            <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.03em] text-white text-[clamp(1.75rem,3vw,2.5rem)]">
              <MaskReveal>Four things from your side.</MaskReveal>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
              Short list, deliberately. Everything else is ours to build.
            </p>

            <ul className="mt-10 space-y-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
              {PROVIDE.map((p, i) => (
                <motion.li
                  key={p.title}
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
                    <div>
                      <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{p.body}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* What to expect */}
          <div>
            <Eyebrow>What to expect</Eyebrow>
            <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.03em] text-white text-[clamp(1.75rem,3vw,2.5rem)]">
              <MaskReveal>
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  Once it&apos;s live.
                </span>
              </MaskReveal>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-500">
              The state of your outbound the day after handover.
            </p>

            <ul className="mt-10 space-y-4">
              {EXPECT.map((e, i) => (
                <motion.li
                  key={e}
                  className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/[0.025] p-5"
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <span className="text-sm leading-relaxed text-zinc-300">{e}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-sm leading-relaxed text-zinc-400">
                <span className="font-medium text-zinc-200">An honest note.</span>{" "}
                Outreach performance depends on your offer, list quality, domain
                reputation and email infrastructure. We optimize continuously to
                improve results over time — but specific reply or meeting volumes
                are not guaranteed, and we won&apos;t pretend otherwise.
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
