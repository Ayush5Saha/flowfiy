import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GoogleAnalytics } from "@next/third-parties/google";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { SignupConversionTracker } from "@/components/analytics/SignupConversionTracker";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
// .trim() guards against a stray space in the env var, which produces an
// invalid id like "1625820488509651 " and makes fbq('init') silently fail.
const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "1625820488509651").trim();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Flowfiy — Your AI Sales Team",
    template: "%s | Flowfiy",
  },
  description:
    "Your AI sales team. Describe the leads you want in plain English — Flowfiy finds them, researches each business, scores 0–100, and writes hyper-personalized cold emails, then sends from your Gmail. No API keys, fully managed AI. One plan: $50/mo for 400 credits.",
  keywords: [
    // Primary
    "AI outbound sales platform",
    "AI lead generation software",
    "AI SDR platform",
    "B2B lead generation AI",
    "AI sales automation",
    "outbound sales automation tool",
    "AI sales outreach",
    "cold email automation software",
    // Target categories
    "AI lead generation",
    "AI prospecting tool",
    "B2B lead generation software",
    "AI sales intelligence",
    "sales intelligence platform",
    "AI business search",
    "AI company research",
    "natural language lead generation",
    "business search AI",
    // India-specific
    "AI outbound sales platform India",
    "B2B lead generation software India",
    "AI lead generation India",
    "cold email automation India",
    "best AI sales tool India",
    "AI outreach tool for startups India",
    "AI sales automation India",
    "outbound sales tool India",
    // Long-tail
    "AI-powered cold emailing",
    "AI-driven sales pipeline",
    "automated B2B lead discovery",
    "AI email sequence generator",
    "AI-powered B2B prospecting",
    "personalized cold email AI",
    "AI SDR software",
    "AI sales prospecting tool",
    // Platform-specific
    "AI SaaS for lead generation",
    "AI automation for agencies",
    "AI-powered outreach for startups",
    "managed AI sales tool",
    "B2B outbound automation",
    "AI lead scoring software",
    "AI sales pipeline automation",
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
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Flowfiy",
    title: "Flowfiy — AI-Powered B2B Sales Outreach Platform",
    description:
      "Describe the leads you want — Flowfiy finds, researches, scores 0–100, and writes hyper-personalized cold emails. No API keys. One plan: $50/mo for 400 credits.",
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
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
    title: "Flowfiy — AI-Powered B2B Sales Outreach",
    description:
      "Describe the leads you want; Flowfiy researches, scores, personalizes and sends. No API keys, fully managed AI — one plan: $50/mo for 400 credits.",
    images: [`${BASE_URL}/opengraph-image`],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-IN": BASE_URL,
      "en": BASE_URL,
    },
  },
  other: {
    "geo.region": "IN",
    "geo.placename": "India",
    "geo.position": "20.5937;78.9629",
    "ICBM": "20.5937, 78.9629",
  },
  icons: {
    // PNG icons — required for Google Search, browsers, and PWA
    icon: [
      { url: "/favicon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/favicon-192x192.png",sizes: "192x192", type: "image/png" },
      { url: "/favicon-512x512.png",sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/favicon.ico" },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Flowfiy",
  alternateName: "Flowfiy AI",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon-192x192.png`,
  image: `${BASE_URL}/opengraph-image`,
  description:
    "AI-powered B2B outbound sales platform — describe the leads you want and Flowfiy finds, researches, qualifies, and writes personalized email outreach. Fully managed AI, billed by credits.",
  slogan: "Your AI sales team — pipeline while you sleep.",
  foundingDate: "2026",
  areaServed: { "@type": "Country", name: "India" },
  knowsAbout: [
    "AI outbound sales",
    "AI lead generation",
    "AI lead generation software",
    "B2B lead generation software",
    "AI sales intelligence",
    "Sales intelligence platform",
    "AI business search",
    "AI company research",
    "Natural language lead generation",
    "AI prospecting tool",
    "Cold email automation",
    "AI sales development representatives (SDR)",
    "Sales prospecting automation",
    "Lead qualification scoring",
    "Condition-based lead targeting",
  ],
  address: { "@type": "PostalAddress", addressCountry: "IN" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${BASE_URL}/contact`,
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [
    "https://twitter.com/flowfiy",
    "https://linkedin.com/company/flowfiy",
    "https://github.com/flowfiy",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "Flowfiy",
  url: BASE_URL,
  description:
    "India's AI outbound sales platform — describe the leads you want in plain English, and fully managed AI finds, researches, qualifies, and writes personalized cold emails for B2B leads.",
  inLanguage: "en-IN",
  publisher: { "@id": `${BASE_URL}/#organization` },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: BASE_URL,
  description:
    "India's AI outbound sales platform. Describe the leads you want in plain English; fully managed AI researches leads, scores prospects 0–100, and generates personalized cold emails. One plan: $50/month for 400 credits.",
  offers: [
    {
      "@type": "Offer",
      price: "50",
      priceCurrency: "USD",
      description: "$50/month for 400 credits (~600–800 leads). No API keys — fully managed AI.",
    },
  ],
  featureList: [
    "Describe leads in plain English",
    "Condition-based targeting (no website, bad reviews, slow site)",
    "Google Maps + B2B people-database discovery",
    "AI Company Research",
    "AI Qualification Scoring 0-100",
    "AI Personalized Email Writing",
    "Gmail OAuth Sending",
    "Fully managed AI — no API keys",
    "Credit-based metering",
    "Multi-tenant Workspaces",
    "AI SDR Automation",
    "B2B Lead Generation India",
  ],
  inLanguage: "en-IN",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        {/* Meta Pixel base code — inline in <head> so it loads immediately and
            is detectable by Meta's tools. Route-change PageViews (SPA nav) are
            added by <MetaPixel /> in the body; signup conversions fire
            CompleteRegistration via the trackMetaPixel helper. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`,
          }}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans min-h-screen`}
      >
        {/* Meta Pixel <noscript> fallback */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {children}
        <MetaPixel />
        <SignupConversionTracker />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
