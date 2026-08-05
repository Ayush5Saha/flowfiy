"use client";

/**
 * Resolves which region's pricing a visitor should see.
 *
 * Uses the same /api/geo endpoint the billing and landing-page pricing already
 * rely on (it reads Vercel's x-vercel-ip-country header). India gets INR
 * pricing; everyone else gets USD.
 *
 * `resolved` stays false until the fetch lands, so the pricing section can hold
 * back the prices for a beat rather than flashing INR at a US visitor and then
 * swapping — a visible price changing under the reader is worse than a short
 * skeleton. Geo failures fall back to INTL, matching /api/geo's own default.
 *
 * The visitor can always override the detection; `setRegion` is the manual
 * toggle, which matters because VPNs and travel make IP geo unreliable.
 */

import { useEffect, useState } from "react";
import type { RegionKey } from "./content";

export function useRegion() {
  const [region, setRegion] = useState<RegionKey>("INTL");
  const [resolved, setResolved] = useState(false);
  const [autoDetected, setAutoDetected] = useState<RegionKey | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { country?: string } | null) => {
        if (cancelled) return;
        const detected: RegionKey = d?.country?.toUpperCase() === "IN" ? "IN" : "INTL";
        setRegion(detected);
        setAutoDetected(detected);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { region, setRegion, resolved, autoDetected };
}
