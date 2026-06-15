import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { GLOSSARY, GLOSSARY_BY_SLUG } from "@/lib/seo/glossary";

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const t = GLOSSARY_BY_SLUG.get(slug);
  if (!t) return {};
  const title = `What is ${t.term.replace(/\s*\(.*\)$/, "")}? — Flowfiy Glossary`;
  return {
    title,
    description: t.short,
    keywords: [t.term, `what is ${t.term}`, `${t.term} definition`, "AI sales", "B2B outbound"],
    openGraph: { title, description: t.short, url: `/glossary/${t.slug}` },
    alternates: { canonical: `/glossary/${t.slug}` },
  };
}

export default async function GlossaryTermPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const t = GLOSSARY_BY_SLUG.get(slug);
  if (!t) notFound();

  const cleanName = t.term.replace(/\s*\(.*\)$/, "");
  const related = t.related
    .map((s) => GLOSSARY_BY_SLUG.get(s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: t.term,
    description: t.short,
    inDefinedTermSet: "/glossary",
    inLanguage: "en-IN",
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${cleanName}?`,
        acceptedAnswer: { "@type": "Answer", text: t.short },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <article className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/glossary" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-violet-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Glossary
          </Link>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-5">
            What is {cleanName}?
          </h1>

          {/* Answer-first definition — what answer engines extract */}
          <p className="text-lg leading-relaxed text-zinc-200 border-l-2 border-violet-500/60 pl-4 mb-8">
            {t.short}
          </p>

          <div className="space-y-4">
            {t.body.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-zinc-400">{p}</p>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] p-6">
            <p className="text-sm text-zinc-300">
              Flowfiy automates this end-to-end for B2B teams in India — find,
              research, score, and email leads with AI.
            </p>
            <Link href="/signup" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-12 border-t border-white/5 pt-8">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-4">Related terms</h2>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/glossary/${r.slug}`} className="text-violet-400 hover:text-violet-300 transition-colors">
                      {r.term}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
