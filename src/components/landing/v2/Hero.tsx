"use client";

import { motion } from "framer-motion";
import {
  EASE,
  Eyebrow,
  Lines,
  Counter,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";
import { EngineCanvas } from "./EngineCanvas";
import { ShaderField } from "./ShaderField";
import { HeroLeadInput } from "./HeroLeadInput";
import { DemoVideoPlayer } from "./DemoVideo";

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

      {/* Readability scrims — darken behind the centered column, let the aurora breathe at the edges */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_60%_at_50%_44%,rgba(3,3,5,0.72),transparent_78%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-[#030305]/45" />

      {/* Content — centered single column: headline → subtext → input → video */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-7 px-6 pb-44 pt-32 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Eyebrow>Flowfiy · The AI Sales Engine</Eyebrow>
        </motion.div>

        <h1 className="font-black leading-[0.95] tracking-[-0.04em] text-white text-[clamp(2.5rem,6.5vw,4.75rem)]">
          {/* Crawlable keyword context for the primary heading; visually hidden. */}
          <span className="sr-only">
            Flowfiy — the AI sales engine: describe your service and it finds real businesses on Google Maps, researches and qualifies them, then sends personalized outreach from your Gmail.{" "}
          </span>
          <Lines text="The AI Sales Engine" delay={0.05} mode="mount" />
          {/* Static gradient fill — premium restraint, no animated gradient */}
          <span className="block overflow-hidden">
            <motion.span
              className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-500 bg-clip-text text-transparent will-change-transform"
              initial={reduced ? { opacity: 0 } : { y: "110%" }}
              animate={reduced ? { opacity: 1 } : { y: "0%" }}
              transition={{ duration: 0.9, delay: 0.13, ease: EASE }}
            >
              That Finds Your Customers
            </motion.span>
          </span>
        </h1>

        <MaskReveal delay={0.32} mode="mount">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            <strong className="font-semibold text-zinc-200">Flowfiy is an AI sales engine.</strong>{" "}
            Describe your service and ideal customer in plain English — even by
            condition, like &ldquo;restaurants with no website.&rdquo; Flowfiy finds
            real businesses on Google Maps, researches each one with AI, scores
            how much they need your service 0–100, and sends personalized
            outreach from your own Gmail. No API keys, no setup.
          </p>
        </MaskReveal>

        {/* Primary action — the "describe your leads" bar */}
        <div className="flex w-full justify-center">
          <HeroLeadInput />
        </div>

        {/* Demo video — directly below the input. Owns the #demo anchor.
            <figure> + <figcaption> give crawlers and answer/generative engines
            descriptive context for the embed (paired with the VideoObject JSON-LD). */}
        <motion.figure
          id="demo"
          className="mx-auto w-full max-w-2xl scroll-mt-24"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
        >
          <DemoVideoPlayer />
          <figcaption className="mt-3 text-sm text-zinc-500">
            Watch the ~3-minute walkthrough: describe your service, then Flowfiy
            finds real businesses on Google Maps, researches and qualifies each
            one, and sends personalized outreach from your Gmail.
          </figcaption>
        </motion.figure>

        {/* Trust line */}
        <p className="font-mono text-[11px] text-zinc-500">
          Fully managed AI · No API keys · You only pay for qualified leads
        </p>
      </div>

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
