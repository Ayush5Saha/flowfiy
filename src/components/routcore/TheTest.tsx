"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { EASE, MaskReveal } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { TEST } from "./content";

export function TheTest() {
  return (
    <section id="test" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
        <div className="text-center">
          <Pill>Honest scoping</Pill>
          <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.035em] text-white text-[clamp(2rem,3.6vw,3rem)]">
            <MaskReveal>Not everything should be automated.</MaskReveal>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          <motion.div
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15">
              <Check className="h-5 w-5 text-cyan-300" />
            </span>
            <h3 className="mt-5 text-xl font-bold tracking-[-0.02em] text-white">
              {TEST.automate.label}
            </h3>
            <ul className="mt-5 space-y-3">
              {TEST.automate.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.04] p-8"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/15">
              <X className="h-5 w-5 text-violet-300" />
            </span>
            <h3 className="mt-5 text-xl font-bold tracking-[-0.02em] text-white">
              {TEST.human.label}
            </h3>
            <ul className="mt-5 space-y-3">
              {TEST.human.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          className="mt-8 text-center text-sm leading-relaxed text-zinc-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {TEST.footer}
        </motion.p>
      </div>
    </section>
  );
}
