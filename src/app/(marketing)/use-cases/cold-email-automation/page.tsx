import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Cold Email Automation Software India — AI-Personalized Outreach | Flowfiy",
  description:
    "India's best cold email automation software. Flowfiy researches every prospect, qualifies them 0–100, and writes hyper-personalized subject lines, email bodies, and follow-ups. Send from Gmail. Start free. Plans from ₹1,700/mo.",
  keywords: [
    "cold email automation software India",
    "automated cold outreach India",
    "AI cold email tool India",
    "personalized cold email automation India",
    "B2B email automation India 2026",
    "Gmail cold email automation",
    "cold email software India",
    "AI-powered cold email India",
    "best cold email tool India",
    "cold outreach automation India",
  ],
  openGraph: {
    title: "Cold Email Automation India — AI-Personalized Outreach at Scale | Flowfiy",
    description: "India's AI cold email platform. Research, qualify, write, and send — AI handles the entire cold email pipeline from your Gmail. Plans from ₹1,700/mo.",
    url: "/use-cases/cold-email-automation",
  },
  alternates: { canonical: "/use-cases/cold-email-automation" },
};

export default function ColdEmailAutomationPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-indigo-600/7 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Use case: Cold Email Automation
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.08]">
            Cold email that actually{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              gets replied to.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Flowfiy researches every prospect, qualifies them before you see them, and writes emails so specific they read like a human spent an hour on each one — then sends them from your Gmail.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Start automating cold email free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-zinc-600 mt-5">100 free generations · Gmail OAuth · BYOK Claude · No credit card</p>
        </div>
      </section>

      {/* Key results */}
      <section className="border-b border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["18.7%", "Avg reply rate (4+ specific facts)"],
            ["4+", "Company-specific facts per email"],
            ["~25s", "Email generation time per lead"],
            ["$0", "AI cost per email (BYOK)"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold font-mono text-white mb-1">{val}</p>
              <p className="text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → solution */}
      <section className="py-24 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">The old way</p>
              <div className="space-y-4">
                {[
                  "SDR spends 30–45 min researching each company manually",
                  "Writes a generic template with one merge field",
                  "Sends 50 near-identical emails and waits",
                  "Gets 1–3% reply rate and wonders why",
                  "Spends $80k–$120k/yr on SDR salary for this",
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
              <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-5">With Flowfiy</p>
              <div className="space-y-4">
                {[
                  "AI scrapes every company website in 10–15 seconds",
                  "Claude writes emails with 4+ specific, researched facts",
                  "Only qualified leads (score ≥ threshold) get an email",
                  "Reply rates of 12–20% from deeply personalized outreach",
                  "Full pipeline runs at ~$0.015/lead in Claude API costs",
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

      {/* Email anatomy */}
      <section className="py-24 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">What AI writes</span>
            <h2 className="text-3xl font-bold text-white mb-3">A full sequence, not just a first email</h2>
            <p className="text-zinc-400 max-w-xl">For every qualified lead, the Personalization Agent generates a complete 3-touch sequence.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Email 1 — First touch",
                subject: "Your [specific product feature] → [pain point they'd care about]",
                desc: "Opens with one specific observation from company research. Bridges to your solution in 1–2 sentences. Single clear CTA.",
              },
              {
                label: "Email 2 — Follow-up (Day 3)",
                subject: "Re: [original subject]",
                desc: "Adds a relevant social proof element (customer story or stat) directly applicable to their industry. Softer ask.",
              },
              {
                label: "Email 3 — Break-up (Day 7)",
                subject: "Should I stop reaching out?",
                desc: "Short, human break-up email. Gives them an easy out while leaving the door open. Often highest reply rate of the sequence.",
              },
            ].map(({ label, subject, desc }) => (
              <div key={label} className="bg-zinc-900/40 border border-white/6 rounded-2xl p-6">
                <p className="text-xs font-medium text-violet-400 mb-3">{label}</p>
                <p className="text-sm font-mono text-zinc-400 mb-2 bg-zinc-800/50 rounded px-3 py-1.5">Subject: {subject}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverability */}
      <section className="py-20 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Gmail-native sending — no shared IP headaches</h2>
          <p className="text-zinc-400 leading-relaxed mb-8 max-w-2xl">
            Flowfiy sends emails directly from your Gmail account via OAuth. Your domain, your IP reputation, your inbox. No shared sending infrastructure, no warm-up periods, no deliverability roulette.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: "Your domain", desc: "Emails come from you@yourcompany.com, not a shared sender pool." },
              { title: "OAuth security", desc: "Gmail access is granted via OAuth — we never store your password." },
              { title: "Reply tracking", desc: "Replies come directly to your inbox and update lead status automatically." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-zinc-900/40 border border-white/6 rounded-xl p-5">
                <p className="font-semibold text-white mb-2">{title}</p>
                <p className="text-sm text-zinc-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Send your first AI-personalized campaign</h2>
          <p className="text-zinc-400 mb-8">Start free. 50 full pipeline runs. Your Claude key, your Gmail, your pipeline.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30">
              Get started free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/blog/cold-email-personalization-2026" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-zinc-300 font-medium hover:border-white/20 hover:text-white transition-all">
              Read the cold email guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
