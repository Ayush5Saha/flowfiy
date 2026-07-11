import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS } from "@/lib/seo/solutions";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

export const metadata: Metadata = {
  title: "Solutions — AI Lead Generation, Sales Intelligence & Business Search",
  description:
    "Explore what Flowfiy does: AI sales intelligence, AI business search, AI company research, AI prospecting, natural language lead generation, and B2B lead generation software — all from one plain-English brief. $50/mo for 400 credits.",
  keywords: [
    "AI lead generation",
    "AI sales intelligence platform",
    "AI business search",
    "AI company research",
    "AI prospecting tool",
    "natural language lead generation",
    "B2B lead generation software",
    "AI sales software",
  ],
  openGraph: {
    title: "Flowfiy Solutions — AI Sales Intelligence, Business Search & Lead Generation",
    description:
      "AI sales intelligence, business search, company research, prospecting, and B2B lead generation — from one plain-English brief.",
    url: "/solutions",
  },
  alternates: { canonical: "/solutions" },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Flowfiy Solutions",
  description:
    "AI sales intelligence, AI business search, AI company research, AI prospecting, natural language lead generation, and B2B lead generation software.",
  inLanguage: "en-IN",
  hasPart: SOLUTIONS.map((s) => ({
    "@type": "WebPage",
    name: s.keyword,
    url: `${BASE_URL}/solutions/${s.slug}`,
  })),
};

export default function SolutionsHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />

      <div>
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              Solutions
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5">
              One AI sales engine for the whole outbound motion
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl">
              Describe the leads you want in plain English and Flowfiy finds real businesses
              on Google Maps, researches each one, qualifies it 0–100 by how much it needs
              your service, and writes the outreach. Here&apos;s how that maps to the things
              sales teams search for — sales intelligence, business search, company research,
              prospecting, and B2B lead generation.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
            {SOLUTIONS.map((s) => (
              <Link
                key={s.slug}
                href={`/solutions/${s.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
              >
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  {s.keyword}
                  <ArrowRight className="w-4 h-4 text-violet-400 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">{s.definition}</p>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Get started — $50/mo for 400 credits
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
