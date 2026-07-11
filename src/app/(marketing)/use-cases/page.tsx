import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy Use Cases — AI Lead Generation & Condition-Based Targeting",
  description:
    "See how teams use Flowfiy: an AI sales engine that finds real businesses on Google Maps, researches each one, and qualifies them 0–100 by how much they need your service — then sends the outreach. $50/mo for 400 credits.",
  keywords: [
    "AI sales use cases",
    "AI sales engine use cases",
    "AI lead generation use cases",
    "condition-based lead targeting",
    "Google Maps lead generation",
    "cold email automation use cases",
  ],
  openGraph: {
    title: "Flowfiy Use Cases — AI Sales Engine Workflows",
    description:
      "How B2B teams use Flowfiy to find real businesses on Google Maps, qualify them by need, and get outreach written for them. $50/mo for 400 credits.",
    url: "/use-cases",
  },
  alternates: { canonical: "/use-cases" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Flowfiy Use Cases",
  description:
    "Ways B2B teams use Flowfiy, an AI sales engine: finding businesses on Google Maps, condition-based targeting, need-based qualification, and personalized outreach.",
  inLanguage: "en",
};

const useCases = [
  {
    href: "/use-cases/ai-lead-generation",
    title: "AI Lead Generation",
    desc: "Describe the leads you want in plain English and Flowfiy finds matching businesses on Google Maps and people in a B2B database, researches each, and scores them 0–100 by how much they need your service — ready to contact.",
  },
  {
    href: "/use-cases/cold-email-automation",
    title: "Cold Email Automation",
    desc: "Flowfiy finds and qualifies your leads first — by how much they need your service — then writes hyper-personalized cold emails and follow-ups, sent from your own Gmail after review.",
  },
  {
    href: "/use-cases/condition-based-targeting",
    title: "Condition-Based Targeting",
    desc: "Go beyond category and location. Find leads by qualitative conditions like “coffee shops with no website”, “dentists with bad reviews” or “SaaS that recently raised”.",
  },
];

export default function UseCasesHubPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div>
        <section className="relative py-20 px-4 sm:px-6 border-b border-white/5 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
              Use cases
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-5">
              What you can do with Flowfiy
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl">
              Flowfiy is an AI sales engine: describe the leads you want and it finds real
              businesses on Google Maps, researches each one, and qualifies them 0–100 by
              how much they need your service — then writes the outreach. Here are the
              core ways B2B teams put it to work.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
            {useCases.map((u) => (
              <Link
                key={u.href}
                href={u.href}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-colors hover:border-violet-500/40 hover:bg-violet-500/[0.04]"
              >
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  {u.title}
                  <ArrowRight className="w-4 h-4 text-violet-400 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400">{u.desc}</p>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Get started — $50/mo for 400 credits
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
