import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Flowfiy Use Cases — AI Lead Generation & Cold Email Automation India",
  description:
    "See how teams use Flowfiy's AI agents for B2B lead generation, cold email automation, and outbound prospecting in India. Real workflows, from ₹1,700/mo. Starts free.",
  keywords: [
    "AI sales use cases",
    "AI lead generation use cases India",
    "cold email automation use cases",
    "B2B outbound automation examples",
    "AI SDR use cases India",
  ],
  openGraph: {
    title: "Flowfiy Use Cases — AI Outbound Sales Workflows",
    description:
      "How Indian B2B teams use Flowfiy's 5 AI agents for lead generation and cold email automation. Starts free.",
    url: "/use-cases",
  },
  alternates: { canonical: "/use-cases" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Flowfiy Use Cases",
  description:
    "Ways B2B teams use Flowfiy's AI agents for outbound sales: AI lead generation and cold email automation.",
  inLanguage: "en-IN",
};

const useCases = [
  {
    href: "/use-cases/ai-lead-generation",
    title: "AI Lead Generation",
    desc: "Describe your ICP and let Flowfiy's agents discover, research, and qualify matching leads from 275M+ contacts — scored 0–100, ready to contact.",
  },
  {
    href: "/use-cases/cold-email-automation",
    title: "Cold Email Automation",
    desc: "Generate hyper-personalized cold emails for every lead and send them from your own Gmail — no templates, no manual research, no SDR needed.",
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
              Flowfiy&apos;s 5 Claude AI agents run your entire outbound motion — from
              finding leads to writing the emails that book meetings. Here are the
              core ways Indian B2B teams put them to work.
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
              Start free — 100 leads on us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
