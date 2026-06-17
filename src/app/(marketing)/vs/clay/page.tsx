import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy vs Clay — AI Sales Outreach Comparison 2026",
  description:
    "Flowfiy vs Clay for AI-powered B2B lead generation. Clay is enrichment-only and needs setup; Flowfiy is a fully managed outbound pipeline — describe your leads in plain English, get qualified prospects and written outreach. From $50/mo for 400 credits.",
  keywords: [
    "Flowfiy vs Clay",
    "Clay alternative",
    "Clay competitor",
    "Clay vs Flowfiy",
    "AI sales tool comparison 2026",
    "Clay alternative pricing",
    "managed outbound tool",
    "plain English lead generation",
  ],
  openGraph: {
    title: "Flowfiy vs Clay — Which AI Sales Tool Should You Use?",
    description: "Full comparison of Flowfiy and Clay for B2B outreach automation. Pricing, features, and use cases. Flowfiy from $50/mo for 400 credits.",
    url: "/vs/clay",
  },
  alternates: { canonical: "/vs/clay" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Flowfiy vs Clay — Comparison 2026",
  description: "Comparison of Flowfiy and Clay for AI-powered B2B sales outreach. Flowfiy offers a fully managed outbound pipeline from $50/mo for 400 credits vs Clay's enrichment-only, setup-heavy model.",
  inLanguage: "en",
};

const rows = [
  { feature: "Describe leads in plain English", outbound: true, clay: false },
  { feature: "Condition-based targeting (e.g. \"no website\", \"bad reviews\")", outbound: true, clay: "Partial" },
  { feature: "Smart clarifying questions", outbound: true, clay: false },
  { feature: "AI qualification scoring (0–100)", outbound: true, clay: false },
  { feature: "AI-written personalized emails + follow-ups", outbound: true, clay: "Via integrations" },
  { feature: "Gmail sending after review", outbound: true, clay: false },
  { feature: "Fully managed AI — no API keys", outbound: true, clay: false },
  { feature: "Managed data sources + email verification", outbound: true, clay: "Setup required" },
  { feature: "No per-tool setup or workflows", outbound: true, clay: false },
  { feature: "Team workspaces", outbound: true, clay: true },
  { feature: "Pay only for qualified leads", outbound: true, clay: false },
  { feature: "Starting price", outbound: "$50/mo · 400 credits", clay: "$149/mo" },
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
              Clay is a powerful data enrichment and workflow tool that you configure yourself. Flowfiy is a fully managed outbound pipeline — describe the leads you want in plain English and it finds, qualifies, and writes the outreach. No API keys, no workflow setup.
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
                    "You want a full AI pipeline — describe to sent email — in one tool",
                    "You want it fully managed with no API keys or workflow setup",
                    "You want condition-based targeting and AI scoring before any email is sent",
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
                content: "Clay uses a credit-based model starting at $149/mo for 1,000 credits, and complex enrichment waterfalls consume multiple credits per row — costs grow substantially at scale. Flowfiy is one simple plan: $50/mo for 400 credits (about 600–800 leads, varies by search), billed in your local currency. You only pay for qualified leads — an empty search costs nothing — and subscribers can top up extra credits anytime.",
              },
              {
                title: "Plain-English targeting",
                content: "With Clay you build the search yourself — pick sources, set filters, wire up the workflow. Flowfiy lets you describe the leads you want in plain English and asks smart clarifying questions when needed. It also handles qualitative conditions Clay can&apos;t express simply, like \"coffee shops with no website,\" \"dentists with bad reviews,\" or \"SaaS that recently raised.\"",
              },
              {
                title: "Email sending",
                content: "Clay does not send emails. It outputs a table of data that you push to a sequencer (Smartlead, Instantly, Outreach, etc.) — which means an additional tool, additional cost, and additional integration to manage. Flowfiy writes personalized cold emails plus follow-ups and sends them from your own Gmail after you review. No additional sequencer needed.",
              },
              {
                title: "AI qualification",
                content: "Clay enriches data — it doesn&apos;t score it. You can build scoring formulas with Clay&apos;s column logic, but it requires manual setup per campaign. Flowfiy automatically researches and scores every lead 0–100 against your criteria, includes written reasoning per lead, and gates outreach to only qualified contacts — all fully managed.",
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
            <h2 className="text-3xl font-bold text-white mb-4">Skip the setup — just describe your leads</h2>
            <p className="text-zinc-400 mb-8">$50/mo for 400 credits (about 600–800 leads). No API keys, no workflows. You only pay for qualified leads.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
                Get started <ArrowRight className="w-4 h-4" />
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
