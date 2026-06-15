import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "BYOK AI Pricing: Why Flowfiy Doesn't Charge Per Lead | Flowfiy Blog",
  description:
    "Most AI sales tools charge $0.50–$2.00 per lead — that's ₹40–₹160 per contact. Flowfiy's BYOK model charges ₹0 per generation on Indie plan. Here's the full math on BYOK pricing and why it's the right model for Indian startups.",
  keywords: [
    "BYOK AI India",
    "bring your own API key India",
    "AI SaaS pricing India",
    "Claude API BYOK",
    "AI sales tool cost India",
    "Flowfiy pricing India",
    "affordable AI sales tool India",
    "cheap AI lead generation India",
  ],
  openGraph: {
    title: "BYOK AI Pricing: Why Flowfiy Doesn't Charge Per Lead",
    description: "The math behind Bring Your Own Key AI pricing — why it's better for Indian startups than per-lead fees.",
    url: "/blog/byok-ai-pricing-explained",
    type: "article",
  },
  alternates: { canonical: "/blog/byok-ai-pricing-explained" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "BYOK AI Pricing: Why We Don't Charge Per Lead Generation",
  description: "Explains the BYOK (Bring Your Own Key) pricing model for AI SaaS and why it benefits customers over per-lead fees.",
  datePublished: "2026-04-28",
  author: { "@type": "Organization", name: "Flowfiy" },
  publisher: { "@type": "Organization", name: "Flowfiy" },
};

export default function BlogPostBYOK() {
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
              BYOK AI Pricing: Why We Don&apos;t Charge Per Lead Generation
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Most AI sales tools charge $0.50–$2.00 per lead. We charge $0. Here&apos;s the math behind BYOK and why it&apos;s the only honest model for AI SaaS in 2026.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 leading-relaxed">

            <p>
              When we designed Flowfiy&apos;s pricing, we had a choice: charge per lead generation (like most AI tools do) or charge for platform access only and let users bring their own API key.
            </p>
            <p>
              We chose BYOK. Here&apos;s exactly why — and what it means for you as a customer.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">What most AI tools actually charge you</h2>
            <p>
              The typical model: you pay the platform a per-lead or per-generation fee. The platform takes your request, runs it through their LLM account (usually the same Claude or GPT-4 you could access directly), and charges you a markup.
            </p>

            <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Typical AI sales tool cost per full lead pipeline</p>
              <div className="space-y-3">
                {[
                  ["Actual Claude API cost (ICP + research + qualification + copy)", "~$0.008–$0.015"],
                  ["What competitor platforms charge", "$0.50–$2.00"],
                  ["Platform markup", "33x–250x"],
                  ["Flowfiy per-generation cost to you", "$0.00"],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{label}</span>
                    <span className={`font-mono font-semibold ${(val as string).includes("$0.00") ? "text-green-400" : "text-white"}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <p>
              The markup on AI inference costs at most platforms is somewhere between 33x and 250x. You pay for the convenience of not having your own API key. But getting your own Anthropic API key takes 5 minutes.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">What BYOK means in practice</h2>
            <p>
              BYOK (Bring Your Own Key) means you connect your Anthropic API key directly to Flowfiy. When our pipeline runs Claude agents on your behalf, the API calls are billed directly to your Anthropic account — not through us.
            </p>
            <p>
              We never see your tokens. We never mark them up. Your Claude usage appears in your Anthropic billing dashboard exactly as it would if you built the pipeline yourself.
            </p>
            <p>
              What Flowfiy charges for is the <strong className="text-white">platform intelligence</strong>: the orchestration, the 5-agent pipeline design, the BullMQ job queue, the multi-tenant isolation, the Gmail integration, the Apify scraping infrastructure, the qualification scoring logic. The hard engineering work that you&apos;d otherwise spend months building.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">The math at scale</h2>
            <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Cost comparison at 2,000 leads/month (Growth plan)</p>
              <div className="space-y-4">
                <div className="border border-white/8 rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-2">Competitor (per-lead model at $1.00/lead)</p>
                  <p className="text-2xl font-bold font-mono text-white">$2,000/mo</p>
                  <p className="text-xs text-zinc-600 mt-1">AI inference costs only</p>
                </div>
                <div className="border border-violet-500/30 rounded-lg p-4 bg-violet-950/20">
                  <p className="text-xs text-zinc-500 mb-2">Flowfiy (Growth plan + your Claude API key)</p>
                  <p className="text-2xl font-bold font-mono text-white">₹9,900 + ~$25</p>
                  <p className="text-xs text-zinc-600 mt-1">Platform (₹9,900) + actual Anthropic API cost (~$0.012/lead × 2,000)</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-4">Savings at 2,000 leads/month: <span className="text-green-400 font-semibold">$1,876/mo</span></p>
            </div>

            <h2 className="text-2xl font-bold text-white mt-10">Why we built it this way</h2>
            <p>
              There are two reasons, and both come down to what we think is right:
            </p>
            <p>
              <strong className="text-white">1. Alignment of incentives.</strong> Per-lead pricing creates a perverse incentive: we profit more when we run more (and worse) pipelines. BYOK means we win only when the platform is genuinely valuable — when you stay subscribed because the orchestration, not the inference, is worth paying for.
            </p>
            <p>
              <strong className="text-white">2. Transparency about what you&apos;re buying.</strong> LLM inference is a commodity. Anyone can run Claude. What&apos;s hard to build is the multi-agent pipeline, the quality guardrails, the job queue with proper retry logic, the encrypted credential storage, and the Gmail integration. That&apos;s what Flowfiy sells. The AI itself, you already have access to.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10">The one tradeoff</h2>
            <p>
              BYOK does require you to have an Anthropic account and a valid API key. If you&apos;ve never used the Claude API before, this is a 5-minute setup — create an account at console.anthropic.com, add a payment method, generate a key.
            </p>
            <p>
              For teams that want zero infrastructure ownership and are happy paying per-lead premiums, a different platform might feel simpler. But for revenue teams who want to understand and control their costs, BYOK is almost always the better deal within the first month.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

          <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">See the full pricing breakdown</h3>
            <p className="text-zinc-400 text-sm mb-6">Start with 100 free generations. Connect your Claude API key in under 5 minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-12">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">Continue reading</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/how-to-set-up-flowfiy", title: "How to Set Up Flowfiy: The Complete 7-Step Setup Guide" },
                { href: "/blog/how-ai-agents-replace-sdrs", title: "How 5 AI Agents Are Replacing the Entire SDR Stack in 2026" },
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
