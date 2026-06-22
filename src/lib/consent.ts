/**
 * Cookie-consent helpers shared by the server (root layout) and the client
 * (banner + analytics loader).
 *
 * Model: REGION-AWARE.
 *   • Visitors in the EU/EEA + UK get strict opt-in — no Meta Pixel or Google
 *     Analytics loads until they explicitly Accept.
 *   • Everywhere else, non-essential cookies load by default (implied consent),
 *     and the banner offers a one-click Reject that stops further tracking.
 *
 * The user's explicit choice is stored in the `flowfiy_consent` cookie and
 * always wins over the regional default.
 */

export const CONSENT_COOKIE = "flowfiy_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export type ConsentValue = "granted" | "denied";

/**
 * EU/EEA member states + the United Kingdom — the jurisdictions where
 * ePrivacy / GDPR / UK-GDPR require prior opt-in for analytics & advertising
 * cookies. ISO 3166-1 alpha-2 codes (uppercase).
 */
export const CONSENT_REQUIRED_COUNTRIES = new Set<string>([
  // EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // EEA (non-EU)
  "IS", "LI", "NO",
  // United Kingdom + Switzerland (FADP aligns with GDPR)
  "GB", "CH",
]);

/** True when prior opt-in is legally required for this visitor's country. */
export function isConsentRequiredRegion(country: string | null | undefined): boolean {
  if (!country) return false;
  return CONSENT_REQUIRED_COUNTRIES.has(country.toUpperCase());
}

/**
 * Resolve the effective consent state from the stored choice + the visitor's
 * region. An explicit cookie value always wins; otherwise we fall back to the
 * regional default (deny in opt-in regions, grant elsewhere).
 */
export function resolveConsent(
  cookieValue: string | null | undefined,
  country: string | null | undefined
): ConsentValue {
  if (cookieValue === "granted") return "granted";
  if (cookieValue === "denied") return "denied";
  return isConsentRequiredRegion(country) ? "denied" : "granted";
}
