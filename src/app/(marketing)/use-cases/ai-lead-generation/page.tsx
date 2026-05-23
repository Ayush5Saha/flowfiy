import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Lead Generation Software India — Automated B2B Prospecting | Flowfiy",
  description:
    "India's best AI lead generation software. Flowfiy uses 5 Claude AI agents to automate the entire B2B lead generation pipeline: ICP analysis, Apollo prospecting, company research, qualification scoring, and personalized outreach. Start free.",
  keywords: [
    "AI lead generation software India",
    "automated B2B lead generation India",
    "AI prospecting tool India",
    "automated lead generation 2026",
    "Claude AI lead generation",
    "AI SDR software India",
    "B2B lead generation software India",
    "AI-powered lead generation India",
    "best AI lead generation tool India",
    "lead generation automation India",
  ],
  openGraph: {
    title: "AI Lead Generation Software India — Automated B2B Prospecting | Flowfiy",
    description: "India's AI lead generation platform. 5 Claude AI agents handle your entire lead pipeline — ICP → prospect → research → qualify → outreach. Plans from ₹1,700/mo.",
    url: "/use-cases/ai-lead-generation",
  },
  alternates: { canonical: "/use-cases/ai-lead-generation" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Flowfiy — AI Lead Generation India",
  applicationCategory: "BusinessApplication",
  inLanguage: "en-IN",
  description: "India's AI lead generation software. 5 Claude AI agents automate the full B2B lead pipeline: ICP analysis, Apollo prospecting, company research, qualification scoring, and personalized outreach copy.",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free tier — 100 generations/month" },
    { "@type": "Offer", price: "1700", priceCurrency: "INR", description: "Indie plan — 2,500 generations/month" },
  ],
};

const steps = [
  { n: "01", title: "Define your ICP once", desc: "Enter your business profile — service, target market, company size, pain points. The ICP Analyzer agent generates a structured targeting signal in 10 seconds." },
  { n: "02", title: "AI discovers matching leads", desc: "The Lead Discovery agent queries Apollo's 275M+ contact database with filters built from your ICP. No manual search — it finds your buyers for you." },
  { n: "03", title: "Every company is researched", desc: "For each lead, the Company Analyzer scrapes their website and extracts signals: positioning, tech clues, team size, growth language. Takes 10–15 seconds per company." },
  { n: "04", title: "AI qualifies before you see them", desc: "Every lead is scored 0–100. Only contacts above your threshold move forward — so you spend zero time on leads that won't convert." },
  { n: "05", title: "Personalized outreach, ready to send", desc: "A subject line, email body, and two follow-ups are generated per qualified lead — referencing their company context. Connect Gmail and send in one click." },
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
              Flowfiy&apos;s 5 Claude AI agents handle the entire B2B lead generation pipeline — from ICP definition to research, qualification, and personalized email copy — automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
                Start generating leads free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/blog/how-ai-agents-replace-sdrs" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all">
                How it works →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 mt-5">50 free generations · No credit card · BYOK</p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-white/5 py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              ["275M+", "Searchable contacts via Apollo"],
              ["~15s", "Per-company research time"],
              ["0–100", "Qualification score per lead"],
              ["$0", "Claude API cost per lead"],
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
              <h2 className="text-3xl font-bold text-white mb-3">From ICP to inbox in one run</h2>
              <p className="text-zinc-400 max-w-xl">Five agents work in sequence. You set it up once. It runs while you sleep.</p>
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
                  desc: "No SDR budget? No problem. The Free plan gives you 50 full pipeline runs. Starter gives you 500/mo — enough to build a repeatable outbound motion without hiring.",
                  cta: "Free plan →",
                },
                {
                  title: "Growing sales teams",
                  desc: "Your SDRs spend 60% of their time on research. Give them AI-researched, pre-qualified leads every morning so they spend 100% of their time on conversations.",
                  cta: "Growth plan →",
                },
                {
                  title: "Agencies",
                  desc: "Run outbound for 5–20 clients from one workspace. Agency plan gives you unlimited generations and 20 team seats. BYOK means your margins stay strong.",
                  cta: "Agency plan →",
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
                "ICP Analyzer agent",
                "Lead Discovery via Apollo API",
                "Company research via Apify web scraping",
                "AI qualification scoring 0–100 with reasoning",
                "Personalized subject line + body + 2 follow-ups",
                "Gmail OAuth sending from your inbox",
                "BYOK Claude API — $0 per-lead Claude cost",
                "AES-256-GCM encrypted credentials",
                "BullMQ job queue with retry + backoff",
                "Multi-tenant team workspaces",
                "Generation usage tracking",
                "Lead status tracking (new → contacted → replied)",
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
            <p className="text-zinc-400 mb-8">50 free generations. No credit card. First leads in under 30 minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30">
              Get started free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
