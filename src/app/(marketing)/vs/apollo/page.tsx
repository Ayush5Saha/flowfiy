import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy vs Apollo.io — AI Outbound Comparison 2026",
  description:
    "Flowfiy vs Apollo.io for AI-powered B2B outreach. Apollo gives you a contact database you have to set up; with Flowfiy you just describe the leads you want — no Apollo account, no keys — and it finds, qualifies, and writes the outreach. One plan: $50/mo for 400 credits.",
  keywords: [
    "Flowfiy vs Apollo",
    "Apollo.io alternative",
    "Apollo competitor",
    "Apollo vs Flowfiy",
    "AI sales tool comparison 2026",
    "Apollo alternative pricing",
    "best Apollo alternative for outbound",
    "AI lead generation vs Apollo",
  ],
  openGraph: {
    title: "Flowfiy vs Apollo.io — AI Sales Platform Comparison 2026",
    description: "How Flowfiy compares to Apollo.io for B2B lead generation and outreach automation. One plan: $50/mo for 400 credits.",
    url: "/vs/apollo",
  },
  alternates: { canonical: "/vs/apollo" },
};

const rows = [
  { feature: "Describe leads in plain English", outbound: true, apollo: false },
  { feature: "Condition-based targeting (e.g. \"no website\", \"bad reviews\")", outbound: true, apollo: false },
  { feature: "Fully managed data sources — no account to set up", outbound: true, apollo: false },
  { feature: "AI company research on every prospect", outbound: true, apollo: false },
  { feature: "AI qualification scoring (0–100)", outbound: true, apollo: false },
  { feature: "AI-written personalized email copy", outbound: true, apollo: "Basic AI assist" },
  { feature: "Multi-step follow-ups", outbound: "Campaign follow-ups", apollo: true },
  { feature: "Gmail OAuth sending", outbound: true, apollo: true },
  { feature: "API keys required", outbound: "None", apollo: "Apollo account" },
  { feature: "Pay only for qualified leads", outbound: true, apollo: false },
  { feature: "CRM integrations", outbound: "Roadmap", apollo: true },
  { feature: "Multi-tenant team workspaces", outbound: true, apollo: true },
  { feature: "Starting price", outbound: "$50/mo — 400 credits", apollo: "$49/mo" },
];

export default function VsApolloPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-indigo-600/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            Comparison
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Flowfiy vs Apollo.io:{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              A database vs. a done-for-you pipeline
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Apollo.io is a contact database with a built-in sequencer — you set up an account, build filters, and do the research and writing yourself. With Flowfiy there&apos;s no Apollo account and no keys: you describe the leads you want in plain English, and it finds matching businesses, researches and scores each one, then writes the personalized outreach for you.
          </p>
        </div>
      </section>

      {/* TL;DR */}
      <section className="py-12 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-6">TL;DR</p>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-zinc-900/50 border border-white/6 rounded-2xl p-6">
              <p className="font-semibold text-white mb-3">Apollo.io is better for...</p>
              <ul className="space-y-2">
                {[
                  "Browsing a large contact database yourself",
                  "Multi-step email sequences with A/B testing",
                  "CRM sync (Salesforce, HubSpot)",
                  "Dialer + LinkedIn integration in one platform",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="mt-0.5 shrink-0 text-zinc-600">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-6">
              <p className="font-semibold text-white mb-3">Flowfiy gives you...</p>
              <ul className="space-y-2">
                {[
                  "Just describe your leads — no Apollo account, no keys",
                  "Condition-based targeting like \"shops with a slow or outdated site\"",
                  "0–100 qualification scoring before any email is sent",
                  "AI-written emails with specific facts per lead, plus follow-ups",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature table */}
      <section className="py-16 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-zinc-900/60">
                  <th className="text-left py-4 px-5 font-medium text-zinc-400">Feature</th>
                  <th className="text-center py-4 px-5 font-semibold text-white">Flowfiy</th>
                  <th className="text-center py-4 px-5 font-medium text-zinc-400">Apollo.io</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(({ feature, outbound, apollo }) => (
                  <tr key={feature} className="bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-5 text-zinc-300">{feature}</td>
                    <td className="py-3.5 px-5 text-center">
                      {outbound === true ? (
                        <Check className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-violet-300 text-xs font-medium">{outbound}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {apollo === true ? (
                        <Check className="w-4 h-4 text-zinc-400 mx-auto" />
                      ) : apollo === false ? (
                        <X className="w-4 h-4 text-zinc-600 mx-auto" />
                      ) : (
                        <span className="text-zinc-500 text-xs">{apollo}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How they work together */}
      <section className="py-16 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">How Flowfiy replaces the Apollo workflow</h2>
          <p className="text-zinc-400 leading-relaxed mb-8">
            With Apollo you set up an account, learn the filters, build lists, then export them somewhere to research and write. Flowfiy collapses all of that into one step: you describe the leads you want in plain English, and it asks smart clarifying questions when needed.
            The data sources are fully managed, so there&apos;s nothing to connect — Flowfiy finds matching businesses, researches and scores each one 0–100, writes personalized emails plus follow-ups, and sends from your own Gmail after review.
          </p>
          <div className="bg-zinc-900/50 border border-white/6 rounded-2xl p-6">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">The whole stack, managed</p>
            <div className="space-y-3">
              {[
                ["Plain-English request", "Describe your ideal leads — no account, no filters to learn"],
                ["Flowfiy", "Managed data sources, AI research, scoring, personalized copy"],
                ["Gmail (your account)", "Sending — native OAuth, no shared IP pools"],
              ].map(([tool, role]) => (
                <div key={tool as string} className="flex items-start gap-4">
                  <span className="text-sm font-semibold text-white shrink-0 w-36">{tool}</span>
                  <span className="text-sm text-zinc-400">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Skip the database — just describe your leads</h2>
          <p className="text-zinc-400 mb-8">
            No Apollo account, no keys, no filters to learn. Describe the leads you want and Flowfiy finds, qualifies, and writes the outreach. One plan: $50/mo for 400 credits, and you only pay for qualified leads.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/vs/clay" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all">
              Compare vs Clay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
