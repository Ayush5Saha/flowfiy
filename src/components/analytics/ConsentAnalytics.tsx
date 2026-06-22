"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_CHANGE_EVENT, getStoredConsent } from "./cookie-consent-events";
import { resolveConsent, type ConsentValue } from "@/lib/consent";

// Access the injected globals (fbq/gtag/dataLayer) through this cast rather than
// augmenting the global Window interface — keeps this component self-contained
// and immune to clashes with other global declarations.
type TrackingFn = (...args: unknown[]) => void;
type TrackingWindow = {
  fbq?: TrackingFn;
  _fbq?: unknown;
  dataLayer?: unknown[];
  gtag?: TrackingFn;
};
const trackingWindow = () => window as unknown as TrackingWindow;

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
        // Geo unknown — fall back to the non-EU baseline
        // (resolveConsent(null, null) === "granted").
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
    if (metaPixelId && typeof trackingWindow().fbq !== "function") {
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
      // Fresh read after the IIFE installs fbq.
      const fbq = trackingWindow().fbq;
      fbq?.("init", metaPixelId);
      fbq?.("track", "PageView");
    }

    // ── Google Analytics (gtag) ─────────────────────────────────────────────
    if (gaId && typeof trackingWindow().gtag !== "function") {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      const w = trackingWindow();
      w.dataLayer = w.dataLayer || [];
      const gtag: TrackingFn = function () {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag = gtag;
      gtag("js", new Date());
      gtag("config", gaId);
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
    const w = trackingWindow();
    if (typeof w.fbq === "function") w.fbq("track", "PageView");
    if (gaId && typeof w.gtag === "function") {
      w.gtag("event", "page_view", { page_path: pathname });
    }
  }, [pathname, granted, gaId]);

  return null;
}
