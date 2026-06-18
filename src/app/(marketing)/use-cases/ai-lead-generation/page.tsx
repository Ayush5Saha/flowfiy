import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Lead Generation Software — Describe Your Ideal Leads",
  description:
    "Describe the leads you want in plain English — Flowfiy finds matching businesses, researches and scores each 0–100, and writes personalized cold emails plus follow-ups. Fully managed AI, no API keys. $50/mo for 400 credits.",
  keywords: [
    "AI lead generation software",
    "automated B2B lead generation",
    "AI prospecting tool",
    "automated lead generation 2026",
    "condition-based lead targeting",
    "AI SDR software",
    "B2B lead generation software",
    "AI-powered lead generation",
    "best AI lead generation tool",
    "lead generation automation",
  ],
  openGraph: {
    title: "AI Lead Generation Software — Describe Your Ideal Leads | Flowfiy",
    description: "Describe the leads you want — Flowfiy finds, qualifies and writes the outreach. Fully managed AI, no API keys. $50/mo for 400 credits.",
    url: "/use-cases/ai-lead-generation",
  },
  alternates: { canonical: "/use-cases/ai-lead-generation" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy — AI Lead Generation",
  applicationCategory: "BusinessApplication",
  inLanguage: "en",
  description: "AI lead generation software. Describe the leads you want in plain English — Flowfiy finds matching businesses, researches and scores each 0–100, and writes personalized cold emails plus follow-ups. Fully managed AI, no API keys.",
  offers: [
    { "@type": "Offer", price: "50", priceCurrency: "USD", description: "400 credits/month — about 600–800 leads. Extra credits via top-ups anytime." },
  ],
};

const steps = [
  { n: "01", title: "Describe the leads you want", desc: "Type it in plain English — \"coffee shops with no website\", \"dentists with bad reviews\", \"SaaS that recently raised\". Flowfiy asks smart clarifying questions when it needs to narrow the search." },
  { n: "02", title: "AI finds matching businesses", desc: "Flowfiy translates your description into a targeted search across Google Maps and a B2B people database — no API keys, no manual filters. Condition-based targeting finds leads category-and-location search can't." },
  { n: "03", title: "Every company is researched", desc: "For each lead, Flowfiy reviews their website and public signals: positioning, tech clues, team size, growth language. Email addresses are verified and enriched along the way." },
  { n: "04", title: "AI qualifies before you see them", desc: "Every lead is scored 0–100 with reasoning. Only leads above your threshold move forward — so you spend zero time on prospects that won't convert. You only pay for qualified leads." },
  { n: "05", title: "Personalized outreach, ready to send", desc: "A subject line, email body, and two follow-ups are written per qualified lead — referencing their real company context. Connect Gmail, review, and send from your own inbox." },
];

export default function AILeadGenerationPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        {/* Hero */}
        <section className="relative py-24 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Use case: AI Lead Generation
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.08]">
              Stop prospecting manually.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Let AI do it.
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Describe the leads you want in plain English — Flowfiy finds matching businesses, researches and scores each 0–100, and writes personalized cold emails plus follow-ups. Fully managed AI, no API keys.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
                Describe your first leads <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/blog/how-ai-agents-replace-sdrs" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all">
                How it works →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 mt-5">$50/mo · 400 credits · You only pay for qualified leads</p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-white/5 py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ["Plain English", "Describe the leads you want"],
              ["600–800", "Leads per month on 400 credits"],
              ["0–100", "Qualification score per lead"],
              ["$0", "Cost for an empty search"],
            ].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl font-bold font-mono text-white mb-1">{val}</p>
                <p className="text-sm text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">The pipeline</span>
              <h2 className="text-3xl font-bold text-white mb-3">From a sentence to inbox in one run</h2>
              <p className="text-zinc-400 max-w-xl">Describe what you want once. Flowfiy finds, researches, qualifies and writes — while you sleep.</p>
            </div>
            <ol className="space-y-4">
              {steps.map(({ n, title, desc }) => (
                <li key={n} className="flex gap-5 bg-zinc-900/40 border border-white/6 rounded-2xl p-6 hover:border-violet-500/20 transition-colors">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-violet-400">{n}</span>
                      <p className="font-semibold text-white">{title}</p>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-24 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12">Who uses Flowfiy for lead generation</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  title: "Solo founders",
                  desc: "No SDR budget? No problem. $50/month gets you 400 credits — about 600–800 leads — enough to build a repeatable outbound motion without hiring.",
                  cta: "Get started →",
                },
                {
                  title: "Growing sales teams",
                  desc: "Your SDRs spend 60% of their time on research. Give them AI-researched, pre-qualified leads every morning so they spend 100% of their time on conversations.",
                  cta: "Get started →",
                },
                {
                  title: "Agencies",
                  desc: "Run outbound for multiple clients from one workspace. Top up credits anytime as you scale — you only pay for qualified leads, so margins stay predictable.",
                  cta: "Get started →",
                },
              ].map(({ title, desc, cta }) => (
                <div key={title} className="bg-zinc-900/40 border border-white/6 rounded-2xl p-6 hover:border-violet-500/20 transition-colors">
                  <h3 className="font-semibold text-white mb-3">{title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">{desc}</p>
                  <Link href="/signup" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">{cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features checklist */}
        <section className="py-20 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Everything included</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Describe leads in plain English",
                "Condition-based targeting (no website, bad reviews, slow site…)",
                "Google Maps + B2B people-database discovery",
                "Company research from each site's public data",
                "AI qualification scoring 0–100 with reasoning",
                "Personalized subject line + body + follow-ups",
                "Gmail OAuth sending from your inbox",
                "Fully managed AI — no API keys",
                "Email verification & enrichment included",
                "BullMQ job queue with retry + backoff",
                "Multi-tenant team workspaces",
                "Credit usage tracking + lead status (new → contacted → replied)",
              ].map(f => (
                <div key={f} className="flex items-center gap-3 py-2.5 px-4 bg-zinc-900/30 rounded-lg border border-white/5">
                  <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="text-sm text-zinc-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start your first AI lead generation run</h2>
            <p className="text-zinc-400 mb-8">$50/month for 400 credits — no API keys. First leads in under 30 minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30">
              Get started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
