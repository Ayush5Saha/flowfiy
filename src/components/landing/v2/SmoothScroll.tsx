"use client";

// Lenis smooth-scroll provider — the inertial scroll that gives the page its
// "expensive" feel. Disabled under reduced motion (native scroll preserved).
// framer-motion's useScroll/useInView keep working: Lenis scrolls the window
// and emits native scroll events on each frame.

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotionSafe } from "./motion";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    function frame(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // In-page anchor links (#pricing etc.) should ride Lenis, not jump.
    function onAnchorClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -80 });
    }
    document.addEventListener("click", onAnchorClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onAnchorClick);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
