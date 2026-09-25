"use client";

/**
 * Seamless horizontal auto-scroll strip, shared by the hero's task strip and
 * the closing "LET'S TALK" marquee. Duplicates its children once so the loop
 * has no visible seam, and collapses to a plain wrapped row — no transform,
 * no animation — under reduced motion.
 */

import type { ReactNode } from "react";
import { useReducedMotionSafe } from "@/components/landing/v2/motion";

export function Marquee({
  children,
  duration = 32,
  pauseOnHover = false,
  className = "",
  trackClassName = "",
}: {
  children: ReactNode;
  /** Seconds for one full loop of a single copy. */
  duration?: number;
  pauseOnHover?: boolean;
  className?: string;
  trackClassName?: string;
}) {
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`group overflow-hidden ${className}`}>
      <div
        className={`flex w-max shrink-0 items-center ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        } ${trackClassName}`}
        style={{ animation: `routcore-marquee ${duration}s linear infinite` }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes routcore-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
