"use client";

import { reopenConsentBanner } from "./cookie-consent-events";

/**
 * A text button that reopens the cookie consent banner so users can change
 * their choice after the fact. Styled to blend into footer link lists.
 */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={reopenConsentBanner}
      className={className ?? "text-zinc-500 hover:text-zinc-200 transition-colors"}
    >
      Cookie preferences
    </button>
  );
}
