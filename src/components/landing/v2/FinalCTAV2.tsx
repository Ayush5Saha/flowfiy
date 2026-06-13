"use client";

import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import {
  EASE,
  Lines,
  GlowButton,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";

// ── Convergence streams ────────────────────────────────────────
// Each stream: a thin gradient line/smear that originates at an edge and
// drifts inward toward the central glow. Implemented as absolutely-positioned
// motion.div elements with opacity pulse — no canvas, no deps.

const STREAMS = [
  // [angle deg, originX %, originY %, width px, length %, initial opacity]
  { id: 0, x1: 2,  y1: 15, x2: 50, y2: 50, w: 1,   op: 0.18 },
  { id: 1, x1: 98, y1: 10, x2: 50, y2: 50, w: 1.5, op: 0.14 },
  { id: 2, x1: 5,  y1: 75, x2: 50, y2: 50, w: 1,   op: 0.12 },
  { id: 3, x1: 95, y1: 80, x2: 50, y2: 50, w: 1,   op: 0.16 },
  { id: 4, x1: 50, y1: 2,  x2: 50, y2: 50, w: 1,   op: 0.10 },
  { id: 5, x1: 20, y1: 95, x2: 50, y2: 50, w: 1.5, op: 0.13 },
  { id: 6, x1: 80, y1: 93, x2: 50, y2: 50, w: 1,   op: 0.11 },
  { id: 7, x1: 0,  y1: 45, x2: 50, y2: 50, w: 1,   op: 0.09 },
];

function StreamLine({
  x1, y1, x2, y2, w, op, delay,
}: {
  x1: number; y1: number; x2: number; y2: number;
  w: number; op: number; delay: number;
}) {
  const reduced = useReducedMotionSafe();
  if (reduced) return null;

  // SVG has viewBox="0 0 100 100" so these coordinates are in viewBox units (0–100 = 0%–100%).
  const d = `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <motion.path
      d={d}
      stroke="url(#streamGrad)"
      strokeWidth={w}
      strokeLinecap="round"
      fill="none"
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{
        opacity: [0, op, op * 0.6, 0],
        pathLength: [0, 1, 1, 1],
      }}
      transition={{
        duration: 4.2,
        delay,
        repeat: Infinity,
        repeatDelay: 2.4 + delay * 0.3,
        ease: [0.4, 0, 0.6, 1],
      }}
    />
  );
}

// ── Logo tile with float/rotate anim ─────────────────────────
function LogoTile({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-white/10 backdrop-blur-sm shadow-[0_0_40px_-6px_rgba(99,102,241,0.4)]"
      animate={
        reduced
          ? {}
          : {
              y: [0, -6, 0],
              rotate: [0, 1.2, -0.8, 0],
            }
      }
      transition={{
        duration: 5.6,
        repeat: Infinity,
        ease: "easeInOut",
        repeatType: "mirror",
      }}
    >
      {/* Gradient sheen on tile */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent" />
      <Image
        src="/icon.svg"
        alt="Flowfiy"
        width={56}
        height={56}
        priority
        className="relative z-10 object-contain"
      />
    </motion.div>
  );
}

// ── Main section ───────────────────────────────────────────────
export function FinalCTAV2() {
  const reduced = useReducedMotionSafe();

  // Scroll-linked scale/tilt on the central content panel.
  // Section must be `relative` for useScroll target.
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // As the section scrolls through viewport: subtle scale 0.97→1→0.97, tilt 1°→0°→-1°
  const panelScale  = useTransform(scrollYProgress, [0, 0.4, 1], reduced ? [1, 1, 1] : [0.96, 1, 0.97]);
  const panelRotate = useTransform(scrollYProgress, [0, 0.4, 1], reduced ? [0, 0, 0] : [1.2, 0, -0.8]);

  // Second headline line gradient — inline span, not a <Lines> child,
  // because we need mixed rendering (plain + gradient per line).
  // We use Lines for the first line and a separate masked reveal for the gradient line.

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#030305] py-[clamp(6rem,12vw,11rem)]"
    >
      {/* ── Radial glow backdrop ────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className="h-[70vmax] w-[70vmax] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.13) 0%, rgba(139,92,246,0.07) 35%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Convergence SVG streams ─────────────────────────── */}
      {!reduced && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#6366F1" stopOpacity="0" />
              <stop offset="50%"  stopColor="#8B5CF6" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {STREAMS.map((s, i) => (
            <StreamLine key={s.id} {...s} delay={i * 0.55} />
          ))}
        </svg>
      )}

      {/* ── Central content panel ───────────────────────────── */}
      <div className="relative mx-auto flex w-full max-w-[1320px] justify-center px-6">
        <motion.div
          ref={panelRef}
          style={
            reduced
              ? {}
              : { scale: panelScale, rotate: panelRotate }
          }
          className="relative flex max-w-[640px] flex-col items-center gap-0 text-center"
        >
          {/* Logo tile */}
          <MaskReveal delay={0} className="mb-8">
            <LogoTile reduced={reduced} />
          </MaskReveal>

          {/* Eyebrow-style index mono label */}
          <MaskReveal delay={0.06}>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              05 — close
            </span>
          </MaskReveal>

          {/* Display headline */}
          <h2
            className="mt-6 font-black leading-[0.96] tracking-[-0.04em] text-white text-[clamp(2.4rem,5.5vw,4.2rem)]"
          >
            {/* Line 1 — plain white */}
            <span className="block">
              <Lines text={"Stop chasing leads."} delay={0.1} />
            </span>
            {/* Line 2 — indigo→violet gradient, separate masked reveal */}
            <span className="block overflow-hidden">
              <motion.span
                className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-violet-500 bg-clip-text text-transparent will-change-transform"
                initial={reduced ? { opacity: 0 } : { y: "110%" }}
                whileInView={reduced ? { opacity: 1 } : { y: "0%" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
              >
                Start waking up to them.
              </motion.span>
            </span>
          </h2>

          {/* Sub-copy */}
          <MaskReveal delay={0.36} className="mt-6">
            <p className="max-w-md text-base leading-relaxed text-zinc-400">
              Your first 100 leads are free. No card, no setup.
              First results in under 10 minutes.
            </p>
          </MaskReveal>

          {/* CTA row */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: reduced ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: 0.46, ease: EASE }}
          >
            <GlowButton href="/signup" variant="primary">
              Get started free →
            </GlowButton>
            <GlowButton href="#pricing" variant="ghost">
              See pricing
            </GlowButton>
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="mt-5 font-mono text-[11px] text-zinc-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            No card required · BYOK or managed AI · Built on Claude
          </motion.p>

          {/* Hairline base rule — editorial detail */}
          <motion.span
            className="mt-14 block h-px w-16 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          />
        </motion.div>
      </div>
    </section>
  );
}
