import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/**
 * Centralised rate limiting (Upstash sliding window).
 *
 * Brute-force / abuse protection for sensitive endpoints. The module is
 * fail-open: if Upstash isn't configured (e.g. local dev) or Redis is briefly
 * unreachable, requests are allowed rather than hard-failing the route.
 */

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface Limiter {
  limit(identifier: string): Promise<LimitResult>;
}

// Used when Upstash isn't configured — never blocks.
const allowAll: Limiter = {
  async limit() {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  },
};

function makeLimiter(limiter: ReturnType<typeof Ratelimit.slidingWindow>, prefix: string): Limiter {
  if (!redis) return allowAll;
  return new Ratelimit({ redis, limiter, analytics: true, prefix }) as unknown as Limiter;
}

// ── Limiters ──────────────────────────────────────────────────────────────────
/** General authenticated API calls. */
export const apiRateLimit = makeLimiter(Ratelimit.slidingWindow(60, "1 m"), "api");
/** Expensive AI generation runs. */
export const generationRateLimit = makeLimiter(Ratelimit.slidingWindow(5, "1 m"), "generation");
/** Account-sensitive mutations (password / email change). */
export const authRateLimit = makeLimiter(Ratelimit.slidingWindow(10, "15 m"), "auth");
/** Credential checks — admin / affiliate login. Tight to stop brute forcing. */
export const loginRateLimit = makeLimiter(Ratelimit.slidingWindow(8, "10 m"), "login");
/** Public unauthenticated forms — contact / bug report. Stops spam floods. */
export const contactRateLimit = makeLimiter(Ratelimit.slidingWindow(5, "10 m"), "contact");

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Best-effort client IP from proxy headers. */
export function getClientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    h.get("x-real-ip") ??
    h.get("cf-connecting-ip") ??
    h.get("x-vercel-forwarded-for") ??
    "unknown"
  );
}

/**
 * Enforce a limiter for `identifier`. Returns a ready-to-send 429 response when
 * the limit is exceeded, or `null` when the request may proceed.
 *
 *   const limited = await enforceRateLimit(contactRateLimit, getClientIp(req));
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  limiter: Limiter,
  identifier: string,
  message = "Too many requests. Please slow down and try again shortly."
): Promise<NextResponse | null> {
  try {
    const { success, reset } = await limiter.limit(identifier);
    if (success) return null;
    const retryAfter = reset ? Math.max(1, Math.ceil((reset - Date.now()) / 1000)) : 60;
    return NextResponse.json(
      { error: message },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  } catch {
    // Fail open — availability over strictness if Redis hiccups.
    return null;
  }
}
