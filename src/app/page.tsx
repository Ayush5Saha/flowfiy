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
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com"}/opengraph-image`,
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
    title: "Flowfiy — India's AI-Powered B2B Sales Outreach Platform",
    description:
      "5 Claude AI agents research, score, and write personalized outreach for every lead. India's AI outbound sales platform — starts free, plans from ₹1,700/mo.",
    images: [`${process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com"}/opengraph-image`],
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Flowfiy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Flowfiy is an AI-powered B2B outbound sales platform. You describe your ideal customer, and Flowfiy automatically finds matching leads, researches each company, scores prospects 0–100, and writes personalised cold emails — all without any manual work.",
      },
    },
    {
      "@type": "Question",
      name: "How does Flowfiy generate leads?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Flowfiy uses 5 specialised AI agents: an ICP Analyzer that maps your ideal customer profile, a Lead Discovery agent that searches 275M+ contacts via Apollo, a Company Analyzer that scrapes and reads each company's website, a Qualification Agent that scores each lead 0–100, and a Personalization Agent that writes a subject line, email body, and follow-ups for every qualified lead.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an Anthropic API key to use Flowfiy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. On paid plans, Claude AI is fully managed by Flowfiy — no API key needed. You can also bring your own Anthropic key (BYOK) on any plan if you prefer.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Flowfiy cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Flowfiy has a free plan with 100 lead generations per month. Paid plans start at ₹1,700/month (Indie), with Starter at ₹4,900/month, Growth at ₹9,900/month, and Agency at ₹24,900/month. All plans include a free trial.",
      },
    },
    {
      "@type": "Question",
      name: "How is Flowfiy different from Apollo or Clay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Apollo is a contact database — it finds leads but doesn't research them, score them, or write emails. Clay is a data enrichment workflow builder that requires significant setup. Flowfiy is a complete end-to-end pipeline: it discovers leads, researches each company, qualifies prospects with AI scoring, and generates personalised outreach — all in one platform with no setup required.",
      },
    },
    {
      "@type": "Question",
      name: "Is Flowfiy available in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Flowfiy is built for the Indian market with INR pricing, India-targeted lead sourcing, and full support for Indian business types. Plans start from ₹1,700/month.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPage />
    </>
  );
}