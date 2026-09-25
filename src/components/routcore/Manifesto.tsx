"use client";

/**
 * "Who we are" manifesto — one large statement whose words light up
 * (zinc-700 → white) as the block scrolls through the viewport, with a small
 * inline pill mid-sentence. Reduced motion collapses to a plain, fully-lit
 * paragraph — no scroll subscription, no per-word transforms.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Zap } from "lucide-react";
import { Counter, EASE, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { STATS } from "./content";

const BEFORE = "Routcore builds custom AI systems where every repeated task".split(" ");
const AFTER = "— answered, followed up and recorded — the same way, every hour of every day.".split(" ");
// +1 reserves a slot in the sequence for the inline pill between the two halves.
const TOTAL = BEFORE.length + 1 + AFTER.length;

function RevealWord({
  children,
  index,
  progress,
}: {
  children: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index / TOTAL;
  const end = (index + 1) / TOTAL;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  const color = useTransform(progress, [start, end], ["rgb(63,63,70)", "rgb(255,255,255)"]);
  return (
    <motion.span style={{ opacity, color }}>
      {children}{" "}
    </motion.span>
  );
}

function InlinePill() {
  return (
    <span className="mx-1 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 align-middle font-mono text-[0.4em] uppercase tracking-[0.15em] text-cyan-200">
      <Zap className="h-[1em] w-[1em]" />
      runs itself
    </span>
  );
}

export function Manifesto() {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "start 25%"],
  });

  return (
    <section id="about" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-4xl px-6 text-center sm:px-8">
        <Pill>Who we are</Pill>

        {reduced ? (
          <p className="mt-9 text-[clamp(1.6rem,3.6vw,2.75rem)] font-bold leading-[1.3] tracking-[-0.02em] text-white">
            Routcore builds custom AI systems where every repeated task <InlinePill /> — answered,
            followed up and recorded — the same way, every hour of every day.
          </p>
        ) : (
          <p
            ref={ref}
            className="mt-9 text-[clamp(1.6rem,3.6vw,2.75rem)] font-bold leading-[1.3] tracking-[-0.02em]"
          >
            {BEFORE.map((w, i) => (
              <RevealWord key={`b-${i}`} index={i} progress={scrollYProgress}>
                {w}
              </RevealWord>
            ))}
            <InlinePill />{" "}
            {AFTER.map((w, i) => (
              <RevealWord key={`a-${i}`} index={BEFORE.length + 1 + i} progress={scrollYProgress}>
                {w}
              </RevealWord>
            ))}
          </p>
        )}

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            >
              <p className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-[clamp(1.75rem,3.4vw,2.5rem)] font-black tracking-[-0.02em] text-transparent">
                {s.prefix}
                <Counter value={s.value} suffix={s.suffix} delay={0.1 + i * 0.08} />
              </p>
              <p className="mt-2 text-xs leading-snug text-zinc-500 sm:text-[13px]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
