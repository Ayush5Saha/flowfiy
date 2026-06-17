"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  EASE,
  Eyebrow,
  Counter,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";

// ── ProofStrip ─────────────────────────────────────────────────
// Asymmetric stats band — NOT four equal centered cards.
// Layout: oversized hero stat (0-100) left-anchored, three smaller
// stats right of it, hairline vertical dividers between all four.
// ONE cyan signal dot on the 87 % stat only.
// Scroll parallax on the row (subtle, reduced-motion safe).

const STATS = [
  {
    value: 100,
    suffix: "",
    label: "Fit score on every lead, 0 to 100",
    hero: true,
    cyan: false,
  },
  {
    value: 5,
    suffix: "×",
    label: "Faster than doing it by hand",
    hero: false,
    cyan: false,
  },
  {
    value: 87,
    suffix: "%",
    label: "Weak-fit leads filtered out",
    hero: false,
    cyan: true, // ONE cyan signal accent — spec
  },
  {
    value: 10,
    suffix: " min",
    label: "To your first qualified leads",
    hero: false,
    cyan: false,
  },
] as const;

export function ProofStrip() {
  const reduced = useReducedMotionSafe();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-linked parallax — section MUST be position:relative for useScroll target.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // At most ±10px drift on the number row — kinetic without distracting.
  const rowY = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [0, 0] : [-10, 10],
  );

  return (
    <section
      ref={sectionRef}
      id="proof"
      aria-label="By the numbers"
      className="relative bg-[#050509]"
      style={{ position: "relative" }}
    >
      {/* Top & bottom hairlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent"
      />

      {/* Faint midpoint radial glow — prevents the band reading as pure flat black */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 50% 50%, rgba(99,102,241,0.035) 0%, transparent 68%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 py-[clamp(4rem,8vw,7rem)] sm:px-8">
        {/* Eyebrow — left-pinned, isolated above the grid */}
        <MaskReveal delay={0} className="mb-10 md:mb-14">
          <Eyebrow>By the numbers</Eyebrow>
        </MaskReveal>

        {/* Stat grid with gentle parallax */}
        <motion.div
          style={{ y: rowY }}
          className="grid grid-cols-12 items-end gap-y-10 md:gap-y-0"
        >
          {STATS.map((stat, i) => {
            const isHero = stat.hero;
            // Hero stat spans 5 cols, three smaller ones share remaining 7 (≈2-3 each)
            const colSpan = isHero
              ? "col-span-12 md:col-span-5"
              : i === 3
                ? "col-span-4 md:col-span-3"
                : "col-span-4 md:col-span-2";

            // Vertical hairline divider — CSS pseudo before every stat after the first,
            // on md+ only (stacks on mobile).
            const dividerClasses =
              i > 0
                ? "md:border-l md:border-white/[0.08] md:pl-8 lg:pl-10"
                : "";

            // Hero gets indigo→violet gradient text; cyan stat gets cyan-300;
            // others plain white.
            const numberColor = isHero
              ? "bg-gradient-to-br from-indigo-300 via-violet-300 to-violet-400 bg-clip-text text-transparent"
              : stat.cyan
                ? "text-cyan-300"
                : "text-white";

            // Staggered baseline on the three smaller stats — shift their baseline
            // so they sit at different heights (purely visual, no layout change).
            const baselineNudge =
              !isHero && i === 2
                ? "md:pb-4"
                : !isHero && i === 3
                  ? "md:pb-8"
                  : "";

            return (
              <div
                key={stat.label}
                className={`${colSpan} ${dividerClasses} ${baselineNudge} flex flex-col gap-3 pr-4 md:pr-6`}
              >
                {/* Mono index + optional cyan signal dot */}
                <MaskReveal delay={0.06 * i}>
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-zinc-700">
                    {stat.cyan && (
                      // ONE cyan pulse dot — marks the "signal" stat
                      <span className="relative inline-flex h-[6px] w-[6px] shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/55" />
                        <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-cyan-400" />
                      </span>
                    )}
                    0{i + 1}
                  </span>
                </MaskReveal>

                {/* Number */}
                <MaskReveal delay={0.08 + i * 0.07} y={90}>
                  <p
                    className={`font-black leading-none tracking-[-0.045em] ${numberColor} ${
                      isHero
                        ? "text-[clamp(4rem,9vw,7.5rem)]"
                        : "text-[clamp(2.8rem,5.5vw,4.6rem)]"
                    }`}
                    data-cursor="expand"
                  >
                    <Counter
                      value={stat.value}
                      suffix={stat.suffix}
                      duration={isHero ? 1.9 : 1.6}
                      delay={0.1 + i * 0.07}
                      mode="view"
                    />
                  </p>
                </MaskReveal>

                {/* Label */}
                <MaskReveal delay={0.14 + i * 0.07} y={60}>
                  <p
                    className={`font-mono uppercase tracking-[0.2em] text-zinc-500 ${
                      isHero ? "text-[12px] max-w-[22ch]" : "text-[11px] max-w-[18ch]"
                    }`}
                  >
                    {stat.label}
                  </p>
                </MaskReveal>
              </div>
            );
          })}
        </motion.div>

        {/* Footnote — right-aligned, mono, editorial detail */}
        <motion.p
          className="mt-12 text-right font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
        >
          Based on Flowfiy production data &amp; managed lead sources
        </motion.p>
      </div>
    </section>
  );
}
