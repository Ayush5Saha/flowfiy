"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { setConsent, getStoredConsent, CONSENT_REOPEN_EVENT } from "./cookie-consent-events";

/**
 * Bottom-anchored cookie consent banner.
 *
 * Shows automatically when the visitor hasn't made an explicit choice yet, and
 * can be reopened anytime via the `flowfiy-consent-reopen` event (footer link).
 * Accept / Reject persist the choice and tell <ConsentAnalytics /> to start or
 * stop loading Meta Pixel + Google Analytics. Cookie reads happen client-side
 * (in effects) so the root layout stays statically renderable.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);

  // Show on first load only if the user hasn't decided. Reading the cookie in
  // an effect (not during render) avoids hydration mismatches and keeps the
  // layout static. The delay lets it animate in without blocking first paint.
  useEffect(() => {
    if (getStoredConsent() === null) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Allow "Cookie preferences" links to reopen the banner.
  useEffect(() => {
    function reopen() {
      setOpen(true);
    }
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
  }, []);

  function choose(value: "granted" | "denied") {
    setConsent(value);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur shadow-2xl shadow-black/40 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="hidden sm:flex w-9 h-9 shrink-0 rounded-lg bg-violet-500/10 items-center justify-center">
              <Cookie className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
              We use cookies to keep you signed in and, with your consent, to measure
              traffic and improve our marketing. Essential cookies are always on.{" "}
              <Link href="/privacy#cookies" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
                Learn more
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => choose("denied")}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 border border-white/10 hover:bg-white/5 transition-colors"
            >
              Reject non-essential
            </button>
            <button
              onClick={() => choose("granted")}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
