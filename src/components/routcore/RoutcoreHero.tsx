"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Phone } from "lucide-react";
import {
  EASE,
  Eyebrow,
  Lines,
  MaskReveal,
  Magnetic,
  useReducedMotionSafe,
} from "@/components/landing/v2/motion";
import { CoreCanvas } from "./CoreCanvas";
import { CONTACT } from "./content";

const SIGNALS = [
  "Sources prospects that match your ICP",
  "Writes a different email for every one",
  "Sends from up to 100 of your own inboxes",
  "Puts every reply on one dashboard",
];

export function RoutcoreHero() {
  const reduced = useReducedMotionSafe();

  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#030305]"
    >
      {/* The core itself — full-bleed behind the copy */}
      <div className="absolute inset-0">
        <CoreCanvas />
      </div>

      {/* Readability scrims — dark the middle, let the core breathe at the edges */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_66%_58%_at_50%_46%,rgba(3,3,5,0.80),transparent_76%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-[#030305]/55" />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-7 px-6 pb-36 pt-32 text-center sm:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Eyebrow>Flowfiy · Routcore</Eyebrow>
        </motion.div>

        <h1 className="font-black leading-[0.95] tracking-[-0.04em] text-white text-[clamp(2.5rem,6.5vw,4.75rem)]">
          <span className="sr-only">
            Routcore by Flowfiy — a done-for-you AI lead generation and outreach
            system, built and deployed into your own environment in about two
            days.{" "}
          </span>
          <Lines text="Your Always-On" delay={0.05} mode="mount" />
          <span className="block overflow-hidden">
            <motion.span
              className="block bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-500 bg-clip-text text-transparent will-change-transform"
              initial={reduced ? { opacity: 0 } : { y: "110%" }}
              animate={reduced ? { opacity: 1 } : { y: "0%" }}
              transition={{ duration: 0.9, delay: 0.13, ease: EASE }}
            >
              Lead Engine
            </motion.span>
          </span>
        </h1>

        <MaskReveal delay={0.3} mode="mount">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            <strong className="font-semibold text-zinc-200">
              Routcore is a done-for-you AI lead generation &amp; outreach
              system.
            </strong>{" "}
            We build it around your ideal customer, deploy it into your own
            environment, and hand you the keys — in about two days. It finds
            prospects, writes each email personally, and sends from your inboxes,
            around the clock.
          </p>
        </MaskReveal>

        <motion.div
          className="flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        >
          <Magnetic strength={10}>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="group relative inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-50 blur-lg transition-opacity duration-300 group-hover:opacity-90" />
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent" />
              <span className="relative z-10 inline-flex items-center gap-2">
                Book a discovery call
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </motion.a>
          </Magnetic>

          <Magnetic strength={8}>
            <motion.a
              href="#how-it-works"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="group relative inline-flex items-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
            >
              <span className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-300 group-hover:bg-white/5" />
              <span className="relative z-10">See how it works</span>
            </motion.a>
          </Magnetic>
        </motion.div>

        {/* Direct contact — the whole page exists to start a conversation */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[12px] text-zinc-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <a
            href={`mailto:${CONTACT.email}`}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-cyan-300"
          >
            <Mail className="h-3.5 w-3.5" />
            {CONTACT.email}
          </a>
          <span className="text-zinc-700">·</span>
          <a
            href={`tel:${CONTACT.phoneHref}`}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-cyan-300"
          >
            <Phone className="h-3.5 w-3.5" />
            {CONTACT.phone}
          </a>
        </motion.div>
      </div>

      {/* Signal strip pinned to the hero's bottom edge */}
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
          {SIGNALS.map((s, i) => (
            <span key={s} className="inline-flex items-center">
              {i > 0 && <span className="mx-3 text-zinc-700">·</span>}
              <span className="text-zinc-500">{s}</span>
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
