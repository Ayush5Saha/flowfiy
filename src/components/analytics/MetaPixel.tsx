"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1625820488509651";

/**
 * Re-fires PageView on client-side route changes. The base pixel + the initial
 * PageView are loaded inline in <head> (see app/layout.tsx) so the pixel is
 * present immediately and detectable by Meta's tools; this component only adds
 * the SPA navigations the raw snippet would otherwise miss, plus the <noscript>
 * fallback.
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

  if (!PIXEL_ID) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
