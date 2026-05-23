import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Flowfiy — AI-Powered B2B Sales Outreach Platform India | AI Lead Generation",
  description:
    "India's AI outbound sales platform. 5 Claude AI agents research leads, score prospects 0–100, and write hyper-personalized cold emails. No SDR needed. Fully managed AI — starts free, plans from ₹1,700/mo.",
  keywords: [
    // Primary India-targeted
    "AI outbound sales platform India",
    "AI lead generation software India",
    "AI SDR platform India",
    "B2B lead generation AI India",
    "AI sales automation India",
    "cold email automation India",
    "outbound sales tool India",
    // Primary global
    "AI sales outreach",
    "AI lead generation software",
    "AI SDR",
    "B2B lead generation",
    "personalized cold email",
    "Claude AI sales tool",
    "outbound sales platform",
    // Long-tail
    "AI-powered B2B prospecting India",
    "automated lead generation India",
    "AI email outreach India",
    "best AI sales tool for startups India",
    "AI outreach tool for agencies India",
    "AI sales pipeline automation India",
    "AI-driven cold email India",
    "B2B outbound automation India",
  ],
  authors: [{ name: "Flowfiy" }],
  creator: "Flowfiy",
  publisher: "Flowfiy",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com"
  ),
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "en": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Flowfiy",
    title: "Flowfiy — India's AI-Powered B2B Sales Outreach Platform",
    description:
      "5 Claude AI agents research leads, score prospects 0–100, and write hyper-personalized cold emails. India's AI outbound sales platform — starts free, plans from ₹1,700/mo.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flowfiy — AI-Powered B2B Sales Outreach India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowfiy — India's AI-Powered B2B Sales Outreach Platform",
    description:
      "5 Claude AI agents research, score, and write personalized outreach for every lead. India's AI outbound sales platform — starts free, plans from ₹1,700/mo.",
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
  other: {
    "geo.region": "IN",
    "geo.placename": "India",
    "geo.position": "20.5937;78.9629",
    "ICBM": "20.5937, 78.9629",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "en-IN",
  description:
    "India's AI outbound sales platform — 5 Claude AI agents research leads, score prospects 0–100, and write hyper-personalized cold emails. Starts free, plans from ₹1,700/mo.",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "INR",
      description: "100 generations/month, 1 seat, 1 campaign",
    },
    {
      "@type": "Offer",
      name: "Indie",
      price: "1700",
      priceCurrency: "INR",
      billingIncrement: "month",
      description: "2,500 generations/month, 1 seat, 3 campaigns, BYOK",
    },
    {
      "@type": "Offer",
      name: "Starter",
      price: "4900",
      priceCurrency: "INR",
      billingIncrement: "month",
      description: "10,000 generations/month, 1 seat, 5 campaigns",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "9900",
      priceCurrency: "INR",
      billingIncrement: "month",
      description: "30,000 generations/month, 5 seats, unlimited campaigns",
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