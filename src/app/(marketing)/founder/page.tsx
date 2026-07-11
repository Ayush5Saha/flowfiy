import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Twitter,
  Linkedin,
  Github,
  Globe,
  Mail,
  Zap,
  Users,
  TrendingUp,
  Building2,
  Sparkles,
  MessageSquare,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ayush Saha — Founder of Flowfiy | AI Sales Engine",
  description:
    "Ayush Saha is the founder of Flowfiy — the AI sales engine that finds real businesses on Google Maps, researches each one, scores it 0–100 by how much it needs your service, and sends personalized outreach from your Gmail. Formerly an AI automation consultant.",
  openGraph: {
    title: "Ayush Saha — Founder of Flowfiy",
    description:
      "Building Flowfiy — the AI sales engine that finds real businesses on Google Maps, researches and scores each by need, then writes personalised outreach for you.",
    url: "/founder",
  },
  alternates: { canonical: "/founder" },
};

const skills = [
  "AI Sales",
  "B2B Sales Automation",
  "Condition-Based Targeting",
  "Next.js",
  "Supabase",
  "Cold Email",
  "Lead Generation",
  "SaaS",
  "Gemini",
  "TypeScript",
  "Growth",
  "Product",
];

const openTo = [
  {
    icon: Users,
    title: "Affiliate partnerships",
    desc: "Creators and consultants who want to earn 30% recurring commission recommending Flowfiy to their audience.",
    href: "/affiliates",
    cta: "View affiliate program",
  },
  {
    icon: MessageSquare,
    title: "Feedback & beta testing",
    desc: "Revenue teams, agencies, and founders who want to try Flowfiy early and help shape the product roadmap.",
    href: "/signup",
    cta: "Get started",
  },
  {
    icon: Building2,
    title: "Enterprise & integrations",
    desc: "Larger teams who need custom AI pipeline setups, dedicated support, or API access for their own platform.",
    href: "/contact",
    cta: "Get in touch",
  },
];

const timeline = [
  {
    year: "2026",
    title: "Founded Flowfiy",
    desc: "Launched the AI sales engine that finds real businesses on Google Maps, researches and qualifies each by need, and writes the outreach. Zero SDR required.",
  },
  {
    year: "2025",
    title: "AI Automation Consultant",
    desc: "Helped 20+ businesses set up automated lead generation workflows using AI tooling.",
  },
  {
    year: "2024",
    title: "Discovered the gap",
    desc: "Spent months experimenting with Clay and Smartlead. Realised none of them let you target leads by real-world conditions — like shops with no website or a slow, outdated one.",
  },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[420px] bg-violet-600/8 rounded-full blur-[130px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-violet-500/40 to-indigo-500/40 blur-md" />
              <Image
                src="/Ayushpro.jpeg"
                alt="Ayush Saha"
                width={112}
                height={112}
                className="relative w-28 h-28 rounded-3xl object-cover object-top"
                priority
              />
            </div>

            {/* Identity */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Open to connect
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 leading-tight">
                Ayush Saha
              </h1>
              <p className="text-lg text-violet-400 font-medium mb-4">
                Founder &amp; CEO,{" "}
                <Link href="/" className="hover:text-violet-300 transition-colors underline underline-offset-4 decoration-violet-500/40">
                  Flowfiy
                </Link>
              </p>
              <p className="text-zinc-400 leading-relaxed max-w-xl mb-6">
                Building the AI sales engine that replaces the manual SDR stack — Flowfiy finds
                real businesses on Google Maps, researches each one, scores it 0–100 by how much
                it needs your service, and writes the outreach, so any team can run a
                world-class pipeline without hiring a single salesperson.
                Obsessed with AI, B2B sales, and making complex things simple.
              </p>

              {/* Social links */}
              <div className="flex items-center flex-wrap gap-3">
                <a
                  href="https://twitter.com/flowfiy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  <Twitter className="w-4 h-4" /> Twitter
                </a>
                <a
                  href="https://linkedin.com/company/flowfiy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
                <a
                  href="https://github.com/flowfiy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  <Github className="w-4 h-4" /> GitHub
                </a>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  <Mail className="w-4 h-4" /> Email
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What I'm building ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-5 block">Currently building</span>
          <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-8 hover:border-violet-500/30 transition-colors">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Globe className="w-7 h-7 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-white">Flowfiy</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                    Live
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed mb-5">
                  The end-to-end AI sales engine. Describe the leads you want in plain
                  English — even by real-world conditions like &ldquo;coffee shops with no
                  website&rdquo; — and Flowfiy finds real businesses on Google Maps (plus a B2B
                  people database), researches and scores each 0–100 by how much they need your
                  service, and writes personalised cold emails plus follow-ups, ready to send
                  from your own Gmail. No SDR. No manual research.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: Zap, label: "Plain English", sublabel: "Describe your leads" },
                    { icon: TrendingUp, label: "$50/mo", sublabel: "400 credits" },
                    { icon: Users, label: "600–800 leads", sublabel: "Per month" },
                    { icon: Sparkles, label: "Fully managed", sublabel: "No API keys" },
                  ].map(({ icon: Icon, label, sublabel }) => (
                    <div key={label} className="bg-white/[0.03] border border-white/6 rounded-xl p-3 text-center">
                      <Icon className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{sublabel}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25"
                  >
                    Get started <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all"
                  >
                    How it works
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Journey ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-5 block">Journey</span>
          <h2 className="text-2xl font-bold text-white mb-10">How I got here</h2>
          <div className="relative pl-6 border-l border-white/10 space-y-8">
            {timeline.map(({ year, title, desc }, i) => (
              <div key={year} className="relative">
                <div className="absolute -left-[1.85rem] w-3.5 h-3.5 rounded-full border-2 border-violet-500 bg-zinc-950 top-1" />
                <span className="text-xs font-mono text-violet-400 mb-1.5 block">{year}</span>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-5 block">Expertise</span>
          <h2 className="text-2xl font-bold text-white mb-8">What I work with</h2>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 rounded-xl border border-white/8 bg-zinc-900/50 text-sm text-zinc-300 hover:border-violet-500/30 hover:text-white hover:bg-violet-500/5 transition-all cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open to ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-5 block">Open to</span>
          <h2 className="text-2xl font-bold text-white mb-3">Let&apos;s work together</h2>
          <p className="text-zinc-400 mb-10 max-w-xl">
            I&apos;m always interested in connecting with the right people. Here are the ways we can collaborate.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {openTo.map(({ icon: Icon, title, desc, href, cta }) => (
              <div
                key={title}
                className="bg-zinc-900/50 border border-white/6 rounded-2xl p-6 hover:border-violet-500/20 transition-colors flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-5 flex-1">{desc}</p>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
                >
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-6">
            <Mail className="w-3.5 h-3.5" />
            Say hello
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to reach out directly?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Whether you&apos;re building something interesting, want to try Flowfiy, or just want to
            talk AI and sales — my inbox is open.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25"
            >
              Send a message <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
