"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE, Eyebrow, MaskReveal, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { PHASES } from "./content";

export function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionSafe();

  // The connecting line draws itself as the section passes through the viewport.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="timeline" className="relative bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Implementation</Eyebrow>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>Built and deployed</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                in about two days.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              Four phases, start to live. The timeline holds as long as your
              domains and inboxes are ready and approvals come back quickly.
            </p>
          </MaskReveal>
        </div>

        <div ref={ref} className="relative mt-16">
          {/* Track + progress line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/8 lg:left-0 lg:right-0 lg:top-[19px] lg:bottom-auto lg:h-px lg:w-auto" />
          {/* Two elements rather than one: a 1px line can only be revealed along
              its own axis, so the vertical (mobile) and horizontal (desktop)
              tracks each need their own scale. */}
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
            {PHASES.map((p, i) => (
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
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-white">
                  {p.title}
                </h3>
                <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-zinc-500">
                  {p.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>

        <motion.p
          className="mt-14 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 font-mono text-[12px] text-zinc-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          Total time to go live: about 2 days
        </motion.p>
      </div>
    </section>
  );
}
