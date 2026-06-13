"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  animate,
} from "framer-motion";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

// House easing — shared across every Phase A/B motion primitive.
export const EASE = [0.22, 1, 0.36, 1] as const;

// framer's useReducedMotion can return null during SSR/first paint; coerce to bool.
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}

// ── MaskReveal ────────────────────────────────────────────────
// Block rises from below inside an overflow-hidden clip when scrolled into view.
// Reduced motion → opacity-only fade, no transform.

export function MaskReveal({
  children,
  delay = 0,
  y = 110,
  once = true,
  className = "",
  mode = "view",
  duration = 0.9,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
  mode?: "view" | "mount";
  duration?: number;
}) {
  const reduced = useReducedMotionSafe();

  // The IntersectionObserver MUST watch the OUTER wrapper (full-size, visible),
  // never the inner translated child. The child starts at y:110% — fully clipped
  // out of the overflow-hidden parent — so observing it yields a zero-area rect
  // that never crosses the threshold and the reveal never fires. Watching the
  // wrapper is the only correct pattern for masked scroll reveals.
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px -12% 0px" });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const trigger = mode === "mount" ? mounted : inView;

  // Bulletproofing: content can never stay hidden. Once the reveal has been
  // TRIGGERED (scrolled into view / mounted), a stuck tween is force-completed
  // after its window elapses. The timer is armed by `trigger`, so it never
  // pre-empts a below-the-fold scroll reveal before the user reaches it.
  const [forceDone, setForceDone] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    const ms = (duration + 0.8) * 1000;
    const id = setTimeout(() => setForceDone(true), ms);
    return () => clearTimeout(id);
  }, [trigger, duration]);

  const shown = trigger || forceDone;

  if (reduced) {
    return (
      <span ref={ref} className={`block ${className}`}>
        <motion.span
          className="block"
          initial={{ opacity: 0 }}
          animate={{ opacity: shown ? 1 : 0 }}
          transition={{ duration: 0.6, delay }}
        >
          {children}
        </motion.span>
      </span>
    );
  }

  if (forceDone) {
    return (
      <span ref={ref} className={`block overflow-hidden ${className}`}>
        <span className="block" style={{ transform: "none" }}>
          {children}
        </span>
      </span>
    );
  }

  return (
    <span ref={ref} className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block will-change-transform"
        initial={{ y: `${y}%` }}
        animate={{ y: shown ? "0%" : `${y}%` }}
        transition={{ duration, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

// ── Lines ─────────────────────────────────────────────────────
// Splits text on \n into staggered MaskReveal lines — multi-line display headlines.

export function Lines({
  text,
  className = "",
  delay = 0,
  stagger = 0.08,
  mode = "view",
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  mode?: "view" | "mount";
}) {
  const lines = text.split("\n");
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <MaskReveal key={i} delay={delay + i * stagger} mode={mode}>
          {line}
        </MaskReveal>
      ))}
    </span>
  );
}

// ── Eyebrow ───────────────────────────────────────────────────
// Mono micro-label with a gradient tick that scales in from the left.

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <span
      className={`inline-flex items-center gap-3 font-mono uppercase tracking-[0.25em] text-[11px] text-cyan-300/90 ${className}`}
    >
      <motion.span
        className="h-px w-6 origin-left bg-gradient-to-r from-cyan-400 to-violet-500"
        initial={{ scaleX: reduced ? 1 : 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.7, ease: EASE }}
      />
      {children}
    </span>
  );
}

// ── Magnetic ──────────────────────────────────────────────────
// Pulls children toward the cursor within bounds (spring), settles back on leave.
// Disabled on touch + reduced motion.

export function Magnetic({
  children,
  strength = 8,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: fine)").matches;
    setEnabled(!!fine && !reduced);
  }, [reduced]);

  function onMove(e: ReactPointerEvent<HTMLSpanElement>) {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const max = strength;
    x.set(Math.max(-max, Math.min(max, dx * 0.35)));
    y.set(Math.max(-max, Math.min(max, dy * 0.35)));
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ x: enabled ? sx : 0, y: enabled ? sy : 0 }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

// ── GlowButton ────────────────────────────────────────────────
// Magnetic Link-pill. primary = indigo→violet gradient + outer glow + inner sheen;
// ghost = hairline border + white/5 hover fill. Both press to scale 0.98.

export function GlowButton({
  href,
  children,
  variant,
}: {
  href: string;
  children: ReactNode;
  variant: "primary" | "ghost";
}) {
  const isPrimary = variant === "primary";
  return (
    <Magnetic strength={10}>
      <motion.span
        className="inline-block"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <Link
          href={href}
          className={
            isPrimary
              ? "group relative inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white"
              : "group relative inline-flex items-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          }
        >
          {isPrimary && (
            <>
              {/* gradient fill */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              {/* outer glow — intensifies on hover */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-50 blur-lg transition-opacity duration-300 group-hover:opacity-90" />
              {/* inner top sheen */}
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent" />
            </>
          )}
          {!isPrimary && (
            <span className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-300 group-hover:bg-white/5" />
          )}
          <span className="relative z-10 inline-flex items-center gap-2">
            {children}
          </span>
        </Link>
      </motion.span>
    </Magnetic>
  );
}

// ── Counter ───────────────────────────────────────────────────
// Counts up once when scrolled into view. tabular-nums, locale-formatted.

export function Counter({
  value,
  suffix = "",
  duration = 1.6,
  delay = 0,
  mode = "view",
}: {
  value: number;
  suffix?: string;
  duration?: number;
  delay?: number;
  mode?: "view" | "mount";
}) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [display, setDisplay] = useState(0);

  // In "mount" mode the count-up starts immediately — no IntersectionObserver,
  // so above-the-fold counters can never stall at 0 because of an unfired
  // observer. In "view" mode it still waits to scroll into view.
  const started = mode === "mount" || inView;

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return () => controls.stop();
  }, [started, value, duration, delay, reduced]);

  // Bulletproofing: if the tween never ran (e.g. interrupted), snap to the final
  // value once its full window has elapsed. Cleaned up on unmount.
  useEffect(() => {
    if (!started || reduced) return;
    const ms = (delay + duration + 0.6) * 1000;
    const id = setTimeout(() => setDisplay(value), ms);
    return () => clearTimeout(id);
  }, [started, value, duration, delay, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Grain ─────────────────────────────────────────────────────
// Fixed full-page film-grain overlay — tiny inline feTurbulence data-URI tiled.

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
  );

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-overlay"
      style={{
        backgroundImage: `url("${GRAIN_SVG}")`,
        backgroundSize: "120px 120px",
      }}
    />
  );
}
