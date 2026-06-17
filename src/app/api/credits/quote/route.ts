import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { CREDIT_VALUE_INR, TOPUP_MIN_CREDITS, TOPUP_MAX_CREDITS } from "@/lib/credits/rates";
import { getCurrencyForCountry, convertFromInr, formatPrice } from "@/lib/currency";

// GET /api/credits/quote?credits=N&country=IN — live local-currency cost for N credits.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const credits = Math.round(Number(searchParams.get("credits") ?? "0"));
  const country = searchParams.get("country") ?? "IN";

  if (!Number.isFinite(credits) || credits <= 0) {
    return NextResponse.json({ error: "Invalid credit amount" }, { status: 400 });
  }
  const clamped = Math.max(TOPUP_MIN_CREDITS, Math.min(credits, TOPUP_MAX_CREDITS));
  const inr = clamped * CREDIT_VALUE_INR;
  const currency = getCurrencyForCountry(country);
  const localAmount = convertFromInr(inr, currency);

  return NextResponse.json({
    credits: clamped,
    inr,
    currency: currency.code,
    formatted: formatPrice(localAmount, currency),
    min: TOPUP_MIN_CREDITS,
    max: TOPUP_MAX_CREDITS,
    belowMin: credits < TOPUP_MIN_CREDITS,
    aboveMax: credits > TOPUP_MAX_CREDITS,
  });
}
