import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy Alternatives & Comparisons — vs Clay, Apollo (India 2026)",
  description:
    "Compare Flowfiy with Clay and Apollo for AI-powered B2B lead generation and cold outreach in India. See features, pricing, and which AI sales tool fits your team. From ₹1,700/mo.",
  keywords: [
    "Flowfiy alternatives",
    "Clay alternative India",
    "Apollo alternative India",
    "best AI sales tool India",
    "AI outbound tool comparison 2026",
  ],
  openGraph: {
    title: "Flowfiy vs Clay vs Apollo — AI Sales Tool Comparisons",
    description:
      "Side-by-side comparisons of Flowfiy against Clay and Apollo for B2B outbound in India. From ₹1,700/mo.",
    url: "/vs",
  },
  alternates: { canonical: "/vs" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Flowfiy Comparisons",
  description:
    "Comparisons of Flowfiy with other AI sales and lead-generation tools including Clay and Apollo.",
  inLanguage: "en-IN",
};

const comparisons = [
  {
    href: "/vs/clay",
    title: "Flowfiy vs Clay",
    desc: "Clay is an enrichment workflow builder that needs heavy setup. Flowfiy is a done-for-you 5-agent pipeline — discover, research, score, and write, with no configuration.",
  },
  {
    href: "/vs/apollo",
    title: "Flowfiy vs Apollo",
    desc: "Apollo is a contact database — it finds leads but won't research, qualify, or write to them. Flowfiy turns those leads into personalized, ready-to-send outreach automatically.",
  },
];

export default function VsHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              Comparisons
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5">
              How Flowfiy compares
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl">
              Evaluating AI sales tools for your Indian B2B team? Here&apos;s how
              Flowfiy&apos;s end-to-end outbound pipeline stacks up against the
              tools you&apos;re probably also looking at.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
            {comparisons.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
              >
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  {c.title}
                  <ArrowRight className="w-4 h-4 text-violet-400 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">{c.desc}</p>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Try Flowfiy free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
