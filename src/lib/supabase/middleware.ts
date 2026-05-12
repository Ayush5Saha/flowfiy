import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Never intercept API routes — let route handlers return proper JSON responses
  if (url.pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  const isAuthRoute =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/demo") ||
    url.pathname.startsWith("/forgot-password") ||
    url.pathname.startsWith("/onboarding");

  const isLandingPage = url.pathname === "/" || url.pathname === "/home";

  const isMarketingRoute =
    url.pathname.startsWith("/about") ||
    url.pathname.startsWith("/blog") ||
    url.pathname.startsWith("/vs") ||
    url.pathname.startsWith("/use-cases") ||
    url.pathname.startsWith("/privacy") ||
    url.pathname.startsWith("/terms") ||
    url.pathname.startsWith("/refund") ||
    url.pathname.startsWith("/contact") ||
    url.pathname.startsWith("/changelog") ||
    url.pathname.startsWith("/sitemap");

  // Redirect unauthenticated users to login for all protected routes
  if (!user && !isAuthRoute && !isLandingPage && !isMarketingRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
