"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE, MaskReveal } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { FAQS } from "./content";

export function RoutcoreFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-4xl px-6 sm:px-8">
        <div className="text-center">
          {/* Pill is inline-flex, so the parent's text-center centres it. */}
          <Pill>Questions</Pill>
          <h2 className="mt-5 font-black leading-[1.05] tracking-[-0.035em] text-white text-[clamp(2rem,3.6vw,3rem)]">
            <MaskReveal>Answered straight.</MaskReveal>
          </h2>
        </div>

        <div className="mt-14 border-t border-white/10">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const n = String(i + 1).padStart(2, "0");
            const panelId = `faq-panel-${n}`;
            const buttonId = `faq-button-${n}`;
            return (
              <motion.div
                key={f.q}
                className="border-b border-white/10"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.5, delay: Math.min(i, 4) * 0.05, ease: EASE }}
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="group flex w-full items-center gap-4 py-6 text-left transition-colors hover:bg-white/[0.02] sm:gap-6"
                >
                  <span
                    className={`shrink-0 font-mono text-[11px] tracking-[0.15em] transition-colors ${
                      isOpen ? "text-cyan-300" : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  >
                    [{n}]
                  </span>
                  <span className="flex-1 text-[15px] font-medium text-white sm:text-base">{f.q}</span>
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-90 border-violet-400/40 bg-violet-500/10 text-violet-300"
                        : "border-white/12 text-zinc-500 group-hover:border-white/25 group-hover:text-white"
                    }`}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pl-[3.1rem] pr-8 text-sm leading-relaxed text-zinc-400 sm:pl-[3.9rem]">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
