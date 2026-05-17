import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy vs Clay — AI Sales Outreach Comparison 2026",
  description:
    "Comparing Flowfiy vs Clay for AI-powered B2B lead generation and outreach. Clay is a data enrichment tool; Flowfiy is a full outbound pipeline with 5 Claude AI agents, Gmail sending, and BYOK pricing.",
  keywords: ["Flowfiy vs Clay", "Clay alternative", "Clay competitor", "Clay vs Flowfiy", "AI sales tool comparison 2026", "Clay alternative BYOK"],
  openGraph: {
    title: "Flowfiy vs Clay — Which AI Sales Tool Is Right for You?",
    description: "Full comparison of Flowfiy and Clay for B2B outreach automation. Pricing, features, and use cases.",
    url: "/vs/clay",
  },
  alternates: { canonical: "/vs/clay" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Flowfiy vs Clay",
  description: "Comparison of Flowfiy and Clay for AI-powered B2B sales outreach.",
};

const rows = [
  { feature: "AI lead research", outbound: true, clay: "Partial" },
  { feature: "5-agent Claude pipeline", outbound: true, clay: false },
  { feature: "AI qualification scoring (0–100)", outbound: true, clay: false },
  { feature: "AI-written personalized emails", outbound: true, clay: "Via integrations" },
  { feature: "Gmail OAuth sending", outbound: true, clay: false },
  { feature: "BYOK (Bring Your Own Flowfiy Key)", outbound: true, clay: false },
  { feature: "Per-lead AI cost to you", outbound: "$0", clay: "Credit-based" },
  { feature: "Apollo API integration", outbound: true, clay: true },
  { feature: "Apify web scraping", outbound: true, clay: "Via HTTP API" },
  { feature: "Multi-tenant team workspaces", outbound: true, clay: true },
  { feature: "AES-256 credential encryption", outbound: true, clay: "Unknown" },
  { feature: "Starting price", outbound: "$0 free tier", clay: "$149/mo" },
];

export default function VsClayPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        {/* Hero */}
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              Comparison
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              Flowfiy vs Clay:{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                What&apos;s the difference?
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
              Clay is a powerful data enrichment and workflow tool. Flowfiy is a complete outbound pipeline with 5 Claude AI agents, built-in Gmail sending, and a BYOK model that charges $0 per lead generation.
              They solve different problems — here&apos;s how to choose.
            </p>
          </div>
        </section>

        {/* TL;DR */}
        <section className="py-12 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-6">TL;DR</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-zinc-900/50 border border-white/6 rounded-2xl p-6">
                <p className="font-semibold text-white mb-3">Choose Clay if...</p>
                <ul className="space-y-2">
                  {[
                    "You need advanced data enrichment from 50+ sources",
                    "You&apos;re building custom outreach workflows from scratch",
                    "You have engineers comfortable with waterfall enrichment",
                    "You send via external tools (Smartlead, Instantly, Outreach)",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                      <span className="mt-0.5 shrink-0 text-zinc-600">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-6">
                <p className="font-semibold text-white mb-3">Choose Flowfiy if...</p>
                <ul className="space-y-2">
                  {[
                    "You want a full AI pipeline — research to sent email — in one tool",
                    "You want $0 per-lead AI cost (BYOK)",
                    "You want AI qualification scoring before any email is sent",
                    "You want Gmail-native sending without a separate sequencer",
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
                    <th className="text-center py-4 px-5 font-medium text-zinc-400">Clay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map(({ feature, outbound, clay }) => (
                    <tr key={feature} className="bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-5 text-zinc-300">{feature}</td>
                      <td className="py-3.5 px-5 text-center">
                        {outbound === true ? (
                          <Check className="w-4 h-4 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-violet-300 font-medium">{outbound}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {clay === true ? (
                          <Check className="w-4 h-4 text-zinc-400 mx-auto" />
                        ) : clay === false ? (
                          <X className="w-4 h-4 text-zinc-600 mx-auto" />
                        ) : (
                          <span className="text-zinc-500 text-xs">{clay}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Deep dive */}
        <section className="py-16 px-4 sm:px-6 border-b border-white/5">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-2xl font-bold text-white">Where they differ most</h2>

            {[
              {
                title: "Pricing model",
                content: "Clay uses a credit-based model starting at $149/mo for 1,000 credits. Complex enrichment waterfalls consume multiple credits per row. At scale, Clay costs can grow substantially. Flowfiy charges a flat monthly platform fee ($49–$249) with $0 per-generation AI cost because you use your own Flowfiy API key — typically $0.008–$0.015 per full lead pipeline at Anthropic list rates.",
              },
              {
                title: "AI email writing",
                content: "Clay can generate emails via AI integrations (typically via its Claude or OpenAI blocks), but you configure the workflow yourself. Flowfiy has a dedicated Personalization Agent (claude-sonnet-4-6) that automatically receives the company research and qualification outputs and writes a subject line, body, and two follow-ups per qualified lead — no workflow configuration required.",
              },
              {
                title: "Email sending",
                content: "Clay does not send emails. It outputs a table of data that you push to a sequencer (Smartlead, Instantly, Outreach, etc.) — which means an additional tool, additional cost, and additional integration to manage. Flowfiy includes Gmail OAuth sending natively. Campaigns send from your own inbox. No additional sequencer needed.",
              },
              {
                title: "AI qualification",
                content: "Clay enriches data — it doesn&apos;t score it. You can build scoring formulas with Clay&apos;s column logic, but it requires manual setup per campaign. Flowfiy&apos;s Qualification Agent automatically scores every lead 0–100 against your ICP, includes written reasoning per lead, and gates outreach to only qualified contacts.",
              },
            ].map(({ title, content }) => (
              <div key={title}>
                <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
                <p className="text-zinc-400 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Try Flowfiy free — no Clay credits needed</h2>
            <p className="text-zinc-400 mb-8">50 free lead generations. Bring your Flowfiy API key. Start building pipeline in under 30 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/vs/apollo" className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all">
                Compare vs Apollo.io
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
