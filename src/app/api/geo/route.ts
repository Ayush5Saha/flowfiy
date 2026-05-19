import { NextRequest, NextResponse } from "next/server";
import { getCurrencyForCountry } from "@/lib/currency";

/**
 * GET /api/geo
 *
 * Public endpoint — returns the visitor's detected country and currency.
 * Reads Vercel's automatic `x-vercel-ip-country` header (set on all Vercel
 * deployments, including Edge and Serverless functions).
 *
 * Falls back to "US" / USD if the header is absent (local dev, VPN, etc.).
 *
 * Response: { country: "IN", currency: "INR", symbol: "₹", locale: "en-IN" }
 */
export async function GET(req: NextRequest) {
  // Vercel injects this automatically — no external API needed
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ?? // Cloudflare fallback
    "US";

  const currency = getCurrencyForCountry(country);

  return NextResponse.json(
    {
      country,
      currency: currency.code,
      symbol: currency.symbol,
      locale: currency.locale,
      rateFromInr: currency.rateFromInr,
    },
    {
      headers: {
        // Cache geo for 1 hour per edge region — country rarely changes mid-session
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    }
  );
}
