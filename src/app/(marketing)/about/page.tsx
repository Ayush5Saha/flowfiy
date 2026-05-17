import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Shield, Globe, Code2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Flowfiy — AI-Powered B2B Sales Outreach Platform",
  description:
    "Flowfiy is a multi-tenant SaaS platform that uses 5 Claude AI agents to automate the entire outbound sales pipeline. BYOK. Zero per-lead cost. Built for global revenue teams.",
  keywords: ["about Flowfiy", "AI sales platform", "Claude AI sales tool", "B2B outreach automation", "BYOK AI SaaS"],
  openGraph: {
    title: "About Flowfiy — AI-Powered B2B Sales Platform",
    description: "Learn how Flowfiy uses 5 specialized Claude AI agents to replace the manual SDR stack. BYOK model, multi-tenant, AES-256 encrypted.",
    url: "/about",
  },
  alternates: { canonical: "/about" },
};

const values = [
  { icon: Shield, title: "Security first", desc: "Every API key stored with AES-256-GCM. Your credentials never appear in logs. Full tenant isolation via Supabase RLS." },
  { icon: Globe, title: "Global from day one", desc: "Stripe billing in 135+ currencies. Multi-language ICP support. Built for revenue teams everywhere, not just Silicon Valley." },
  { icon: Code2, title: "Transparent stack", desc: "Next.js 15, Supabase, Prisma, BullMQ, Upstash Redis, Anthropic SDK. No black boxes. Engineers know exactly what runs their pipeline." },
  { icon: Zap, title: "BYOK always", desc: "Your Claude API key stays yours. We never see your tokens, never mark up your AI costs. Charge only for platform intelligence." },
];

const stack = [
  { name: "Claude (Anthropic)", role: "AI backbone — 5 specialized agents", color: "from-orange-500/20 to-amber-500/20 border-orange-500/20" },
  { name: "Next.js 15", role: "App Router, server components, API routes", color: "from-zinc-700/40 to-zinc-800/40 border-white/8" },
  { name: "Supabase", role: "PostgreSQL + Auth + RLS multi-tenant isolation", color: "from-emerald-500/15 to-green-500/15 border-emerald-500/20" },
  { name: "BullMQ + Upstash Redis", role: "AI pipeline job queue with retry & backoff", color: "from-red-500/15 to-rose-500/15 border-red-500/20" },
  { name: "Apollo.io", role: "275M+ contact database for lead discovery", color: "from-blue-500/15 to-indigo-500/15 border-blue-500/20" },
  { name: "Apify", role: "Web scraping for company research signals", color: "from-violet-500/15 to-purple-500/15 border-violet-500/20" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Our mission
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.08]">
            The outbound stack was{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              broken.
            </span>
            <br />We rebuilt it with AI.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Manual SDR work — scraping LinkedIn, researching companies, writing cold emails — is repetitive, slow, and expensive.
            Flowfiy replaces that entire workflow with 5 specialized Claude AI agents that run 24/7, never get tired, and personalize every single touchpoint.
          </p>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            We built this for revenue teams who want pipeline quality, not just volume. Every lead is researched, scored, and written for — before a single email leaves your inbox.
          </p>
        </div>
      </section>

      {/* Mission stat bar */}
      <section className="border-y border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["50", "Free generations to start"],
            ["5", "Specialized AI agents"],
            ["$0", "Per-lead Claude cost to you"],
            ["AES-256", "Credential encryption"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold font-mono text-white mb-1">{val}</p>
              <p className="text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-3">What we stand for</h2>
          <p className="text-zinc-400 mb-12 max-w-xl">Four principles that shape every product decision we make.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-zinc-900/50 border border-white/6 rounded-2xl p-6 hover:border-violet-500/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Built on</span>
            <h2 className="text-3xl font-bold text-white mb-3">The tech that powers the pipeline</h2>
            <p className="text-zinc-400 max-w-xl">
              No magic black boxes. Here's exactly what runs Flowfiy — and why each piece was chosen.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stack.map(({ name, role, color }) => (
              <div key={name} className={`bg-gradient-to-br ${color} border rounded-xl p-5`}>
                <p className="font-semibold text-white mb-1">{name}</p>
                <p className="text-sm text-zinc-400">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the 5 agents work */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">The AI pipeline</span>
            <h2 className="text-3xl font-bold text-white mb-3">5 agents. One pipeline. Zero manual work.</h2>
            <p className="text-zinc-400 max-w-xl">Each agent is specialized for its task. They pass context forward — not just data.</p>
          </div>
          <ol className="space-y-4">
            {[
              { n: "01", title: "ICP Analyzer (claude-haiku-4-5)", desc: "Takes your business profile and generates a precise Ideal Customer Profile — target industries, company sizes, titles, and pain-point signals." },
              { n: "02", title: "Lead Discovery (claude-haiku-4-5 + Apollo API)", desc: "Constructs Apollo People Search queries from your ICP. Pulls matching contacts from 275M+ contacts. No manual filter-clicking." },
              { n: "03", title: "Company Analyzer (claude-sonnet-4-6 + Apify)", desc: "Scrapes each prospect's company website. Extracts brand signals, tech stack clues, growth indicators, and service gaps." },
              { n: "04", title: "Qualification Agent (claude-haiku-4-5)", desc: "Scores each lead 0–100 against your ICP. Only leads above threshold proceed. Every score includes reasoning you can read." },
              { n: "05", title: "Personalization Agent (claude-sonnet-4-6)", desc: "Writes a subject line, email body, and two follow-ups per qualified lead — referencing their actual company context, not a merge field." },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-5 bg-zinc-900/40 border border-white/6 rounded-2xl p-6">
                <span className="text-xs font-mono text-violet-400 mt-0.5 shrink-0">{n}</span>
                <div>
                  <p className="font-medium text-white mb-1">{title}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to replace your SDR stack?</h2>
          <p className="text-zinc-400 mb-8">Start with 50 free lead generations. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/blog" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all">
              Read the blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
