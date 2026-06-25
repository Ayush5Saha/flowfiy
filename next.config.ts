import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isWindows = process.platform === "win32";

// ─── Content Security Policy ──────────────────────────────────────────────────
// Whitelists the third parties the app actually talks to (Razorpay, Stripe,
// Supabase, Google OAuth/Fonts, Resend, Meta pixel) and locks everything else
// down. `frame-ancestors 'none'` is the real clickjacking guard.
//
// NOTE: script-src keeps 'unsafe-inline'/'unsafe-eval' because Next.js + framer
// inject inline bootstrap scripts; this can be tightened to a nonce-based policy
// later. Even so, object-src/base-uri/frame-ancestors/form-action close the
// high-impact vectors today.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://api.stripe.com https://*.googleapis.com https://accounts.google.com https://api.resend.com https://www.google-analytics.com https://*.facebook.com",
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bullmq"],
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  poweredByHeader: false,
  experimental: {
    // Tree-shake big barrel-import packages so a single `import { Icon }`
    // doesn't pull the whole library into the client bundle — smaller JS,
    // faster hydration on every page.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
    // Workaround for Next.js build worker crash on Windows with Node.js 24
    ...(isProd && !isWindows ? {} : { workerThreads: false, cpus: 1 }),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
