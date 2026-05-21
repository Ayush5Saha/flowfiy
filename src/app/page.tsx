import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Flowfiy — AI-Powered B2B Sales Outreach Platform",
  description:
    "5 specialized Claude AI agents research your ICP, discover leads, analyze companies, qualify prospects, and write hyper-personalized outreach. Fully managed Claude Sonnet — no API key required.",
  keywords: [
    "AI sales outreach",
    "B2B lead generation",
    "AI SDR",
    "sales automation",
    "personalized cold email",
    "Claude AI sales",
    "outbound sales platform",
    "lead qualification AI",
    "AI-powered outbound platform",
    "sales pipeline automation",
  ],
  authors: [{ name: "Flowfiy" }],
  creator: "Flowfiy",
  publisher: "Flowfiy",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Flowfiy",
    title: "Flowfiy — AI-Powered B2B Sales Outreach Platform",
    description:
      "5 specialized AI agents research your ICP, discover leads, analyze companies, qualify prospects, and write hyper-personalized outreach. Fully managed Claude Sonnet — no API key required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flowfiy — AI-Powered Sales Outreach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowfiy — AI-Powered B2B Sales Outreach Platform",
    description:
      "5 Claude AI agents research, qualify, and write personalized outreach for every lead. Powered by Claude Sonnet — fully managed, no setup required.",
    images: ["/og-image.png"],
    creator: "@Flowfiy",
  },
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered B2B sales outreach platform that uses 5 specialized Claude AI agents to research leads, qualify prospects, and generate hyper-personalized outreach at scale.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description: "100 generations/month, 1 seat, 1 campaign",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "4900",
      priceCurrency: "INR",
      billingIncrement: "month",
      description: "2,500 generations/month, 1 seat, 5 campaigns",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "9900",
      priceCurrency: "INR",
      billingIncrement: "month",
      description: "7,500 generations/month, 5 seats, unlimited campaigns",
    },
    {
      "@type": "Offer",
      name: "Agency",
      price: "24900",
      priceCurrency: "INR",
      billingIncrement: "month",
      description: "Unlimited generations, 20 seats, unlimited campaigns",
    },
  ],
  featureList: [
    "ICP Analysis with Claude AI",
    "Apollo.io Lead Discovery",
    "Company Research via Apify",
    "AI Lead Qualification Scoring",
    "Hyper-Personalized Email Copy Generation",
    "Gmail Integration for Outreach",
    "Managed Claude Sonnet AI — No API Key Required",
    "Multi-tenant SaaS with AES-256 encryption",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}