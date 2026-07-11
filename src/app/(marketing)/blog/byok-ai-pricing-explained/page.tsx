import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Why We Removed API Keys: Simple Credit Pricing | Flowfiy Blog",
  description:
    "We used to ask you to bring your own API keys. Now the AI is fully managed and you pay one simple price: $50/month for 400 credits. Here's why we made the switch and what it means for you.",
  keywords: [
    "AI sales tool pricing",
    "credit-based AI pricing",
    "no API key AI tool",
    "managed AI lead generation",
    "Flowfiy pricing",
    "AI outbound sales cost",
    "credit pricing AI SaaS",
    "pay per qualified lead",
  ],
  openGraph: {
    title: "Why We Removed API Keys: Simple Credit Pricing",
    description: "Why Flowfiy dropped bring-your-own-key for fully managed AI billed by credits — $50/month for 400 credits.",
    url: "/blog/byok-ai-pricing-explained",
    type: "article",
  },
  alternates: { canonical: "/blog/byok-ai-pricing-explained" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Why We Removed API Keys: Simple Credit Pricing",
  description: "Explains why Flowfiy moved from bring-your-own-key pricing to fully managed AI billed by credits.",
  datePublished: "2026-04-28",
  author: { "@type": "Organization", name: "Flowfiy" },
  publisher: { "@type": "Organization", name: "Flowfiy" },
};

export default function BlogPostCreditPricing() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-zinc-500 text-sm hover:text-zinc-300 mb-10 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">Product</span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> 5 min read</span>
              <span className="text-xs text-zinc-600">Apr 28, 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
              Why We Removed API Keys: Simple Credit Pricing
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              We used to ask you to bring your own API keys. Now the AI is fully managed and you pay one simple price: $50/month for 400 credits. Here&apos;s why we made the switch.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 leading-relaxed">

            <p>
              When we first launched Flowfiy, we asked customers to bring their own API keys — connect an AI account, connect a data provider, manage the billing for each. It worked, but it put setup friction and a stack of separate bills between you and your first batch of leads.
            </p>
            <p>
              So we removed the keys entirely. The AI and the data sources are now fully managed, and you pay one simple price. Here&apos;s exactly why — and what it means for you.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">What bring-your-own-key actually cost you</h2>
            <p>
              On the old model you signed up for an AI provider, generated a key, added a payment method, then did the same for a data source. Every run touched two or three separate accounts you had to top up, monitor, and reconcile yourself.
            </p>

            <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Old bring-your-own-key setup vs. fully managed today</p>
              <div className="space-y-3">
                {[
                  ["Accounts you had to create and fund", "2–3 separate"],
                  ["Time before your first lead", "30–60 min setup"],
                  ["Bills to reconcile each month", "AI + data + email"],
                  ["Flowfiy today: keys to manage", "0"],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{label}</span>
                    <span className={`font-mono font-semibold ${(val as string) === "0" ? "text-green-400" : "text-white"}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <p>
              For a few power users that was fine. For everyone else it meant juggling provider dashboards, surprise overages, and a setup checklist before they could even describe their first search. We decided that was the wrong thing to ask.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">What credits mean in practice</h2>
            <p>
              Now there are no keys to connect. The AI runs on fully managed Google Gemini, the lead sources are built in, and email verification and enrichment are included. You describe the leads you want in plain English and Flowfiy finds real businesses on Google Maps, qualifies them by how much they need your service, and writes the outreach.
            </p>
            <p>
              You pay in <strong className="text-white">credits</strong>. One subscription is $50/month for 400 credits — roughly 600–800 leads, depending on the search. A credit is about two qualified leads, and you only pay for leads that qualify. An empty search costs nothing.
            </p>
            <p>
              What Flowfiy charges for is the <strong className="text-white">whole managed pipeline</strong>: condition-based targeting, the research and 0–100 scoring on every lead, the personalized cold emails and follow-ups, the Gmail send-after-review flow, and the infrastructure underneath. No keys, no per-tool setup, no separate bills.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">The math at scale</h2>
            <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Cost comparison at ~700 qualified leads/month</p>
              <div className="space-y-4">
                <div className="border border-white/8 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-2">Per-lead competitor (at $1.00/lead)</p>
                  <p className="text-2xl font-bold font-mono text-white">$700/mo</p>
                  <p className="text-xs text-zinc-600 mt-1">Scales straight up with volume</p>
                </div>
                <div className="border border-violet-500/30 rounded-lg p-4 bg-violet-950/20">
                  <p className="text-xs text-zinc-500 mb-2">Flowfiy (one plan, all-in)</p>
                  <p className="text-2xl font-bold font-mono text-white">$50/mo</p>
                  <p className="text-xs text-zinc-600 mt-1">400 credits ≈ 600–800 leads · AI, data and email included</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-4">Savings at ~700 leads/month: <span className="text-green-400 font-semibold">~$650/mo</span></p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-10">Why we built it this way</h2>
            <p>
              There are two reasons, and both come down to what we think is right:
            </p>
            <p>
              <strong className="text-white">1. Alignment of incentives.</strong> You only spend credits on leads that actually qualify — an empty search costs nothing. That means we win when the search is good, not when it&apos;s big. There&apos;s no incentive for us to pad your results with junk, because junk doesn&apos;t get charged.
            </p>
            <p>
              <strong className="text-white">2. One price, zero ops.</strong> The hard, valuable part of Flowfiy isn&apos;t the raw AI — it&apos;s the condition-based targeting, the research and 0–100 scoring on every lead, the quality guardrails, the job queue with retries, and the Gmail send flow. We run and pay for the AI and data providers ourselves so you get one predictable bill instead of three dashboards and a stack of surprise overages.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">The one tradeoff</h2>
            <p>
              With managed pricing you don&apos;t see the raw provider invoices, and you don&apos;t pick the underlying AI model — we do, and we tune it per task. In exchange you get a fixed monthly price, no key management, and no exposure to per-token billing swings.
            </p>
            <p>
              For teams that want to micromanage every provider line item, a bring-your-own-key tool might feel more hands-on. But for revenue teams who just want qualified leads with a predictable cost, one managed plan is almost always the better deal.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

          <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">See the full pricing breakdown</h3>
            <p className="text-zinc-400 text-sm mb-6">$50/month for 400 credits — no API keys. Describe your first search in minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-12">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">Continue reading</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/how-to-set-up-flowfiy", title: "How to Set Up Flowfiy: The Complete 4-Step Setup Guide" },
                { href: "/blog/how-ai-agents-replace-sdrs", title: "How AI Is Replacing the Entire SDR Stack in 2026" },
                { href: "/blog/cold-email-personalization-2026", title: "Why Personalization Depth Beats Volume: Cold Email in 2026" },
              ].map((p) => (
                <Link key={p.href} href={p.href} className="group block p-5 bg-zinc-900/40 border border-white/6 rounded-xl hover:border-violet-500/20 transition-colors">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors leading-snug">{p.title}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400 group-hover:gap-2 transition-all">Read <ArrowRight className="w-3 h-3" /></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
