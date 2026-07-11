import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ConsentAnalytics } from "@/components/analytics/ConsentAnalytics";
import { CookieConsent } from "@/components/analytics/CookieConsent";
import { SignupConversionTracker } from "@/components/analytics/SignupConversionTracker";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
// .trim() guards against a stray space in the env var, which produces an
// invalid id like "1625820488509651 " and makes fbq('init') silently fail.
const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "1625820488509651").trim();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Flowfiy — The AI Sales Engine",
    template: "%s | Flowfiy",
  },
  description:
    "Flowfiy is an AI sales engine that finds real businesses on Google Maps, researches each one, and scores them 0–100 by how much they need your service — then sends personalized outreach from your Gmail. No API keys, fully managed AI. One plan: $50/mo for 400 credits.",
  keywords: [
    // Primary — AI sales engine positioning
    "AI sales engine",
    "Google Maps lead generation",
    "find businesses on Google Maps",
    "AI lead qualification",
    "AI lead qualification software",
    "personalized outreach",
    "AI that finds customers for your service",
    "describe your service and get leads",
    // Target categories
    "AI lead generation",
    "AI lead generation software",
    "AI prospecting tool",
    "B2B lead generation software",
    "AI sales intelligence",
    "sales intelligence platform",
    "AI business search",
    "AI company research",
    "natural language lead generation",
    "business search AI",
    "condition-based targeting",
    // India-specific
    "AI sales engine India",
    "Google Maps lead generation India",
    "B2B lead generation software India",
    "AI lead generation India",
    "best AI sales tool India",
    "AI outreach tool for startups India",
    "AI sales automation India",
    // Long-tail
    "AI-driven sales pipeline",
    "automated B2B lead discovery",
    "AI-powered B2B prospecting",
    "AI SDR software",
    "AI sales prospecting tool",
    "cold email alternative",
    // Platform-specific
    "AI SaaS for lead generation",
    "AI automation for agencies",
    "AI-powered outreach for startups",
    "managed AI sales tool",
    "AI lead scoring software",
    "AI sales pipeline automation",
  ],
  authors: [{ name: "Flowfiy" }],
  creator: "Flowfiy",
  publisher: "Flowfiy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Flowfiy",
    title: "Flowfiy — The AI Sales Engine",
    description:
      "Flowfiy finds real businesses on Google Maps, researches each one, and scores them 0–100 by how much they need your service — then sends personalized outreach from your Gmail. No API keys. One plan: $50/mo for 400 credits.",
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Flowfiy — the AI sales engine that finds, researches, and qualifies leads from Google Maps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@flowfiy",
    creator: "@flowfiy",
    title: "Flowfiy — The AI Sales Engine",
    description:
      "Flowfiy finds real businesses on Google Maps, researches and qualifies each one 0–100 by how much they need your service, then sends personalized outreach from your Gmail. $50/mo for 400 credits.",
    images: [`${BASE_URL}/opengraph-image`],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-IN": BASE_URL,
      "en": BASE_URL,
    },
  },
  other: {
    "geo.region": "IN",
    "geo.placename": "India",
    "geo.position": "20.5937;78.9629",
    "ICBM": "20.5937, 78.9629",
  },
  icons: {
    // PNG icons — required for Google Search, browsers, and PWA
    icon: [
      { url: "/favicon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/favicon-192x192.png",sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png",sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/favicon.ico" },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Flowfiy",
  alternateName: "Flowfiy AI",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon-192x192.png`,
  image: `${BASE_URL}/opengraph-image`,
  description:
    "Flowfiy is an AI sales engine that finds real businesses on Google Maps, researches each one, qualifies them by how much they need your service, and sends personalized outreach — all from a plain-English description of who you sell to.",
  slogan: "The AI sales engine that finds your next customer on Google Maps.",
  foundingDate: "2026",
  areaServed: { "@type": "Country", name: "India" },
  knowsAbout: [
    "AI sales engine",
    "Google Maps lead generation",
    "AI lead qualification",
    "AI lead generation",
    "AI lead generation software",
    "B2B lead generation software",
    "AI sales intelligence",
    "Sales intelligence platform",
    "AI business search",
    "AI company research",
    "Natural language lead generation",
    "AI prospecting tool",
    "AI-personalized outreach",
    "AI sales development representatives (SDR)",
    "Sales prospecting automation",
    "Lead qualification scoring",
    "Condition-based lead targeting",
  ],
  address: { "@type": "PostalAddress", addressCountry: "IN" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${BASE_URL}/contact`,
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [
    "https://twitter.com/flowfiy",
    "https://linkedin.com/company/flowfiy",
    "https://github.com/flowfiy",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "Flowfiy",
  url: BASE_URL,
  description:
    "Flowfiy is an AI sales engine that finds real businesses on Google Maps, researches each one, qualifies them by how much they need your service, and sends personalized outreach — all from a plain-English description of who you sell to.",
  inLanguage: "en-IN",
  publisher: { "@id": `${BASE_URL}/#organization` },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "Flowfiy is an AI sales engine that finds real businesses on Google Maps, researches each one, qualifies them by how much they need your service, and sends personalized outreach — all from a plain-English description of who you sell to. Fully managed AI, no API keys. One plan: $50/month for 400 credits.",
  offers: [
    {
      "@type": "Offer",
      price: "50",
      priceCurrency: "USD",
      description: "$50/month for 400 credits (~600–800 leads). No API keys — fully managed AI.",
    },
  ],
  featureList: [
    "Finds real businesses on Google Maps",
    "AI company research on every lead",
    "Need-based qualification scoring 0–100",
    "AI-personalized outreach sent from your Gmail",
    "Describe leads in plain English",
    "Condition-based targeting (no website, bad reviews, slow site)",
    "B2B people-database discovery",
    "Gmail OAuth Sending",
    "Fully managed AI — no API keys",
    "Credit-based metering",
    "Multi-tenant Workspaces",
    "AI SDR Automation",
    "B2B Lead Generation India",
  ],
  inLanguage: "en-IN",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans min-h-screen`}
      >
        {children}
        {/* Consent-gated tracking — resolves region client-side (keeps pages
            static) and loads Meta Pixel + GA only when consent allows. */}
        <ConsentAnalytics metaPixelId={META_PIXEL_ID} gaId={GA_ID} />
        <SignupConversionTracker />
        <CookieConsent />
      </body>
    </html>
  );
}
