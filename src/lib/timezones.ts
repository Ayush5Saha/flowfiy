/**
 * Timezone-Aware Send Scheduling
 *
 * Maps country codes and city hints to IANA timezone strings, and provides
 * a helper to check whether the current moment is within the allowed send
 * window (08:00 – 18:00 local time) for a given timezone.
 *
 * This prevents Flowfiy from sending cold emails at 3 AM local time, which
 * hurts deliverability, reply rates, and the sender's reputation.
 */

// ── Country → IANA timezone (primary timezone for the country) ───────────────

const COUNTRY_TIMEZONE: Record<string, string> = {
  // South Asia
  IN: "Asia/Kolkata",
  PK: "Asia/Karachi",
  BD: "Asia/Dhaka",
  LK: "Asia/Colombo",
  NP: "Asia/Kathmandu",

  // Middle East
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  QA: "Asia/Qatar",
  KW: "Asia/Kuwait",
  BH: "Asia/Bahrain",
  OM: "Asia/Muscat",
  EG: "Africa/Cairo",
  IL: "Asia/Jerusalem",

  // Europe
  GB: "Europe/London",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  NL: "Europe/Amsterdam",
  SE: "Europe/Stockholm",
  NO: "Europe/Oslo",
  DK: "Europe/Copenhagen",
  FI: "Europe/Helsinki",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  PL: "Europe/Warsaw",
  CH: "Europe/Zurich",
  AT: "Europe/Vienna",
  BE: "Europe/Brussels",
  CZ: "Europe/Prague",
  HU: "Europe/Budapest",
  RO: "Europe/Bucharest",
  GR: "Europe/Athens",
  UA: "Europe/Kiev",

  // North America
  US: "America/New_York",
  CA: "America/Toronto",
  MX: "America/Mexico_City",

  // South America
  BR: "America/Sao_Paulo",
  AR: "America/Argentina/Buenos_Aires",
  CO: "America/Bogota",
  CL: "America/Santiago",

  // Asia Pacific
  SG: "Asia/Singapore",
  MY: "Asia/Kuala_Lumpur",
  ID: "Asia/Jakarta",
  TH: "Asia/Bangkok",
  VN: "Asia/Ho_Chi_Minh",
  PH: "Asia/Manila",
  HK: "Asia/Hong_Kong",
  TW: "Asia/Taipei",
  JP: "Asia/Tokyo",
  KR: "Asia/Seoul",
  CN: "Asia/Shanghai",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",

  // Africa
  ZA: "Africa/Johannesburg",
  NG: "Africa/Lagos",
  KE: "Africa/Nairobi",
  GH: "Africa/Accra",
  ET: "Africa/Addis_Ababa",
};

// ── Default send window ───────────────────────────────────────────────────────

const SEND_WINDOW_START_HOUR = 8;   // 08:00 local
const SEND_WINDOW_END_HOUR   = 18;  // 18:00 local

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Resolve an IANA timezone from either an explicit timezone string or
 * a country code fallback. Returns "UTC" if neither is available.
 */
export function resolveTimezone(
  timezone: string | null | undefined,
  countryCode: string | null | undefined
): string {
  if (timezone && isValidTimezone(timezone)) return timezone;
  if (countryCode) {
    const tz = COUNTRY_TIMEZONE[countryCode.toUpperCase()];
    if (tz) return tz;
  }
  return "UTC";
}

/**
 * Returns the IANA timezone for a country code, or "UTC" if unknown.
 */
export function getTimezoneForCountry(countryCode: string): string {
  return COUNTRY_TIMEZONE[countryCode.toUpperCase()] ?? "UTC";
}

/**
 * Returns true if the current moment falls within the send window
 * (08:00 – 18:00) in the provided IANA timezone.
 *
 * If the timezone string is invalid, falls back to UTC (fails open so
 * emails aren't blocked forever on bad data).
 */
export function isInSendWindow(
  timezone: string,
  now: Date = new Date()
): boolean {
  try {
    // Use Intl.DateTimeFormat to get the local hour in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const localHour = parseInt(formatter.format(now), 10);
    return localHour >= SEND_WINDOW_START_HOUR && localHour < SEND_WINDOW_END_HOUR;
  } catch {
    // Invalid timezone string — allow send rather than silently dropping emails
    return true;
  }
}

/**
 * Milliseconds from `now` until the send window (08:00) next opens in the given
 * timezone. Returns 0 if already inside the window. Used to DEFER an email to
 * the next valid window instead of failing it.
 */
export function msUntilSendWindow(timezone: string, now: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
    const minutesNow = hour * 60 + minute;
    const startMinutes = SEND_WINDOW_START_HOUR * 60;
    const endMinutes = SEND_WINDOW_END_HOUR * 60;

    if (minutesNow >= startMinutes && minutesNow < endMinutes) return 0;
    const deltaMinutes =
      minutesNow < startMinutes
        ? startMinutes - minutesNow
        : 24 * 60 - minutesNow + startMinutes; // after window → 08:00 next day
    return deltaMinutes * 60 * 1000;
  } catch {
    return 0;
  }
}

/**
 * Validates that a string is a real IANA timezone identifier.
 * Uses Intl.DateTimeFormat — works in Node.js without any external library.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the local time string in a timezone for logging / debugging.
 */
export function getLocalTimeString(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return "??:??";
  }
}
