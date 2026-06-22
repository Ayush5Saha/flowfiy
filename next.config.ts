import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isWindows = process.platform === "win32";

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
};

export default nextConfig;
