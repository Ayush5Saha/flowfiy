"use client";

import { motion } from "framer-motion";
import {
  EASE,
  Eyebrow,
  Lines,
  GlowButton,
  Counter,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";
import { EngineCanvas } from "./EngineCanvas";
import { ShaderField } from "./ShaderField";

const TICKER = [
  { value: 1247, suffix: "", label: "leads found today" },
  { value: 86, suffix: "", label: "in research" },
  { value: 312, suffix: "", label: "emails drafted" },
  { value: 47, suffix: "", label: "meetings booked this week" },
];

export function Hero() {
  const reduced = useReducedMotionSafe();

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#030305]"
    >
      {/* Living scene: WebGL aurora base + flowing data packets layered on top */}
      <div className="absolute inset-0">
        <ShaderField className="absolute inset-0" />
        <div className="absolute inset-0">
          <EngineCanvas />
        </div>
      </div>

      {/* Readability scrims — keep the headline crisp over the right-weighted aurora */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030305] via-[#030305]/85 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030305]/90 via-transparent to-[#030305]/40" />

      {/* Content — editorial, left-aligned in the left ~55% */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center px-6 pb-40 pt-32 sm:px-8">
        <div className="max-w-[58%] min-w-0 max-md:max-w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Eyebrow>Autonomous Outbound Engine</Eyebrow>
          </motion.div>

          <h1 className="mt-7 font-black leading-[0.95] tracking-[-0.04em] text-white text-[clamp(3rem,9vw,7.5rem)]">
            {/* Crawlable keyword context for the primary heading; visually hidden. */}
            <span className="sr-only">
              Flowfiy — the AI outbound sales &amp; lead generation platform that builds your B2B pipeline while you sleep.{" "}
            </span>
            <Lines text="Pipeline," delay={0.05} mode="mount" />
            {/* Static gradient fill — premium restraint, no animated gradient */}
            <span className="block overflow-hidden">
              <motion.span
                className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-500 bg-clip-text text-transparent will-change-transform"
                initial={reduced ? { opacity: 0 } : { y: "110%" }}
                animate={reduced ? { opacity: 1 } : { y: "0%" }}
                transition={{ duration: 0.9, delay: 0.13, ease: EASE }}
              >
                while you sleep.
              </motion.span>
            </span>
          </h1>

          <MaskReveal delay={0.32} className="mt-8" mode="mount">
            <p className="max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">
              Flowfiy is the AI outbound sales platform that finds your ideal
              customers, researches every one, writes cold outreach that lands,
              and books the meetings. You wake up to pipeline — not a to-do list.
            </p>
          </MaskReveal>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          >
            <GlowButton href="/signup" variant="primary">
              Start free — 100 leads on us
            </GlowButton>
            <GlowButton href="#story" variant="ghost">
              See how it works ↓
            </GlowButton>
          </motion.div>

          {/* Trust line — normal flow directly under the CTA row */}
          <motion.p
            className="mt-5 font-mono text-[11px] text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            No card required · BYOK or managed AI · Built on Claude
          </motion.p>
        </div>
      </div>

      {/* Scroll cue — bottom-center, above the ticker; hidden below lg */}
      {!reduced && (
        <div className="absolute bottom-28 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600 [writing-mode:vertical-rl]">
            scroll
          </span>
          <motion.span
            className="block h-12 w-px origin-top bg-gradient-to-b from-zinc-500 to-transparent"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* Live-stat ticker strip pinned to the hero's bottom edge */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-[#030305]/60 backdrop-blur-sm"
        initial={{ opacity: 0, y: reduced ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
      >
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center gap-x-2 gap-y-2 px-6 py-4 font-mono text-[12px] text-zinc-400 sm:px-8">
          <span className="relative mr-2 inline-flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          {TICKER.map((t, i) => (
            <span key={t.label} className="inline-flex items-center">
              {i > 0 && <span className="mx-3 text-zinc-700">·</span>}
              <span className="text-white">
                <Counter
                  value={t.value}
                  suffix={t.suffix}
                  mode="mount"
                  delay={0.85 + i * 0.08}
                />
              </span>
              <span className="ml-1.5 text-zinc-500">{t.label}</span>
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
