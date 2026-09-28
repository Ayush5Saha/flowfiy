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
// Meta pixel delivery. Besides *.facebook.com, the pixel's own config
// (connect.facebook.net/signals/config/<pixel id>) sends events to these two
// gateway hosts; if Meta changes them, the new hosts show up in the browser
// console as connect-src violations. Larger pixel events are posted through a
// hidden form + iframe to www.facebook.com/tr, which is why frame-src and
// form-action allow www.facebook.com too. Without those, every pixel event was
// silently dropped and Meta Pixel Helper reported no pixel at all.
const META_PIXEL_GATEWAYS =
  "https://fh-118116076e9a4c2a96a99fbb70bea2a0.ecs.us-west-2.on.aws https://bded8a3c6ae-1-1053047382554.us-central1.run.app";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://api.stripe.com https://*.googleapis.com https://accounts.google.com https://api.resend.com https://www.google-analytics.com https://*.facebook.com ${META_PIXEL_GATEWAYS}`,
  "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://www.youtube-nocookie.com https://www.youtube.com https://www.facebook.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.razorpay.com https://www.facebook.com",
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
