"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { EASE, MaskReveal } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { AREAS } from "./content";

export function AreasAccordion() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section id="areas" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-[1100px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Pill>What we automate</Pill>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>The 6 areas we</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                take off your team.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              We don&apos;t sell one-off bots. We build one system, around
              your business, working across whichever of these apply to you.
            </p>
          </MaskReveal>
        </div>

        <div className="mt-14 border-t border-white/10">
          {AREAS.map((area, i) => {
            const isOpen = open === i;
            const panelId = `area-panel-${area.n}`;
            const buttonId = `area-button-${area.n}`;
            return (
              <div key={area.n} className="border-b border-white/10">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="group flex w-full items-center gap-5 py-7 text-left transition-colors hover:bg-white/[0.02] sm:gap-8 sm:py-8"
                >
                  <span
                    className={`font-mono text-[13px] tracking-[0.15em] transition-colors sm:text-sm ${
                      isOpen ? "text-cyan-300" : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  >
                    [{area.n}]
                  </span>
                  <span
                    className={`flex-1 text-xl font-bold tracking-[-0.02em] transition-colors sm:text-2xl lg:text-3xl ${
                      isOpen ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                    }`}
                  >
                    {area.title}
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                        : "border-white/12 text-zinc-500 group-hover:border-white/25 group-hover:text-white"
                    }`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-6 pb-8 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-10 sm:pl-[4.5rem]">
                        <div>
                          <p className="max-w-lg text-base leading-relaxed text-zinc-400">{area.body}</p>
                          <ul className="mt-5 flex flex-wrap gap-2.5">
                            {area.points.map((p) => (
                              <li
                                key={p}
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-zinc-300"
                              >
                                <Check className="h-3 w-3 shrink-0 text-cyan-400" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <a
                          href="#contact"
                          className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[13px] font-medium text-zinc-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                        >
                          Talk about this
                          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
