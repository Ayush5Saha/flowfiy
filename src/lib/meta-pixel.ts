/**
 * Client-side Meta (Facebook) Pixel event helper.
 *
 * The base pixel + PageView is loaded by <ConsentAnalytics /> in the root
 * layout, but only after the visitor has consented (region-aware). Use this to
 * fire standard conversion events from client components. It is a safe no-op if
 * the pixel hasn't loaded (SSR, ad-blocker, no consent, fbq not ready).
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

export function trackMetaPixel(event: string, params?: MetaPixelParams): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}
