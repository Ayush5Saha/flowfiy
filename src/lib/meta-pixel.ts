/**
 * Client-side Meta (Facebook) Pixel event helper.
 *
 * The base pixel + PageView is loaded by <MetaPixel /> in the root layout.
 * Use this to fire standard conversion events from client components. It is a
 * safe no-op if the pixel hasn't loaded (SSR, ad-blocker, fbq not ready).
 */

type MetaPixelParams = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_type?: string;
  predicted_ltv?: number;
  [key: string]: unknown;
};

export function trackMetaPixel(
  event: string,
  params?: MetaPixelParams,
  options?: { eventID?: string }
): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    // The 4th arg (eventID) lets Meta dedupe this against the matching
    // server-side Conversions API event sharing the same id.
    if (options?.eventID) {
      window.fbq("track", event, params, options);
    } else {
      window.fbq("track", event, params);
    }
  }
}
