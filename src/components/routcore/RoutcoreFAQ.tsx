"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { FAQS } from "./content";

export function RoutcoreFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
        <div className="text-center">
          {/* Eyebrow is inline-flex, so the parent's text-center centres it. */}
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.035em] text-white text-[clamp(2rem,3.6vw,3rem)]">
            <MaskReveal>Answered straight.</MaskReveal>
          </h2>
        </div>

        <div className="mt-14 space-y-3">
          {FAQS.map((f, i) => (
            <motion.div
              key={f.q}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.5, delay: Math.min(i, 4) * 0.05, ease: EASE }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-[15px] font-medium text-white">{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 ${
                    open === i ? "rotate-180 text-violet-400" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="border-t border-white/5 px-6 pb-6 pt-4 text-sm leading-relaxed text-zinc-400">
                      {f.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
