"use client";

import {
  motion,
  useScroll,
  useTransform,
  useAnimationFrame,
} from "framer-motion";
import { useRef, useState } from "react";
import {
  Eyebrow,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";

// ── Starfield ──────────────────────────────────────────────────
// Deterministic seeded pseudo-random (LCG) — stable across SSR and client renders
// so there's no hydration mismatch when the dots mount.

type Star = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

function lcgRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    s = s >>> 0;
    return s / 0xffffffff;
  };
}

const NUM_STARS = 38;
const STARS: Star[] = (() => {
  const rand = lcgRand(0xf1aacc77);
  return Array.from({ length: NUM_STARS }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 1.5,
    delay: rand() * 5,
    duration: 2.5 + rand() * 3,
  }));
})();

function StarField({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={
            reduced
              ? { opacity: 0.18 }
              : { opacity: [0.06, 0.5, 0.06] }
          }
          transition={
            reduced
              ? {}
              : {
                  duration: s.duration,
                  delay: s.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}

// ── MoonGlow ───────────────────────────────────────────────────
// ONE soft radial centred on the section that drifts very slowly.

function MoonGlow({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        width: "clamp(480px, 65vw, 960px)",
        height: "clamp(480px, 65vw, 960px)",
        top: "50%",
        left: "50%",
        background:
          "radial-gradient(ellipse at center, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.07) 40%, transparent 70%)",
      }}
      initial={{ x: "-50%", y: "-50%" }}
      animate={
        reduced
          ? { x: "-50%", y: "-50%", scale: 1 }
          : {
              x: ["-50%", "-46%", "-54%", "-50%"],
              y: ["-50%", "-54%", "-46%", "-50%"],
              scale: [1, 1.05, 1],
            }
      }
      transition={
        reduced
          ? {}
          : { duration: 20, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}

// ── PipelineRail ───────────────────────────────────────────────
// 5 stations + a framer-driven packet that travels left→right on a gentle loop.
// Reduced-motion: packet is hidden, stations are static.

const STATIONS = [
  { label: "Find",     glyph: "◉" },
  { label: "Research", glyph: "◎" },
  { label: "Write",    glyph: "◈" },
  { label: "Send",     glyph: "◆" },
  { label: "Book",     glyph: "◉" },
] as const;

function PipelineRail({ reduced }: { reduced: boolean }) {
  const progress = useRef(0);
  const [pct, setPct] = useState(0); // 0..1

  // Drive via useAnimationFrame — transform only, no layout thrash.
  // Full traverse = 9 s; the packet loops seamlessly.
  useAnimationFrame((_, delta) => {
    if (reduced) return;
    progress.current = (progress.current + delta / 9000) % 1;
    setPct(progress.current);
  });

  return (
    <div
      className="relative mx-auto w-full max-w-[600px]"
      aria-label="Flowfiy pipeline stages: Find · Research · Write · Send · Book"
    >
      {/* Track */}
      <div
        aria-hidden
        className="absolute top-[18px] h-px bg-white/[0.08]"
        style={{ left: 18, right: 18 }}
      />

      {/* Stations */}
      <div className="relative flex items-start justify-between">
        {STATIONS.map((s, i) => {
          // A station "lights up" once the packet has passed it.
          const frac = i / (STATIONS.length - 1);
          const lit = !reduced && pct >= frac - 0.01;
          return (
            <div key={s.label} className="flex flex-col items-center gap-[10px]">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border font-mono text-sm transition-colors duration-300"
                style={{
                  background: "#07060d",
                  borderColor: lit
                    ? "rgba(99,102,241,0.55)"
                    : "rgba(255,255,255,0.08)",
                  color: lit
                    ? "rgba(167,139,250,0.9)"
                    : "rgba(113,113,122,0.55)",
                }}
                data-cursor="true"
              >
                {s.glyph}
              </span>
              <span className="font-mono uppercase tracking-[0.18em] text-[10px] text-zinc-500">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Traveling packet — absolutely positioned over the track */}
      {!reduced && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-[14px]"
          style={{
            // map pct 0..1 → 18px (first station) .. calc(100% - 18px) (last station)
            left: `calc(18px + ${pct} * (100% - 36px))`,
            transform: "translateX(-50%)",
          }}
        >
          {/* glow halo */}
          <span
            className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/20 blur-[6px]"
          />
          {/* core */}
          <span className="relative block h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 shadow-[0_0_8px_2px_rgba(99,102,241,0.65)]" />
        </div>
      )}
    </div>
  );
}

// ── AlwaysOn ───────────────────────────────────────────────────

export function AlwaysOn() {
  const reduced = useReducedMotionSafe();
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-linked background shift — section must be position:relative.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // Dusk tint fades in as section enters, fades out as it exits.
  const duskOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0],
  );
  // Secondary darkening overlay peaks mid-scroll for a cinematic depth.
  const darkOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.55, 1],
    [0, 0.45, 0.45, 0],
  );

  return (
    <section
      id="always-on"
      ref={sectionRef}
      /* position:relative is required by useScroll({target}) */
      className="relative overflow-hidden bg-[#030305]"
    >
      {/* Dusk gradient layer */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, #070A18 0%, #060510 55%, #030305 100%)",
          opacity: duskOpacity,
        }}
      />
      {/* Darkening overlay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#020204]"
        style={{ opacity: darkOpacity }}
      />

      {/* Moon radial */}
      <MoonGlow reduced={reduced} />

      {/* Stars */}
      <StarField reduced={reduced} />

      {/* Hairline top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
      />

      {/* ── Main content ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col items-center px-6 py-[clamp(7rem,13vw,12rem)] sm:px-8">

        {/* Eyebrow — one per section */}
        <MaskReveal className="mb-8">
          <Eyebrow>Always Running</Eyebrow>
        </MaskReveal>

        {/* Display headline */}
        <h2
          className="text-center font-black leading-[0.94] tracking-[-0.04em] text-white"
          style={{ fontSize: "clamp(2.8rem,8vw,7rem)" }}
        >
          {/* Line 1 — white */}
          <span className="block overflow-hidden">
            <MaskReveal delay={0.04}>
              <span>Runs 24/7.</span>
            </MaskReveal>
          </span>
          {/* Line 2 — gradient */}
          <span className="block overflow-hidden">
            <MaskReveal delay={0.14}>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-500 bg-clip-text text-transparent">
                Zero human intervention.
              </span>
            </MaskReveal>
          </span>
        </h2>

        {/* Sub copy */}
        <MaskReveal delay={0.26} className="mt-8 max-w-[520px] text-center">
          <p className="text-base leading-relaxed text-zinc-400 sm:text-[1.0625rem]">
            While you sleep, Flowfiy is finding, researching, writing, and
            booking. You wake up to a full pipeline —{" "}
            <span className="text-zinc-300">not a full to-do list.</span>
          </p>
        </MaskReveal>

        {/* Pipeline rail */}
        <MaskReveal delay={0.4} className="mt-[clamp(3rem,6vw,5rem)] w-full">
          <PipelineRail reduced={reduced} />
        </MaskReveal>

        {/* Mono footnote */}
        <MaskReveal delay={0.52} className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600">
            Every night · Every timezone · Every lead
          </p>
        </MaskReveal>
      </div>

      {/* Hairline bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
      />
    </section>
  );
}
