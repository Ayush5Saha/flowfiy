import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/blog",
          "/vs",
          "/use-cases",
          "/contact",
          "/privacy",
          "/terms",
          "/refund",
          "/signup",
          "/login",
        ],
        disallow: [
          "/dashboard",
          "/leads",
          "/campaigns",
          "/integrations",
          "/billing",
          "/settings",
          "/api/",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}