"use client";

// Bespoke cursor: a soft blend-mode dot that trails the pointer with spring lag,
// swells over interactive elements ([data-cursor], a, button), and hides the
// native cursor on fine-pointer devices. Disabled on touch + reduced motion.

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotionSafe } from "./motion";

export function Cursor() {
  const reduced = useReducedMotionSafe();
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const fine =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add("v2-cursor-none");

    function move(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = e.target as HTMLElement | null;
      setHot(!!el?.closest?.('a, button, [data-cursor], input, [role="button"]'));
    }
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("v2-cursor-none");
    };
  }, [reduced]);

  if (!enabled) return null;

  return (
    <>
      <style>{`.v2-cursor-none, .v2-cursor-none * { cursor: none !important; }`}</style>
      {/* outer ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] rounded-full border border-white/40 mix-blend-difference"
        style={{ x: sx, y: sy, width: 36, height: 36, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hot ? 1.7 : 1, opacity: hot ? 0.9 : 0.55 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      />
      {/* inner dot — tracks raw position (no lag) for precision */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] rounded-full bg-white mix-blend-difference"
        style={{ x, y, width: 6, height: 6, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hot ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </>
  );
}
