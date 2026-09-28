import type { Metadata } from "next";
import { RoutcorePage } from "@/components/routcore/RoutcorePage";
import { FAQS, SYSTEMS } from "@/components/routcore/content";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const URL = `${BASE_URL}/routcore`;

// The root layout's title template ("%s | Flowfiy") appends the suffix —
// including it here too would double it in the rendered <title>.
const TITLE = "Routcore: AI Automation for Repetitive Business Work";
const DESCRIPTION =
  "Routcore by Flowfiy builds custom AI systems for repetitive business work: document processing, data entry, invoicing, payment reminders, reports, onboarding and customer support. Runs 24/7 on your own tools, without extra hires.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "business process automation",
    "AI automation agency India",
    "custom AI systems for business",
    "AI workflow automation",
    "back office automation",
    "document processing automation",
    "invoice processing automation",
    "payment reminder automation",
    "accounts reconciliation automation",
    "automated business reporting",
    "HR onboarding automation",
    "customer support automation",
    "WhatsApp automation for business",
    "AI agents for business",
    "repetitive task automation",
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
        alt: "Routcore by Flowfiy: custom AI automation for repetitive business work",
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
  name: "Routcore: Custom AI Systems & Workflows",
  serviceType: "Business process automation",
  url: URL,
  description:
    "Routcore designs, builds and deploys custom AI systems that automate repetitive business work across admin, finance, operations, HR, customer support, reporting and sales, built around each client's own process and tools.",
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
