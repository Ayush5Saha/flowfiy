/**
 * Dynamic currency — maps a visitor's country to their local currency,
 * converts from the INR base price, and formats the result.
 *
 * Exchange rates are hardcoded approximations updated periodically.
 * The actual charge always happens in INR via Razorpay — this is display-only.
 */

export interface CurrencyConfig {
  code: string;       // ISO 4217 (USD, INR, AED, …)
  symbol: string;     // ₹, $, AED, £, €, S$
  locale: string;     // Intl locale string
  /** INR → this currency rate (1 INR = X local currency) */
  rateFromInr: number;
}

// ─── Country → Currency map ───────────────────────────────────────────────────
// Covers the top markets for Flowfiy. Everything else falls back to USD.

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // India
  IN: "INR",
  // Gulf / MENA
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  // Europe
  GB: "GBP",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  PT: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", SE: "EUR",
  NO: "EUR", DK: "EUR", PL: "EUR",
  // Asia-Pacific
  SG: "SGD", AU: "AUD", NZ: "NZD", JP: "JPY", KR: "KRW",
  // Americas
  CA: "CAD", BR: "BRL", MX: "MXN",
};

// ─── Currency configs ─────────────────────────────────────────────────────────
// Rates as of 2026 — update this periodically or plug in a live rates API.

export const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹",   locale: "en-IN", rateFromInr: 1       },
  USD: { code: "USD", symbol: "$",   locale: "en-US", rateFromInr: 0.01195 }, // 1 USD ≈ ₹83.7
  AED: { code: "AED", symbol: "AED", locale: "en-AE", rateFromInr: 0.04388 }, // 1 AED ≈ ₹22.8
  GBP: { code: "GBP", symbol: "£",   locale: "en-GB", rateFromInr: 0.00949 }, // 1 GBP ≈ ₹105.4
  EUR: { code: "EUR", symbol: "€",   locale: "de-DE", rateFromInr: 0.01101 }, // 1 EUR ≈ ₹90.8
  SGD: { code: "SGD", symbol: "S$",  locale: "en-SG", rateFromInr: 0.01607 }, // 1 SGD ≈ ₹62.2
  AUD: { code: "AUD", symbol: "A$",  locale: "en-AU", rateFromInr: 0.01833 }, // 1 AUD ≈ ₹54.6
  SAR: { code: "SAR", symbol: "SAR", locale: "ar-SA", rateFromInr: 0.04481 }, // 1 SAR ≈ ₹22.3
  CAD: { code: "CAD", symbol: "C$",  locale: "en-CA", rateFromInr: 0.01622 }, // 1 CAD ≈ ₹61.7
};

const DEFAULT_CURRENCY = "USD";

// ─── Public helpers ───────────────────────────────────────────────────────────

export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
  const code = COUNTRY_TO_CURRENCY[countryCode?.toUpperCase()] ?? DEFAULT_CURRENCY;
  return CURRENCIES[code] ?? CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Convert an INR amount to the target currency.
 * Rounds to the nearest "clean" number so prices look intentional:
 * e.g. 4900 INR → $58.55 → shown as $59
 */
export function convertFromInr(inrAmount: number, currency: CurrencyConfig): number {
  if (inrAmount === 0) return 0;
  const raw = inrAmount * currency.rateFromInr;

  // Round to nearest nice number based on magnitude
  if (raw >= 1000) return Math.round(raw / 50) * 50;
  if (raw >= 100)  return Math.round(raw / 5) * 5;
  if (raw >= 10)   return Math.round(raw);
  return Math.round(raw * 10) / 10;
}

/**
 * Format a converted price for display.
 * INR uses full Intl formatting (₹4,900), others use compact symbol prefix.
 */
export function formatPrice(amount: number, currency: CurrencyConfig): string {
  if (amount === 0) return "Free";

  if (currency.code === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // For most currencies: symbol + number, e.g. "$59", "AED 215", "£45"
  const formatted = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted;
}

export interface LocalisedPrice {
  amount: number;
  formatted: string;        // e.g. "$59"
  currency: CurrencyConfig;
  note: string;             // e.g. "Charged in INR (₹4,900)"
}

/**
 * Full localised price object for a given INR plan price.
 */
export function getLocalisedPrice(inrAmount: number, countryCode: string): LocalisedPrice {
  const currency = getCurrencyForCountry(countryCode);
  const amount = convertFromInr(inrAmount, currency);
  const formatted = formatPrice(amount, currency);

  const inrFormatted = inrAmount === 0 ? "Free" : new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(inrAmount);

  const note = currency.code === "INR"
    ? "Billed monthly in INR"
    : `Charged in INR (${inrFormatted}/mo)`;

  return { amount, formatted, currency, note };
}
