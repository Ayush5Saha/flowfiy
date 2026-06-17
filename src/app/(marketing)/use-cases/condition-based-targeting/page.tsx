import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Condition-Based Lead Targeting — Find Businesses That Need You | Flowfiy",
  description:
    "Go beyond category and location. Describe leads by qualitative conditions — “coffee shops with no website”, “dentists with bad reviews”, “agencies with an outdated site” — and Flowfiy finds, scores, and writes the outreach. No API keys. $50/mo for 400 credits.",
  keywords: [
    "condition-based lead targeting",
    "find businesses with no website",
    "find businesses that need a website",
    "find businesses with bad reviews",
    "qualitative lead targeting",
    "AI lead targeting conditions",
    "local business lead generation",
    "website audit lead generation",
  ],
  openGraph: {
    title: "Condition-Based Targeting — Find Businesses That Need You | Flowfiy",
    description:
      "Describe leads by real-world conditions like “no website” or “bad reviews” — Flowfiy finds matching businesses, scores them, and writes the outreach. $50/mo for 400 credits.",
    url: "/use-cases/condition-based-targeting",
  },
  alternates: { canonical: "/use-cases/condition-based-targeting" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Condition-Based Targeting",
  description:
    "How Flowfiy finds leads by qualitative conditions — such as businesses with no website, slow or outdated sites, or poor reviews — rather than only category and location.",
  inLanguage: "en",
};

const examples = [
  { say: "“Coffee shops in Austin with no website”", how: "Maps category + location find the shops; a website-audit signal keeps only those with no live site." },
  { say: "“Dentists in Texas with bad reviews”", how: "Maps category + location find the practices; rating and review-count attributes filter to the low-rated ones." },
  { say: "“Marketing agencies under 20 staff with an outdated site”", how: "B2B firmographics filter by industry and size; the website-audit signal flags outdated, slow, or non-mobile sites." },
  { say: "“E-commerce brands running ads on a weak website”", how: "An ads signal confirms active campaigns; the website-audit signal flags an outdated or slow storefront." },
  { say: "“Restaurants that look high-end”", how: "An LLM judge reads each company's research and rates the vibe — handling fuzzy, subjective conditions." },
  { say: "“SaaS companies that recently raised funding”", how: "Industry filters to software; a funding signal keeps only those with a recent round." },
];

export default function ConditionBasedTargetingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        {/* Hero */}
        <section className="relative py-24 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-indigo-600/7 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Use case: Condition-Based Targeting
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.08]">
              Find businesses that{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                actually need you.
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Most lead tools only filter by industry, size, and location. Flowfiy lets you target on real-world
              conditions — “no website”, “slow or outdated site”, “bad reviews”, “recently funded” — the signals that
              actually mean a prospect needs what you sell.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
                Describe your ideal leads <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs text-zinc-600 mt-5">$50/mo · 400 credits · No API keys, fully managed AI</p>
          </div>
        </section>

        {/* Flagship example: businesses that need a website */}
        <section className="py-24 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-4">The classic play</p>
            <h2 className="text-3xl font-bold text-white mb-4">Web designers: find the businesses with no website</h2>
            <p className="text-zinc-400 leading-relaxed mb-8 max-w-2xl">
              If you sell websites, your best prospects are the local businesses that don&apos;t have one — or whose site is
              broken, slow, or stuck in 2014. That&apos;s exactly the segment a category-and-location filter throws away.
              Flowfiy grades each business&apos;s website and keeps the ones that need work.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["No website", "No live site found — a pure greenfield pitch."],
                ["Broken", "DNS errors, refused connections, 5xx, or expired TLS."],
                ["Slow", "Sluggish load times that cost the business customers."],
                ["Outdated", "No mobile viewport, no HTTPS, missing title/description, stale copyright."],
              ].map(([label, desc]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="font-semibold text-white mb-1">{label}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-500 mt-6 leading-relaxed">
              Because website-less locals often have no email, Flowfiy uses the phone and Maps listing it scrapes — those
              leads stay exportable so you can reach them your way, instead of being silently dropped.
            </p>
          </div>
        </section>

        {/* How it works — examples table */}
        <section className="py-24 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-3">Describe it. Flowfiy figures out how to check it.</h2>
            <p className="text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              Every condition you write is decomposed and routed to the cheapest evaluator that can check it — a search
              filter, a computed attribute, an active probe, or an AI judge for fuzzy phrasing. The plan shows you exactly
              how each one is checked before you spend a credit.
            </p>
            <div className="space-y-3">
              {examples.map((ex) => (
                <div key={ex.say} className="grid sm:grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="font-medium text-white">{ex.say}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{ex.how}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="py-24 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">Category-only targeting</p>
                <div className="space-y-4">
                  {[
                    "“Restaurants in Miami” — thousands of leads, no signal of need",
                    "You manually scan each one to see if they fit",
                    "Most are doing fine and ignore you",
                    "Your reply rate suffers because the timing is wrong",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-zinc-500">
                      <span className="mt-1 w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
                        <span className="w-1.5 h-0.5 bg-zinc-700 rounded" />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-5">Condition-based targeting</p>
                <div className="space-y-4">
                  {[
                    "“Restaurants in Miami with no website and bad reviews”",
                    "Flowfiy filters to exactly the ones with a visible problem",
                    "Each lead carries the matched-signal it qualified on",
                    "Your outreach references the real reason you reached out",
                  ].map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="mt-0.5 w-4 h-4 text-violet-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Target the leads that actually need you</h2>
            <p className="text-zinc-400 mb-8">$50/mo for 400 credits — no API keys. Describe a condition and see who matches.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30">
                Get started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/glossary/condition-based-targeting" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-zinc-300 font-medium hover:border-white/20 hover:text-white transition-all">
                What is condition-based targeting?
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
