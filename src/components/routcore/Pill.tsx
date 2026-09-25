"use client";

/**
 * Small rounded kicker chip shown above every section heading — the
 * modernmonke-style "OUR SERVICES" pill, restyled into the house dark theme.
 * Use in place of `Eyebrow` wherever the plan calls for a bordered pill.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE, useReducedMotionSafe } from "@/components/landing/v2/motion";

export function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <motion.span
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-cyan-300/90 backdrop-blur-sm sm:text-[11px] ${className}`}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
      {children}
    </motion.span>
  );
}
