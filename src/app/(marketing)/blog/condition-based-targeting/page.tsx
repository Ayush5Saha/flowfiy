import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Condition-Based Targeting: Find Leads by Real-World Signals | Flowfiy Blog",
  description:
    "Category and location aren't enough. Learn how condition-based targeting finds leads by qualitative signals — no website, slow site, bad reviews, recent funding — and why those leads convert far better.",
  keywords: [
    "condition-based targeting",
    "find businesses with no website",
    "find businesses that need a website",
    "qualitative lead targeting",
    "lead targeting signals",
    "AI lead generation conditions",
    "local business prospecting",
    "website audit prospecting",
  ],
  openGraph: {
    title: "Condition-Based Targeting: Find Leads by Real-World Signals",
    description:
      "Why targeting on conditions like “no website” or “bad reviews” beats category-and-location filters — and how Flowfiy does it.",
    url: "/blog/condition-based-targeting",
    type: "article",
  },
  alternates: { canonical: "/blog/condition-based-targeting" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Condition-Based Targeting: Find Leads by Real-World Signals",
  description:
    "How condition-based targeting finds leads by qualitative signals rather than just category and location.",
  datePublished: "2026-06-16",
  author: { "@type": "Organization", name: "Flowfiy" },
  publisher: { "@type": "Organization", name: "Flowfiy" },
};

export default function BlogPostConditionBasedTargeting() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-zinc-500 text-sm hover:text-zinc-300 mb-10 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">Targeting</span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> 6 min read</span>
              <span className="text-xs text-zinc-600">Jun 16, 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
              Condition-Based Targeting: Find Leads by Real-World Signals
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Industry, size, and location tell you who a business is — not whether they need what you sell. The signals
              that actually predict a sale are conditions: no website, a slow site, bad reviews, a fresh funding round.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 leading-relaxed">

            <p>
              Almost every lead tool filters the same way: pick an industry, a company size, and a location, and get a
              list. The problem is that a list of &ldquo;restaurants in Miami&rdquo; tells you nothing about which ones
              have a problem you can fix today. You end up scanning hundreds of records by hand looking for the signal
              that made them worth contacting in the first place.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">Conditions are the signal</h2>
            <p>
              A condition is a real-world fact about a business that maps directly to your offer. If you build websites,
              the condition is &ldquo;has no website&rdquo; or &ldquo;has a slow, outdated one.&rdquo; If you do
              reputation management, it&apos;s &ldquo;has bad reviews.&rdquo; If you sell to fast-growing teams, it&apos;s
              &ldquo;recently raised funding.&rdquo; Targeting on the condition means every lead on your list already has
              the reason you&apos;re reaching out baked in.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">Why category-only targeting underperforms</h2>
            <p>
              When you target by category alone, most of your list is doing fine. They have a decent website, solid
              reviews, no urgent need — so your outreach lands as noise. Reply rates suffer not because the email was
              bad, but because the timing and relevance were wrong. Condition-based targeting fixes the input: a smaller,
              sharper list where every prospect has a visible gap.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">The classic play: businesses that need a website</h2>
            <p>
              It&apos;s the cleanest example. If you sell websites, your best prospects are local businesses with no site
              at all — or one that&apos;s broken, slow, or clearly outdated. That&apos;s precisely the segment a normal
              filter discards, because tools usually keep only businesses that already have a working website and email.
            </p>
            <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">How a website condition is graded</p>
              <div className="space-y-3 text-sm">
                {[
                  ["None", "No live site found — a greenfield pitch"],
                  ["Broken", "DNS error, refused connection, 5xx, or expired TLS"],
                  ["Slow", "Load times slow enough to cost customers"],
                  ["Outdated", "No mobile viewport, no HTTPS, missing title/description, stale copyright"],
                ].map(([label, desc]) => (
                  <div key={label as string} className="flex justify-between gap-4">
                    <span className="font-mono font-semibold text-white shrink-0">{label}</span>
                    <span className="text-zinc-400 text-right">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <p>
              Website-less local businesses often have no email, so Flowfiy keeps the phone number and Maps listing it
              scrapes and marks those leads exportable — instead of silently dropping the exact prospects you want.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">How Flowfiy evaluates any condition</h2>
            <p>
              You can&apos;t hardcode every phrasing a person might type, so Flowfiy decomposes each request and routes
              every condition to the cheapest evaluator that can check it — narrowing the candidate set before the
              expensive checks run:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li><strong className="text-white">Search filters</strong> — pushed straight into the data source (industry, size, location, category). Free.</li>
              <li><strong className="text-white">Attributes</strong> — computed from results in memory (rating, review count, has-email, founded year). Free.</li>
              <li><strong className="text-white">Signals</strong> — active probes run only on survivors (website audit, tech detection, ads, funding news).</li>
              <li><strong className="text-white">AI judge</strong> — for fuzzy, subjective conditions like &ldquo;looks high-end&rdquo; or &ldquo;B2B not B2C.&rdquo;</li>
            </ul>
            <p>
              Before you spend a single credit, the plan shows you exactly how each condition will be checked and whether
              it&apos;s a hard filter or a soft ranking boost. Anything Flowfiy can&apos;t evaluate, it raises as a
              question instead of quietly dropping it.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">Just describe it</h2>
            <p>
              You don&apos;t configure any of this. You write what you want in plain English — &ldquo;coffee shops in
              Austin with no website,&rdquo; &ldquo;dentists in Texas with bad reviews,&rdquo; &ldquo;agencies under 20
              staff with an outdated site&rdquo; — and Flowfiy finds the matches, scores each 0–100, and writes outreach
              that references the actual reason they qualified.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

          <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">Find the leads that actually need you</h3>
            <p className="text-zinc-400 text-sm mb-6">$50/month for 400 credits — no API keys. Describe a condition and see who matches.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-12">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">Continue reading</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/how-to-set-up-flowfiy", title: "How to Set Up Flowfiy: The Complete 4-Step Setup Guide" },
                { href: "/blog/how-ai-agents-replace-sdrs", title: "How AI Is Replacing the Entire SDR Stack in 2026" },
                { href: "/blog/byok-ai-pricing-explained", title: "Why We Removed API Keys: Simple Credit Pricing" },
              ].map((p) => (
                <Link key={p.href} href={p.href} className="group block p-5 bg-zinc-900/40 border border-white/6 rounded-xl hover:border-violet-500/20 transition-colors">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors leading-snug">{p.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 group-hover:gap-2 transition-all">Read <ArrowRight className="w-3 h-3" /></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
