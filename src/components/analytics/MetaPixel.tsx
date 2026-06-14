"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a Meta Pixel PageView on client-side route changes. The base pixel,
 * initial PageView, and <noscript> fallback live inline in app/layout.tsx
 * (loaded in <head> for immediate, detectable init); this only adds the SPA
 * navigations the raw snippet would otherwise miss.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // The inline <head> script already tracked the initial PageView.
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
