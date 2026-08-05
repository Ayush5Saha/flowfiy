import type { Metadata } from "next";
import { RoutcorePage } from "@/components/routcore/RoutcorePage";
import { FAQS } from "@/components/routcore/content";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const URL = `${BASE_URL}/routcore`;

const TITLE = "Routcore — Done-For-You AI Lead Generation & Outreach Systems";
const DESCRIPTION =
  "Routcore by Flowfiy builds and deploys a personalized AI lead generation and outreach system into your own environment in about two days. It finds prospects matching your ICP, writes a personalized email for each one, and sends from up to 100 of your own inboxes — every reply on one dashboard. ₹45,000–₹80,000 + ₹20,000/mo in India, $2,500 + $300/mo international.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "done for you lead generation",
    "AI lead generation service",
    "AI cold outreach system",
    "cold email system setup",
    "outbound system build",
    "AI SDR system",
    "lead generation agency India",
    "cold email infrastructure setup",
    "multi-inbox email rotation",
    "Apollo Clay integration service",
    "AI outreach automation service",
    "B2B lead generation done for you",
    "personalized cold email at scale",
    "outbound engine build India",
    "Routcore",
    "Flowfiy Routcore",
  ],
  alternates: { canonical: "/routcore" },
  openGraph: {
    type: "website",
    url: URL,
    siteName: "Flowfiy",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Routcore by Flowfiy — done-for-you AI lead generation and outreach systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@flowfiy",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${BASE_URL}/opengraph-image`],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${URL}#service`,
  name: "Routcore — AI Lead Generation & Outreach System",
  serviceType: "AI lead generation and cold outreach system implementation",
  url: URL,
  description:
    "A done-for-you AI lead generation and outreach system. Routcore defines your ideal customer profile, sources matching prospects online, writes a personalized email for every prospect, sends from up to 100 of your own inboxes with automatic rotation, and puts every send and reply on one unified dashboard. Built, tested and deployed into your own environment in about two days.",
  provider: { "@id": `${BASE_URL}/#organization` },
  areaServed: [
    { "@type": "Country", name: "India" },
    { "@type": "Place", name: "Worldwide" },
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Routcore build & retainer — India",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: "45000",
        maxPrice: "80000",
        priceCurrency: "INR",
      },
      description:
        "One-time build of ₹45,000–₹80,000 scoped to requirements, plus a ₹20,000 per month retainer for ongoing operation and optimization. 50% advance, 50% on delivery.",
      eligibleRegion: { "@type": "Country", name: "India" },
    },
    {
      "@type": "Offer",
      name: "Routcore build & retainer — International",
      price: "2500",
      priceCurrency: "USD",
      description:
        "One-time build of $2,500 plus a $300 per month retainer for ongoing operation and optimization. 50% advance, 50% on delivery.",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "What's included",
    itemListElement: [
      "ICP definition & strategy",
      "Prospecting engine setup",
      "AI email personalization",
      "Up to 100 inbox connections with automatic rotation",
      "Unified sends-and-replies dashboard",
      "Apollo.io, Clay and other tool integrations",
      "24/7 autonomous operation",
      "Deployment into your own environment",
      "Training & handover",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Routcore() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <RoutcorePage />
    </>
  );
}
