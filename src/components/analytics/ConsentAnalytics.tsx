"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_CHANGE_EVENT, getStoredConsent } from "./cookie-consent-events";
import { resolveConsent, type ConsentValue } from "@/lib/consent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

interface Props {
  metaPixelId: string;
  gaId: string;
}

/**
 * Loads Meta Pixel + Google Analytics ONLY when consent is granted, and keeps
 * them loaded for the rest of the session once they are. Replaces the always-on
 * inline pixel that used to live in <head>.
 *
 * Region resolution is done client-side so the root layout stays statically
 * renderable (no cookies()/headers()):
 *   • An explicit stored choice (granted/denied) is honoured immediately.
 *   • Undecided visitors are resolved against /api/geo (cached 1h) — EU/EEA/UK
 *     default to denied (opt-in), everywhere else defaults to granted.
 *
 * Also fires Meta Pixel / GA PageView on SPA route changes.
 */
export function ConsentAnalytics({ metaPixelId, gaId }: Props) {
  const [granted, setGranted] = useState(false);
  const loadedRef = useRef(false);
  const pathname = usePathname();

  // Resolve the effective consent on mount.
  useEffect(() => {
    const stored = getStoredConsent();
    if (stored === "granted") { setGranted(true); return; }
    if (stored === "denied") { setGranted(false); return; }

    // Undecided — fall back to the regional default once we know the country.
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { country?: string }) => {
        if (cancelled) return;
        // Re-check: the user may have clicked the banner while geo was loading.
        if (getStoredConsent() !== null) return;
        setGranted(resolveConsent(null, d.country) === "granted");
      })
      .catch(() => {
        // Geo unknown — be conservative-but-pragmatic: default to granted only
        // for the non-EU baseline (resolveConsent(null, null) === "granted").
        if (!cancelled && getStoredConsent() === null) setGranted(true);
      });
    return () => { cancelled = true; };
  }, []);

  // React to banner Accept/Reject without a reload.
  useEffect(() => {
    function onChange(e: Event) {
      const value = (e as CustomEvent<ConsentValue>).detail;
      setGranted(value === "granted");
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);

  // Inject the tracking scripts the first time consent is (or becomes) granted.
  useEffect(() => {
    if (!granted || loadedRef.current) return;
    loadedRef.current = true;

    // ── Meta Pixel ──────────────────────────────────────────────────────────
    if (metaPixelId && typeof window.fbq !== "function") {
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
      window.fbq?.("init", metaPixelId);
      window.fbq?.("track", "PageView");
    }

    // ── Google Analytics (gtag) ─────────────────────────────────────────────
    if (gaId && typeof window.gtag !== "function") {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", gaId);
    }
  }, [granted, metaPixelId, gaId]);

  // SPA route-change PageViews (skip the very first render — init already fired).
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (!granted) return;
    if (typeof window.fbq === "function") window.fbq("track", "PageView");
    if (gaId && typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: pathname });
    }
  }, [pathname, granted, gaId]);

  return null;
}
