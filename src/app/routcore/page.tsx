import type { Metadata } from "next";
import { RoutcorePage } from "@/components/routcore/RoutcorePage";
import { FAQS, SYSTEMS } from "@/components/routcore/content";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const URL = `${BASE_URL}/routcore`;

// The root layout's title template ("%s | Flowfiy") appends the suffix —
// including it here too would double it in the rendered <title>.
const TITLE = "Routcore — Custom AI Automation Systems for Your Business";
const DESCRIPTION =
  "Routcore by Flowfiy builds custom AI systems that take repeated work off your team — instant enquiry replies, lead follow-up, AI voice agents, customer support, invoicing, data entry and reporting — running 24/7 without extra hires. Book a consultation call for a written automation plan.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "AI automation agency India",
    "custom AI systems for business",
    "business process automation",
    "AI workflow automation",
    "AI agents for business",
    "WhatsApp automation for business",
    "AI voice agent",
    "customer support automation",
    "lead follow-up automation",
    "invoice and payment reminder automation",
    "done for you AI automation",
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
        alt: "Routcore by Flowfiy — custom AI automation systems for your business",
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
  name: "Routcore — Custom AI Systems & Workflows",
  serviceType: "AI business process automation",
  url: URL,
  description:
    "Routcore builds one custom AI system around how a business already runs — instant enquiry replies, lead follow-up, AI voice agents, customer support, admin and data entry, invoicing and reporting, and internal operations — running 24/7 without extra hires. Scoped on a consultation call and deployed into the client's own environment.",
  provider: { "@id": `${BASE_URL}/#organization` },
  areaServed: { "@type": "Place", name: "Worldwide" },
  // No `offers` field here by design: Routcore isn't a menu of fixed packages,
  // and structured data shouldn't assert a number the page itself never states.
  // hasOfferCatalog below only lists what we build, not what it takes to get it.
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Systems we build",
    itemListElement: SYSTEMS.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, description: s.body },
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
