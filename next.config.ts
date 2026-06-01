import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bullmq"],
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  experimental: isProd && !isWindows ? {} : {
    // Workaround for Next.js build worker crash on Windows with Node.js 24
    workerThreads: false,
    cpus: 1,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
