import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X, ArrowRight } from "lucide-react";
import { COMPETITORS, COMPETITOR_BY_SLUG } from "@/lib/seo/competitors";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const c = COMPETITOR_BY_SLUG.get(slug);
  if (!c) return {};
  const title = `Flowfiy vs ${c.name} — AI Sales Tool Comparison (India 2026)`;
  return {
    title,
    description: `${c.positioning} See features, pricing, and which fits your B2B team. Flowfiy from ₹1,700/mo, starts free.`,
    keywords: [
      `Flowfiy vs ${c.name}`,
      `${c.name} alternative`,
      `${c.name} alternative India`,
      `${c.name} competitor`,
      "AI sales tool comparison 2026",
    ],
    openGraph: { title, description: c.positioning, url: `/vs/${c.slug}` },
    alternates: { canonical: `/vs/${c.slug}` },
  };
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
  if (v === false) return <X className="w-4 h-4 text-zinc-600 mx-auto" />;
  return <span className="text-xs text-zinc-400">{v}</span>;
}

export default async function VsCompetitorPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const c = COMPETITOR_BY_SLUG.get(slug);
  if (!c) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Flowfiy vs ${c.name}`,
    description: c.positioning,
    inLanguage: "en-IN",
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the difference between Flowfiy and ${c.name}?`,
        acceptedAnswer: { "@type": "Answer", text: c.positioning },
      },
      {
        "@type": "Question",
        name: `Is Flowfiy a good ${c.name} alternative?`,
        acceptedAnswer: { "@type": "Answer", text: c.verdict },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div>
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-6">
              {c.category}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5">
              Flowfiy vs {c.name}
            </h1>
            <p className="text-lg leading-relaxed text-zinc-300 border-l-2 border-violet-500/60 pl-4 max-w-2xl">
              {c.positioning}
            </p>
          </div>
        </section>

        <section className="py-14 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {c.intro.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-zinc-400">{p}</p>
            ))}
          </div>
        </section>

        <section className="pb-14 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10">
                  <th className="text-left font-medium text-zinc-400 px-4 py-3">Feature</th>
                  <th className="font-semibold text-violet-300 px-4 py-3">Flowfiy</th>
                  <th className="font-medium text-zinc-400 px-4 py-3">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="text-zinc-300 px-4 py-3">{r.feature}</td>
                    <td className="text-center px-4 py-3"><Cell v={r.flowfiy} /></td>
                    <td className="text-center px-4 py-3"><Cell v={r.them} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-3xl mx-auto mt-10 rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] p-6">
            <h2 className="text-lg font-semibold text-white mb-2">The verdict</h2>
            <p className="text-sm leading-relaxed text-zinc-300">{c.verdict}</p>
            <Link href="/signup" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500">
              Try Flowfiy free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="max-w-3xl mx-auto mt-8 text-center">
            <Link href="/vs" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              ← See all Flowfiy comparisons
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
