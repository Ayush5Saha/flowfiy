import type { Metadata } from "next";
import { RoutcorePage } from "@/components/routcore/RoutcorePage";
import { FAQS, TIERS, DELIVERABLES } from "@/components/routcore/content";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const URL = `${BASE_URL}/routcore`;

const TITLE = "Routcore — Done-For-You AI Lead Generation & Outreach Systems";
const DESCRIPTION =
  "Routcore by Flowfiy builds and deploys a personalized AI lead generation and outreach system into your own environment in about two days. It finds prospects matching your ICP, writes to each one personally, and reaches them by email, AI voice call, LinkedIn and WhatsApp — every reply on one dashboard. Three tiers from ₹45,000 + ₹20,000/mo in India, or $2,000 + $200/mo internationally.";

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
    "A done-for-you AI lead generation and outreach system. Routcore defines your ideal customer profile, sources matching prospects online, writes a personalized message for every prospect, and reaches them by email, AI voice call, LinkedIn and WhatsApp — putting every send and reply on one unified dashboard. Built, tested and deployed into your own environment in about two days. Sold in three channel tiers, priced per region.",
  provider: { "@id": `${BASE_URL}/#organization` },
  areaServed: [
    { "@type": "Country", name: "India" },
    { "@type": "Place", name: "Worldwide" },
  ],
  // Each tier is offered at a region-specific price; the page only ever shows
  // one region's, but both belong in the structured data for search engines.
  offers: TIERS.flatMap((t) => [
    {
      "@type": "Offer",
      name: `Routcore — ${t.name} (India)`,
      price: String(t.priceValue.IN.setup),
      priceCurrency: "INR",
      description: `One-time build of ${t.price.IN.setup} plus a ${t.price.IN.retainer} per month retainer for ongoing operation and optimization.${
        t.hasVoice ? " Voice calling minutes billed separately at ₹6 per minute." : ""
      } 50% advance, 50% on delivery.`,
      eligibleRegion: { "@type": "Country", name: "India" },
      itemOffered: {
        "@type": "Service",
        name: `Routcore ${t.name}`,
        description: t.tagline,
      },
    },
    {
      "@type": "Offer",
      name: `Routcore — ${t.name} (International)`,
      price: String(t.priceValue.INTL.setup),
      priceCurrency: "USD",
      description: `One-time build of ${t.price.INTL.setup} plus a ${t.price.INTL.retainer} per month retainer for ongoing operation and optimization.${
        t.hasVoice ? " Voice calling minutes billed separately at about $0.07 per minute." : ""
      } 50% advance, 50% on delivery.`,
      itemOffered: {
        "@type": "Service",
        name: `Routcore ${t.name}`,
        description: t.tagline,
      },
    },
  ]),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "What's included",
    itemListElement: DELIVERABLES.map((d) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: d.title, description: d.body },
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
