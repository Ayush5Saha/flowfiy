import type { Metadata } from "next";
import { RoutcorePage } from "@/components/routcore/RoutcorePage";
import { FAQS, TIERS, DELIVERABLES } from "@/components/routcore/content";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const URL = `${BASE_URL}/routcore`;

const TITLE = "Routcore — Done-For-You AI Lead Generation & Outreach Systems";
const DESCRIPTION =
  "Routcore by Flowfiy builds and deploys a personalized AI lead generation and outreach system into your own environment in about two days. It finds prospects matching your ICP, writes to each one personally, and reaches them by email, AI voice call, LinkedIn and WhatsApp — every reply on one dashboard. Three tiers, quoted per engagement after a discovery call.";

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
    "A done-for-you AI lead generation and outreach system. Routcore defines your ideal customer profile, sources matching prospects online, writes a personalized message for every prospect, and reaches them by email, AI voice call, LinkedIn and WhatsApp — putting every send and reply on one unified dashboard. Built, tested and deployed into your own environment in about two days. Available in three tiers, quoted per engagement.",
  provider: { "@id": `${BASE_URL}/#organization` },
  areaServed: { "@type": "Place", name: "Worldwide" },
  // No `price` on these offers: pricing is quoted per engagement, and asserting
  // a figure in structured data that the page doesn't show would be misleading.
  offers: TIERS.map((t) => ({
    "@type": "Offer",
    name: `Routcore — ${t.name} (${t.channelLabel})`,
    availability: "https://schema.org/InStock",
    description: `${t.tagline} Quoted per engagement after a discovery call.${
      t.hasVoice ? " Voice calling minutes are billed separately on actual usage." : ""
    }`,
    itemOffered: {
      "@type": "Service",
      name: `Routcore ${t.name}`,
      description: t.tagline,
    },
  })),
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
