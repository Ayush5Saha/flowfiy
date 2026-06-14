import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy Pricing — AI Sales Platform Plans from ₹1,700/mo (India)",
  description:
    "Flowfiy pricing: start free with 100 lead generations/month. Paid plans from ₹1,700/mo (Indie), ₹4,900 (Starter), ₹9,900 (Growth), ₹24,900 (Agency). INR pricing, no SDR needed, BYOK available.",
  keywords: [
    "Flowfiy pricing",
    "Flowfiy plans",
    "AI sales platform pricing India",
    "AI lead generation pricing India",
    "cold email automation pricing",
    "AI SDR cost India",
  ],
  openGraph: {
    title: "Flowfiy Pricing — Plans from ₹1,700/mo",
    description:
      "Start free, then scale. Flowfiy's AI outbound sales plans for Indian B2B teams — Indie ₹1,700, Starter ₹4,900, Growth ₹9,900, Agency ₹24,900.",
    url: "/pricing",
  },
  alternates: { canonical: "/pricing" },
};

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    blurb: "Try the full pipeline.",
    features: ["100 generations / month", "1 seat", "1 campaign", "BYOK supported"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Indie",
    price: "₹1,700",
    period: "/month",
    blurb: "For solo founders.",
    features: ["2,500 generations / month", "1 seat", "3 campaigns", "Bring your own Claude key"],
    cta: "Choose Indie",
    highlight: false,
  },
  {
    name: "Starter",
    price: "₹4,900",
    period: "/month",
    blurb: "Managed AI, no API key.",
    features: ["10,000 generations / month", "1 seat", "5 campaigns", "Managed Claude — no key needed"],
    cta: "Choose Starter",
    highlight: true,
  },
  {
    name: "Growth",
    price: "₹9,900",
    period: "/month",
    blurb: "For scaling teams.",
    features: ["30,000 generations / month", "5 seats", "Unlimited campaigns", "Priority support"],
    cta: "Choose Growth",
    highlight: false,
  },
  {
    name: "Agency",
    price: "₹24,900",
    period: "/month",
    blurb: "For agencies & high volume.",
    features: ["Unlimited generations", "20 seats", "Unlimited campaigns", "Dedicated support"],
    cta: "Choose Agency",
    highlight: false,
  },
];

const faqs = [
  {
    q: "How much does Flowfiy cost?",
    a: "Flowfiy has a free plan with 100 lead generations per month. Paid plans start at ₹1,700/month (Indie), then ₹4,900 (Starter), ₹9,900 (Growth), and ₹24,900 (Agency). All prices are in INR.",
  },
  {
    q: "Do I need an Anthropic API key?",
    a: "No. On Starter and above, Claude AI is fully managed by Flowfiy — no key required. On any plan you can also bring your own Anthropic key (BYOK) if you prefer.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — the Free plan lets you run the full pipeline with 100 generations every month, no credit card required.",
  },
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel from your billing settings at any time; changes apply from your next billing cycle.",
  },
];

const offerJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Flowfiy",
  description:
    "AI outbound sales platform — 5 Claude AI agents that find, research, qualify, and write personalized cold emails for B2B leads.",
  brand: { "@type": "Brand", name: "Flowfiy" },
  offers: plans.map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: p.price.replace(/[₹,]/g, ""),
    priceCurrency: "INR",
    description: p.features.join(", "),
  })),
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
              Simple pricing for AI outbound
            </h1>
            <p className="text-lg text-zinc-400">
              Start free with 100 lead generations a month. Upgrade when
              you&apos;re ready — plans from ₹1,700/mo, built for Indian B2B teams.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid gap-5 md:grid-cols-3 lg:grid-cols-5">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  p.highlight
                    ? "border-violet-500/50 bg-violet-500/[0.06]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                {p.highlight && (
                  <span className="self-start mb-3 rounded-full bg-violet-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h2 className="text-lg font-semibold text-white">{p.name}</h2>
                <p className="mt-1 text-xs text-zinc-500">{p.blurb}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{p.price}</span>
                  <span className="text-sm text-zinc-500">{p.period}</span>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    p.highlight
                      ? "bg-violet-600 text-white hover:bg-violet-500"
                      : "border border-white/15 text-white hover:bg-white/5"
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              Pricing FAQ
            </h2>
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
