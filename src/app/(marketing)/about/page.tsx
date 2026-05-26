import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Zap, Shield, Globe, Code2, ArrowRight, Target, Search, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "About Flowfiy — AI-Powered B2B Sales Outreach Platform India",
  description:
    "Flowfiy is India's AI outbound sales platform — 5 Claude AI agents automate lead research, qualification scoring, and personalized cold email outreach. Zero SDR needed. Built for Indian startups and agencies.",
  keywords: [
    "about Flowfiy",
    "AI sales platform India",
    "Claude AI sales tool",
    "B2B outreach automation India",
    "AI SDR platform India",
    "AI outbound sales India",
    "outbound sales software India",
    "AI sales automation startup India",
  ],
  openGraph: {
    title: "About Flowfiy — India's AI-Powered B2B Sales Platform",
    description: "Learn how Flowfiy uses 5 Claude AI agents to replace the manual SDR stack. Built for Indian startups and agencies. Plans from ₹1,700/mo.",
    url: "/about",
  },
  alternates: { canonical: "/about" },
};

const values = [
  { icon: Shield, title: "Security first", desc: "Every API key stored with AES-256-GCM. Your credentials never appear in logs. Full tenant isolation via Supabase RLS." },
  { icon: Globe, title: "Global from day one", desc: "Stripe billing in 135+ currencies. Multi-language ICP support. Built for revenue teams everywhere, not just Silicon Valley." },
  { icon: Code2, title: "Transparent stack", desc: "Next.js 15, Supabase, Prisma, BullMQ, Upstash Redis, Anthropic SDK. No black boxes. Engineers know exactly what runs their pipeline." },
  { icon: Zap, title: "AI included, BYOK available", desc: "Paid plans include fully managed Claude Sonnet — no API key needed. Prefer your own Anthropic key? BYOK mode is always an option. No AI cost markup either way." },
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

      {/* Mission statement */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-5 block">Our Mission</span>
          <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-[1.25] mb-8 border-l-2 border-violet-500 pl-8">
            Every business — regardless of budget or team size — deserves a consistent, predictable sales pipeline.
          </blockquote>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl pl-8">
            For years, building a real outbound sales machine meant hiring SDRs, subscribing to five different tools, and spending weeks on setup. That was fine if you were a large enterprise. For everyone else, it was out of reach.
          </p>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl pl-8 mt-4">
            Flowfiy changes that. Describe who you sell to, and within minutes you have a list of researched, scored, and personally written-for prospects — ready to hear from you. No team required.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["100", "Free leads to start"],
            ["5", "Specialized AI agents"],
            ["10 min", "To your first leads"],
            ["0", "SDRs needed"],
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

      {/* How It Works — plain English */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">How It Works</span>
            <h2 className="text-3xl font-bold text-white mb-3">Three steps. Fully automated.</h2>
            <p className="text-zinc-400 max-w-xl">You give one input. Flowfiy handles everything that follows.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                step: "01",
                title: "Describe your ideal customer",
                desc: "Tell Flowfiy what kind of company you sell to — the industry, the size, the role of the person who buys from you. That's your only input.",
              },
              {
                icon: Search,
                step: "02",
                title: "We find, research & score them",
                desc: "Flowfiy searches 275M+ contacts, visits each company's website, and scores every lead 0–100 based on how likely they are to need your service.",
              },
              {
                icon: Mail,
                step: "03",
                title: "We write a personal email to each one",
                desc: "For every lead that scores high enough, Flowfiy writes a subject line, email body, and follow-ups — using real details from that company. You review and send.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative bg-zinc-900/50 border border-white/6 rounded-2xl p-7 hover:border-violet-500/20 transition-colors">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-xs font-mono text-violet-400 mt-3">{step}</span>
                </div>
                <h3 className="font-semibold text-white mb-2 text-lg">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">The Team</span>
            <h2 className="text-3xl font-bold text-white mb-3">Built by someone who felt the problem.</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-8 bg-zinc-900/50 border border-white/6 rounded-2xl p-8 max-w-2xl hover:border-violet-500/20 transition-colors">
            <Image
              src="/Ayushpro.jpeg"
              alt="Ayush Saha"
              width={80}
              height={80}
              className="shrink-0 w-20 h-20 rounded-2xl object-cover object-top"
            />
            <div>
              <p className="text-lg font-semibold text-white">Ayush Saha</p>
              <p className="text-sm text-violet-400 mb-3">Founder &amp; CEO</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ayush built Flowfiy to solve the sales pipeline problem for businesses that can&apos;t afford an SDR team.
                The platform automates everything from lead discovery to personalised outreach — so founders and small teams
                can compete with companies ten times their size.
              </p>
            </div>
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
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Under the hood</span>
            <h2 className="text-3xl font-bold text-white mb-3">5 AI agents. One seamless pipeline.</h2>
            <p className="text-zinc-400 max-w-xl">Each agent is built for one specific job. They pass context to each other — so every step gets smarter as the pipeline runs.</p>
          </div>
          <ol className="space-y-4">
            {[
              { n: "01", title: "ICP Analyzer", desc: "Reads your business profile and builds a precise picture of who your ideal customer is — industries, company sizes, job titles, and the pain points they have." },
              { n: "02", title: "Lead Discovery", desc: "Searches 275M+ contacts using the targeting profile from step one. Pulls only the people and companies that match. No manual filter-clicking." },
              { n: "03", title: "Company Analyzer", desc: "Visits each prospect's company website and reads it. Extracts growth signals, identifies service gaps, and builds context for personalisation." },
              { n: "04", title: "Qualification Agent", desc: "Scores every lead from 0 to 100 based on how well they fit your service. Only high-scoring leads move forward — along with a clear reason why." },
              { n: "05", title: "Personalization Agent", desc: "Writes a subject line, email body, and two follow-ups for each qualified lead — using real details from their company, not generic merge tags." },
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
          <h2 className="text-3xl font-bold text-white mb-4">Ready to see it in action?</h2>
          <p className="text-zinc-400 mb-8">Start with 100 free leads. No credit card. First results in under 10 minutes.</p>
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
