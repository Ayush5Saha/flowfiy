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

export function trackMetaPixel(event: string, params?: MetaPixelParams): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}
