import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GoogleAnalytics } from "@next/third-parties/google";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Flowfiy — Your AI Sales Team",
    template: "%s | Flowfiy",
  },
  description:
    "Your AI sales team. Flowfiy's 5 Claude AI agents find leads, research their business, score them 0–100, and send hyper-personalized cold emails — all on autopilot. No SDR needed. Starts free. Plans from ₹1,700/mo.",
  keywords: [
    // Primary
    "AI outbound sales platform",
    "AI lead generation software",
    "AI SDR platform",
    "B2B lead generation AI",
    "AI sales automation",
    "outbound sales automation tool",
    "AI sales outreach",
    "cold email automation software",
    // India-specific
    "AI outbound sales platform India",
    "B2B lead generation software India",
    "AI lead generation India",
    "cold email automation India",
    "best AI sales tool India",
    "AI outreach tool for startups India",
    "AI sales automation India",
    "outbound sales tool India",
    // Long-tail
    "AI-powered cold emailing",
    "AI-driven sales pipeline",
    "automated B2B lead discovery",
    "AI email sequence generator",
    "AI-powered B2B prospecting",
    "personalized cold email AI",
    "AI SDR software",
    "AI sales prospecting tool",
    // Platform-specific
    "AI SaaS for lead generation",
    "AI automation for agencies",
    "AI-powered outreach for startups",
    "Claude AI sales tool",
    "B2B outbound automation",
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
    title: "Flowfiy — AI-Powered B2B Sales Outreach Platform India",
    description:
      "5 Claude AI agents research leads, score prospects 0–100, and write hyper-personalized cold emails. India's AI outbound sales platform. Plans from ₹1,700/mo.",
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Flowfiy — Find leads, write emails, close deals automatically",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@flowfiy",
    creator: "@flowfiy",
    title: "Flowfiy — AI-Powered B2B Sales Outreach India",
    description:
      "5 Claude AI agents for B2B outbound. Research, score, personalize, send. India's AI outbound sales platform — starts free, plans from ₹1,700/mo.",
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
  name: "Flowfiy",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon-192x192.png`,
  description:
    "India's AI-powered B2B outbound sales platform with 5 Claude AI agents for lead research, qualification scoring, and personalized email outreach.",
  foundingDate: "2026",
  addressCountry: "IN",
  sameAs: [
    "https://twitter.com/flowfiy",
    "https://linkedin.com/company/flowfiy",
    "https://github.com/flowfiy",
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "India's AI outbound sales platform. 5 Claude AI agents research leads, score prospects 0–100, and generate personalized cold emails. Starts free — plans from ₹1,700/mo.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "Free tier — 100 AI lead generations/month",
    },
    {
      "@type": "Offer",
      price: "1700",
      priceCurrency: "INR",
      description: "Indie plan — 2,500 generations/month",
    },
    {
      "@type": "Offer",
      price: "4900",
      priceCurrency: "INR",
      description: "Starter plan — 10,000 generations/month",
    },
  ],
  featureList: [
    "AI ICP Analysis",
    "Apollo API Lead Discovery",
    "AI Company Research",
    "AI Qualification Scoring 0-100",
    "Claude AI Personalized Email Writing",
    "Gmail OAuth Sending",
    "BYOK Claude API",
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans min-h-screen`}
      >
        {children}
        <MetaPixel />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
