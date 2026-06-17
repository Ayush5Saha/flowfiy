import type { Metadata } from "next";
import { LandingPageV2 } from "@/components/landing/v2/LandingPageV2";

export const metadata: Metadata = {
  title: "Flowfiy — Describe the Leads You Want, AI Finds & Writes the Outreach",
  description:
    "Describe the leads you want in plain English — Flowfiy finds matching businesses, scores each 0–100, and writes personalized cold emails sent from your Gmail. Target by conditions like 'coffee shops with no website'. No API keys. $50/mo for 400 credits.",
  keywords: [
    // Primary
    "AI outbound sales platform",
    "AI lead generation software",
    "AI SDR",
    "B2B lead generation",
    "AI sales automation",
    "cold email automation",
    "outbound sales tool",
    "personalized cold email",
    "describe leads in plain English",
    "condition-based lead targeting",
    // Differentiators
    "find businesses with no website",
    "find leads by qualitative conditions",
    "AI lead scoring software",
    "automated lead research",
    "AI cold email writer",
    "Gmail cold outreach automation",
    // Long-tail
    "AI-powered B2B prospecting",
    "automated lead generation",
    "AI email outreach",
    "best AI sales tool for startups",
    "AI outreach tool for agencies",
    "AI sales pipeline automation",
    "no API key lead generation",
    "B2B outbound automation",
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
    title: "Flowfiy — Describe the Leads You Want, AI Finds & Writes the Outreach",
    description:
      "Describe the leads you want in plain English — Flowfiy finds, qualifies, and writes personalized outreach sent from your Gmail. Target by conditions like 'dentists with bad reviews'. $50/mo for 400 credits.",
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
    title: "Flowfiy — Describe the Leads You Want, AI Finds & Writes the Outreach",
    description:
      "Describe your ideal leads in plain English — Flowfiy finds, qualifies, and writes personalized outreach for every prospect. $50/mo for 400 credits, no API keys.",
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
  inLanguage: "en",
  description:
    "Describe the leads you want in plain English — Flowfiy finds matching businesses, researches and scores each 0–100, and writes personalized cold emails plus follow-ups sent from your own Gmail. No API keys. $50/month for 400 credits.",
  offers: [
    {
      "@type": "Offer",
      name: "Flowfiy",
      price: "50",
      priceCurrency: "USD",
      billingIncrement: "month",
      description: "400 credits per month (about 600–800 leads). Fully managed AI and data sources, condition-based targeting, lead scoring, personalized emails, and Gmail sending. Extra credits via top-ups anytime. Billed in local currency.",
    },
  ],
  featureList: [
    "Describe your ideal leads in plain English",
    "Smart clarifying questions when a search needs them",
    "Condition-based targeting (e.g. coffee shops with no website, SaaS that recently raised)",
    "Automated company and prospect research",
    "AI lead qualification scoring 0–100",
    "Personalized cold emails and follow-ups",
    "Send from your own Gmail after review",
    "Fully managed AI and data sources — no API keys",
  ],
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
        text: "Flowfiy is an AI outbound sales platform. You describe the leads you want in plain English, and Flowfiy finds matching businesses and people, researches each one, scores prospects 0–100, writes personalized cold emails and follow-ups, and sends them from your own Gmail after you review.",
      },
    },
    {
      "@type": "Question",
      name: "How does Flowfiy generate leads?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Just describe who you want to reach in plain English. Flowfiy asks smart clarifying questions when a search needs them, then finds matching businesses and people, researches each one, scores them 0–100, and writes a subject line, email body, and follow-ups for every qualified lead. The AI and data sources are fully managed — no API keys or per-tool setup.",
      },
    },
    {
      "@type": "Question",
      name: "Can I find leads by specific conditions, not just category and location?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — condition-based targeting is a core feature. You can search for qualitative conditions like 'coffee shops with no website', 'dentists with bad reviews', 'shops with a slow or outdated site', or 'SaaS that recently raised', not just category plus location.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need any API keys to use Flowfiy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The AI and all data sources are fully managed by Flowfiy — there are no API keys to bring and no per-tool setup. You connect your Gmail to send the outreach, and that's it.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Flowfiy cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Flowfiy is one simple plan: $50/month for 400 credits, which is about 600–800 leads (it varies by search). You only pay for qualified leads, so an empty search costs nothing. Subscribers can buy extra credits via top-ups anytime. It's billed in your local currency, including rupees in India.",
      },
    },
    {
      "@type": "Question",
      name: "How do credits work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Credits power your searches — about 2 leads per credit on average, varying by search. The $50/month plan includes 400 credits, and you only spend credits on qualified leads. If you run out, subscribers can top up extra credits anytime. There is no free tier, so new accounts subscribe to start.",
      },
    },
    {
      "@type": "Question",
      name: "How is Flowfiy different from a contact database or enrichment tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most contact databases just hand you a list and enrichment tools require heavy workflow setup. Flowfiy is end-to-end: you describe the leads you want in plain English — including qualitative conditions like 'coffee shops with no website' — and it finds them, researches each company, scores prospects with AI, writes personalized outreach, and sends it from your Gmail. No setup, no API keys.",
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
      <LandingPageV2 />
    </>
  );
}