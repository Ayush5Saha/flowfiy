"use client";

import { CONSENT_COOKIE, CONSENT_MAX_AGE, type ConsentValue } from "@/lib/consent";

/** Dispatched on window when the user accepts/rejects, so the analytics loader
 *  can react without a page reload. */
export const CONSENT_CHANGE_EVENT = "flowfiy-consent-change";

/** Dispatched on window when something asks the banner to reopen (e.g. the
 *  "Cookie preferences" link in the footer). */
export const CONSENT_REOPEN_EVENT = "flowfiy-consent-reopen";

/** Persist the user's choice in a first-party cookie and notify listeners. */
export function setConsent(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_CHANGE_EVENT, { detail: value }));
}

/** Read the stored choice (client-side), or null if the user hasn't chosen. */
export function getStoredConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return value === "granted" || value === "denied" ? value : null;
}

/** Reopen the consent banner from anywhere (footer link, settings, etc.). */
export function reopenConsentBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT));
}
