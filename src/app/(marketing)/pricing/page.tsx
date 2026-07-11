import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy Pricing — $50/mo for 400 lead credits (no API keys)",
  description:
    "Flowfiy pricing: one simple plan at $50/month for 400 credits (~600–800 leads). No API keys — AI is fully managed. Describe the leads you want in plain English; buy more credits anytime.",
  keywords: [
    "Flowfiy pricing",
    "AI sales engine pricing",
    "AI lead generation pricing",
    "lead credits",
    "AI SDR cost",
    "Google Maps lead generation pricing",
  ],
  openGraph: {
    title: "Flowfiy Pricing — $50/mo, 400 credits",
    description:
      "One plan, no API keys. $50/month for 400 credits (~600–800 leads). Describe the leads you want and Flowfiy finds, qualifies and writes outreach.",
    url: "/pricing",
  },
  alternates: { canonical: "/pricing" },
};

const features = [
  "400 credits every month",
  "≈ 600–800 leads (varies by search)",
  "No API keys — AI fully managed",
  "Describe leads in plain English",
  "Condition-based targeting (no website, bad reviews, slow site…)",
  "AI-personalized emails + 3 follow-ups",
  "Send from your own Gmail",
  "Buy extra credits anytime",
];

const faqs = [
  {
    q: "How does pricing work?",
    a: "One plan: $50/month gives you 400 credits. You spend credits as Flowfiy delivers qualified leads — roughly 2 leads per credit, though it varies by how specific your search is. You only pay for qualified leads you actually get.",
  },
  {
    q: "Do I need an API key (Anthropic, Apollo, etc.)?",
    a: "No. Everything — the AI, the data sources, email verification — is fully managed by Flowfiy. You just describe the leads you want.",
  },
  {
    q: "What is a credit?",
    a: "A credit is Flowfiy's in-app currency (1 credit = ₹10). Each search reserves an estimated number of credits, then charges the actual cost when it finishes — you're never charged more than the estimate you approve, and an empty search costs nothing.",
  },
  {
    q: "Can I buy more credits mid-month?",
    a: "Yes. Active subscribers can top up any time — pick how many credits you want and pay the live-calculated price. Top-up credits never expire mid-cycle and spend at the same rate.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Upgrade, downgrade, or cancel from your billing settings; changes apply from your next billing cycle.",
  },
];

const offerJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Flowfiy",
  description:
    "AI sales engine — finds real businesses on Google Maps, researches each one, scores it 0–100 by how much it needs your service, and writes personalized outreach from your Gmail, metered by credits.",
  brand: { "@type": "Brand", name: "Flowfiy" },
  offers: {
    "@type": "Offer",
    name: "Flowfiy plan",
    price: "50",
    priceCurrency: "USD",
    description: "$50/month for 400 credits (~600–800 leads). No API keys.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div>
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5">
              One simple plan
            </h1>
            <p className="text-lg text-zinc-400">
              No API keys, no per-tool setup. Describe the leads you want — Flowfiy does the rest,
              metered by credits.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-md mx-auto">
            <div className="flex flex-col rounded-2xl border border-violet-500/50 bg-violet-500/[0.06] p-7">
              <span className="self-start mb-3 rounded-full bg-violet-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                Everything included
              </span>
              <h2 className="text-lg font-semibold text-white">Flowfiy</h2>
              <p className="mt-1 text-xs text-zinc-500">Managed AI lead generation.</p>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">$50</span>
                <span className="text-sm text-zinc-500">/month · 400 credits</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Billed in your local currency (₹ in India).</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-7 inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs text-zinc-500">
                Need more? Buy extra credits anytime from billing.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Pricing FAQ</h2>
            <div className="space-y-5">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <h3 className="font-semibold text-white mb-2">{f.q}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
