import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight, ArrowLeft, Zap, HelpCircle } from "lucide-react";
import { SOLUTIONS, SOLUTION_BY_SLUG } from "@/lib/seo/solutions";
import { GLOSSARY_BY_SLUG } from "@/lib/seo/glossary";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const s = SOLUTION_BY_SLUG.get(slug);
  if (!s) return {};
  // The root layout sets title.template = "%s | Flowfiy", so `title` must NOT
  // include the brand suffix or it doubles. openGraph/twitter titles don't get
  // the template, so they carry the suffix explicitly.
  const fullTitle = `${s.title} | Flowfiy`;
  return {
    title: s.title,
    description: s.metaDescription,
    keywords: s.keywords,
    openGraph: {
      title: fullTitle,
      description: s.metaDescription,
      url: `/solutions/${s.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: s.metaDescription,
    },
    alternates: { canonical: `/solutions/${s.slug}` },
  };
}

export default async function SolutionPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const s = SOLUTION_BY_SLUG.get(slug);
  if (!s) notFound();

  const related = s.related
    .map((sl) => SOLUTION_BY_SLUG.get(sl))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const glossary = s.glossary
    .map((sl) => GLOSSARY_BY_SLUG.get(sl))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  // ── Structured data: SoftwareApplication + BreadcrumbList + FAQPage ──
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Flowfiy — ${s.keyword}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${BASE_URL}/solutions/${s.slug}`,
    inLanguage: "en-IN",
    description: s.metaDescription,
    offers: [
      {
        "@type": "Offer",
        price: "50",
        priceCurrency: "USD",
        description:
          "400 credits/month — about 600–800 leads. Fully managed AI, no API keys. You only pay for qualified leads.",
      },
    ],
    featureList: s.included,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Solutions", item: `${BASE_URL}/solutions` },
      { "@type": "ListItem", position: 3, name: s.keyword, item: `${BASE_URL}/solutions/${s.slug}` },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div>
        {/* Hero */}
        <section className="relative py-24 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <Link href="/" className="hover:text-violet-400 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/solutions" className="hover:text-violet-400 transition-colors">Solutions</Link>
              <span>/</span>
              <span className="text-zinc-300">{s.keyword}</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              {s.category}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.08]">
              {s.h1}{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {s.h1Highlight}
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
              {s.subhead}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
                Describe your first leads <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all">
                See pricing →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 mt-5">$50/mo · 400 credits · You only pay for qualified leads</p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-white/5 py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {s.stats.map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white mb-1">{val}</p>
                <p className="text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Answer-first definition (AEO/GEO) */}
        <section className="py-16 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-5">What is {s.keyword}?</h2>
            <p className="text-lg leading-relaxed text-zinc-200 border-l-2 border-violet-500/60 pl-4 mb-8">
              {s.definition}
            </p>
            <div className="space-y-4">
              {s.intro.map((p, i) => (
                <p key={i} className="text-base leading-relaxed text-zinc-400">{p}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-20 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">How Flowfiy delivers it</span>
              <h2 className="text-3xl font-bold text-white mb-3">{s.keyword}, end to end</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {s.capabilities.map((c) => (
                <div key={c.title} className="bg-zinc-900/40 border border-white/6 rounded-2xl p-6 hover:border-violet-500/20 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-white">{c.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Everything included */}
        <section className="py-20 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Everything included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {s.included.map((f) => (
                <div key={f} className="flex items-center gap-3 py-2.5 px-4 bg-zinc-900/30 rounded-lg border border-white/5">
                  <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="text-sm text-zinc-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ (AEO) */}
        <section className="py-20 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-10">Frequently asked questions</h2>
            <div className="space-y-4">
              {s.faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-white/8 bg-zinc-900/40 p-6 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-start gap-3 font-semibold text-white">
                    <HelpCircle className="w-4 h-4 mt-0.5 text-violet-400 shrink-0" />
                    <span className="flex-1">{f.q}</span>
                  </summary>
                  <p className="mt-3 pl-7 text-sm leading-relaxed text-zinc-400">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related + glossary cross-links */}
        {(related.length > 0 || glossary.length > 0) && (
          <section className="py-16 px-4 sm:px-6 border-b border-white/5">
            <div className="max-w-4xl mx-auto grid gap-10 sm:grid-cols-2">
              {related.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Related solutions</h2>
                  <ul className="space-y-2">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link href={`/solutions/${r.slug}`} className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors">
                          {r.keyword} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {glossary.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Learn the concepts</h2>
                  <ul className="space-y-2">
                    {glossary.map((g) => (
                      <li key={g.slug}>
                        <Link href={`/glossary/${g.slug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
                          {g.term}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start with one plain-English description</h2>
            <p className="text-zinc-400 mb-8">$50/month for 400 credits — no API keys. First leads in under 30 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30">
                Get started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/solutions" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-zinc-300 font-medium hover:border-white/20 hover:text-white transition-all">
                <ArrowLeft className="w-4 h-4" /> All solutions
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
