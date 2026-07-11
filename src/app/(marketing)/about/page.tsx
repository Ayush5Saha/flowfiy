import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Zap, Shield, Globe, Code2, ArrowRight, Target, Search, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "About Flowfiy — The AI Sales Engine for B2B Teams",
  description:
    "Flowfiy is an AI sales engine. It finds real businesses on Google Maps (plus a B2B people database), researches each one with AI, scores it 0–100 by how much it needs your service, then sends personalized outreach from your own Gmail.",
  keywords: [
    "about Flowfiy",
    "AI sales engine",
    "AI business search",
    "Google Maps lead generation",
    "describe your leads",
    "AI SDR platform",
    "need-based lead qualification",
    "condition-based lead targeting",
  ],
  openGraph: {
    title: "About Flowfiy — The AI Sales Engine for B2B Teams",
    description: "Flowfiy finds real businesses on Google Maps, researches each with AI, scores it 0–100 by how much it needs your service, then sends personalized outreach from your Gmail. One plan, $50/mo for 400 credits.",
    url: "/about",
  },
  alternates: { canonical: "/about" },
};

const values = [
  { icon: Shield, title: "Security first", desc: "Your data is encrypted and fully tenant-isolated. We send only from your own Gmail, after your review — nothing leaves without you." },
  { icon: Globe, title: "Global from day one", desc: "Billed in your local currency (rupees in India). Describe your leads in plain English for any market. Built for revenue teams everywhere." },
  { icon: Code2, title: "You only pay for results", desc: "1 plan, 400 credits a month. About 2 qualified leads per credit, and an empty search costs nothing. Top up anytime — no AI cost markup." },
  { icon: Zap, title: "Fully managed AI", desc: "The AI and data sources are managed for you — no API keys, no per-tool setup. Just describe who you want to reach and Flowfiy does the rest." },
];

const stack = [
  { name: "Google Gemini", role: "Fully managed AI — research, scoring & writing", color: "from-orange-500/20 to-amber-500/20 border-orange-500/20" },
  { name: "Next.js 15", role: "App Router, server components, API routes", color: "from-zinc-700/40 to-zinc-800/40 border-white/8" },
  { name: "Supabase", role: "PostgreSQL + Auth + RLS multi-tenant isolation", color: "from-emerald-500/15 to-green-500/15 border-emerald-500/20" },
  { name: "BullMQ + Upstash Redis", role: "AI pipeline job queue with retry & backoff", color: "from-red-500/15 to-rose-500/15 border-red-500/20" },
  { name: "Google Maps + B2B database", role: "Lead sources for local businesses & people", color: "from-blue-500/15 to-indigo-500/15 border-blue-500/20" },
  { name: "Email verification & enrichment", role: "Included — clean, deliverable contacts", color: "from-violet-500/15 to-purple-500/15 border-violet-500/20" },
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
            Manual prospecting was broken.{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              We built an AI sales engine instead.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed mb-8">
            Finding companies, researching them, and writing cold emails by hand is repetitive, slow, and expensive.
            Flowfiy replaces that entire workflow: it finds real businesses on Google Maps that match what you sell, researches each one with AI, scores it 0–100 by how much it needs your service, and sends personalized outreach from your own Gmail.
          </p>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            We built this for revenue teams who want pipeline quality, not just volume. Every lead is found on live data, researched, and scored before a single email leaves your inbox.
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
            Flowfiy changes that. Describe who you sell to in plain English — even by condition, like &quot;coffee shops with no website&quot; or &quot;SaaS that recently raised&quot; — and Flowfiy searches live data on Google Maps and a B2B people database, not a stale contact list, to find them. Within minutes you have a list of researched, scored, and personally written-for prospects. No team required.
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
                desc: "Flowfiy finds real businesses on Google Maps (plus a B2B people database) — live data, not a stale contact list — visits each company's website, and scores every lead 0–100 based on how much they need your service.",
              },
              {
                icon: Mail,
                step: "03",
                title: "We write a personal email to each one",
                desc: "For every lead that scores high enough, Flowfiy writes a subject line, email body, and follow-ups — using real details from that company. You review and send from your own Gmail.",
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
              No magic black boxes. Here&apos;s exactly what runs Flowfiy — and why each piece was chosen.
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

      {/* How the pipeline works */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Under the hood</span>
            <h2 className="text-3xl font-bold text-white mb-3">One pipeline. Five steps.</h2>
            <p className="text-zinc-400 max-w-xl">Each step is built for one specific job, and passes context to the next — so the work gets smarter as the pipeline runs. All of it is fully managed; there are no API keys to set up.</p>
          </div>
          <ol className="space-y-4">
            {[
              { n: "01", title: "Understand your ICP", desc: "Reads your business profile and your plain-English request, then builds a precise picture of who to target — industries, company sizes, job titles, and the conditions that qualify a lead." },
              { n: "02", title: "Discover leads", desc: "Searches Google Maps and a B2B people database using that brief — real, live businesses, not a stale contact database. Condition-based targeting finds matches a simple filter can't — like \"no website\" or \"bad reviews\" — and pulls only the businesses and people that fit." },
              { n: "03", title: "Research each company", desc: "Visits each prospect's website and reads it. Extracts growth signals, website health, and service gaps, building context for personalisation." },
              { n: "04", title: "Qualify & score", desc: "Scores every lead from 0 to 100 based on how much they need your service. Only high-scoring leads move forward — along with a clear reason why, and you only spend credits on the ones that qualify." },
              { n: "05", title: "Personalize outreach", desc: "Writes a subject line, email body, and follow-ups for each qualified lead — using real details from their company, not generic merge tags — ready to send from your own Gmail." },
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
          <p className="text-zinc-400 mb-8">$50/month for 400 credits — no API keys. First results in under 10 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Get started <ArrowRight className="w-4 h-4" />
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
