import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that are always public — never need an auth check
function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/home" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/vs") ||
    pathname.startsWith("/use-cases") ||
    pathname.startsWith("/glossary") ||
    pathname.startsWith("/affiliates") ||
    pathname.startsWith("/founder") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/refund") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/changelog") ||
    pathname.startsWith("/sitemap") ||
    // Metadata routes that render public assets (OG/Twitter images) — must be
    // reachable by social + search crawlers, not gated behind auth.
    pathname.startsWith("/opengraph-image") ||
    pathname.startsWith("/twitter-image") ||
    pathname.startsWith("/api")
  );
}

// Routes only accessible when NOT logged in
function isAuthOnlyRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/forgot-password")
    // NOTE: /onboarding is intentionally NOT here — authenticated users
    // who haven't set up an org need to reach this page. The onboarding
    // page itself handles redirecting already-onboarded users to /dashboard.
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Fast path: public routes need zero auth work ──────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request });
  }

  // ── Build the Supabase client (needed for cookie refresh) ─────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          );
        },
      },
    }
  );

  // ── Fast session check (reads cookie, zero network calls) ─────────────────
  // getSession() decodes the JWT from the cookie locally — no round-trip to
  // Supabase. We use this for redirect decisions 99% of the time.
  // The Server Component layout will call getUser() (server-validated) for
  // real security checks and will also handle token refresh there.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // ── Token refresh: only call getUser() when token is close to expiry ──────
  // Access tokens are valid for 3600s (1 hour). Only hit Supabase's server
  // if the token expires within the next 5 minutes — this happens once/hour
  // maximum instead of on every single request.
  const expiresAt = session?.expires_at ?? 0; // Unix timestamp in seconds
  const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 300;
  if (expiresAt < fiveMinutesFromNow) {
    // Token is missing or expiring — refresh it (this is the network call)
    await supabase.auth.getUser();
  }

  // ── Redirect logic ────────────────────────────────────────────────────────

  // Logged-out user hitting a protected route → send to login
  if (!user && !isAuthOnlyRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in user hitting an auth-only route → send to dashboard
  if (user && isAuthOnlyRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
