"use client";

/**
 * A card that tilts in real 3D toward the cursor, with a specular sheen that
 * tracks the pointer. Pure CSS 3D transforms driven by springs — no 3D library.
 * Disabled on coarse pointers and under reduced motion, where it degrades to a
 * plain bordered card.
 */

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from "framer-motion";
import { useReducedMotionSafe } from "@/components/landing/v2/motion";

export function TiltCard({
  children,
  className = "",
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees on each axis. */
  max?: number;
}) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 180, damping: 20, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 180, damping: 20, mass: 0.5 });

  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  // Live template — recomputes on every spring frame, unlike a `.get()` read
  // baked into a style string at render time.
  const sheenX = useTransform(sx, (v) => `${(v * 100).toFixed(1)}%`);
  const sheenY = useTransform(sy, (v) => `${(v * 100).toFixed(1)}%`);
  const sheen = useMotionTemplate`radial-gradient(340px circle at ${sheenX} ${sheenY}, rgba(139,92,246,0.18), transparent 70%)`;

  useEffect(() => {
    const fine = typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches;
    setEnabled(!!fine && !reduced);
  }, [reduced]);

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div style={{ perspective: enabled ? 900 : undefined }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={
          enabled
            ? { rotateX, rotateY, transformStyle: "preserve-3d" }
            : undefined
        }
        className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/20"
      >
        {/* Specular sheen following the cursor */}
        {enabled && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ backgroundImage: sheen }}
          />
        )}
        {/* Top hairline accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative h-full" style={enabled ? { transform: "translateZ(24px)" } : undefined}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
