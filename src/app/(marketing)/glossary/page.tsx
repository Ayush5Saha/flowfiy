import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GLOSSARY } from "@/lib/seo/glossary";

export const metadata: Metadata = {
  title: "AI Sales & Outbound Glossary — Flowfiy",
  description:
    "Plain-English definitions of AI sales and B2B outbound terms: AI SDR, lead scoring, ICP, cold email, lead enrichment, email deliverability, and more.",
  keywords: [
    "AI sales glossary",
    "what is an AI SDR",
    "what is lead scoring",
    "what is an ICP",
    "outbound sales terms",
    "cold email definition",
  ],
  openGraph: {
    title: "AI Sales & Outbound Glossary",
    description:
      "Clear definitions of the AI sales and B2B outbound terms that matter — from AI SDR to lead scoring.",
    url: "/glossary",
  },
  alternates: { canonical: "/glossary" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "Flowfiy AI Sales & Outbound Glossary",
  description:
    "Definitions of AI sales and B2B outbound terms including AI SDR, lead scoring, ICP, cold email, and lead enrichment.",
  inLanguage: "en-IN",
  hasDefinedTerm: GLOSSARY.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.short,
    url: `/glossary/${t.slug}`,
  })),
};

export default function GlossaryIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              Glossary
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5">
              AI sales &amp; outbound glossary
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl">
              Plain-English definitions of the terms behind modern AI outbound —
              what they mean and how they fit into an automated sales pipeline.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2">
            {GLOSSARY.map((t) => (
              <Link
                key={t.slug}
                href={`/glossary/${t.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
              >
                <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                  {t.term}
                  <ArrowRight className="w-4 h-4 text-violet-400 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">{t.short}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
