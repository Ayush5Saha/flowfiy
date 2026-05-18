import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Flowfiy — AI-Powered B2B Sales Outreach Platform",
    template: "%s | Flowfiy",
  },
  description:
    "Flowfiy automates B2B outbound sales with 5 Claude AI agents. Research leads, score prospects 0–100, and send hyper-personalized cold emails — all at $0 per lead with your own Claude API key.",
  keywords: [
    "AI sales outreach",
    "B2B lead generation",
    "cold email automation",
    "Claude AI sales tool",
    "outbound sales software",
    "AI lead scoring",
    "personalized cold email",
    "BYOK sales platform",
    "sales prospecting tool",
    "AI SDR",
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
    locale: "en_US",
    url: BASE_URL,
    siteName: "Flowfiy",
    title: "Flowfiy — AI-Powered B2B Sales Outreach Platform",
    description:
      "5 Claude AI agents research leads, score prospects, and write personalized cold emails at $0 per lead. Connect Apollo, add your Claude key, start sending.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flowfiy — AI-Powered B2B Sales Outreach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowfiy — AI-Powered B2B Sales Outreach",
    description:
      "5 Claude AI agents for B2B outbound. Research, score, personalize, send. $0 per lead with BYOK.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Flowfiy",
  url: BASE_URL,
  logo: `${BASE_URL}/icon.svg`,
  description:
    "AI-powered B2B outbound sales platform with 5 Claude AI agents for lead research, qualification scoring, and personalized email outreach.",
  foundingDate: "2026",
  sameAs: [],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "AI-powered B2B sales outreach platform. 5 Claude AI agents research leads, score prospects 0–100, and generate personalized cold emails at $0 per lead (BYOK).",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier — 50 lead generations included",
  },
  featureList: [
    "AI ICP Analysis",
    "Apollo API Lead Discovery",
    "AI Company Research",
    "AI Qualification Scoring 0-100",
    "Claude AI Personalized Email Writing",
    "Gmail OAuth Sending",
    "BYOK Claude API",
    "Multi-tenant Workspaces",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
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
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
