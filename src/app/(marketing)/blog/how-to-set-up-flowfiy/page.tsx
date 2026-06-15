import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Set Up Flowfiy: The Complete 7-Step Setup Guide | Flowfiy Blog",
  description:
    "A step-by-step guide to setting up Flowfiy — sign up, add your business details and ICP, connect your Claude or OpenRouter API key, add Apollo or Apify, connect Gmail, and link your calendar. Go from zero to your first AI outbound campaign in under 15 minutes.",
  keywords: [
    "how to set up Flowfiy",
    "Flowfiy setup guide",
    "Flowfiy onboarding",
    "AI outbound setup",
    "connect Claude API Flowfiy",
    "connect Apollo Flowfiy",
    "connect Apify Flowfiy",
    "connect Gmail Flowfiy",
    "AI sales pipeline setup India",
  ],
  openGraph: {
    title: "How to Set Up Flowfiy: The Complete 7-Step Setup Guide",
    description:
      "Sign up, add your ICP, connect your AI key, lead source, Gmail, and calendar — your AI outbound pipeline, live in under 15 minutes.",
    url: "/blog/how-to-set-up-flowfiy",
    type: "article",
  },
  alternates: { canonical: "/blog/how-to-set-up-flowfiy" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Set Up Flowfiy",
  description:
    "A 7-step guide to setting up Flowfiy's AI outbound sales pipeline — from sign-up to connecting your AI key, lead source, Gmail, and calendar.",
  totalTime: "PT15M",
  datePublished: "2026-06-15",
  author: { "@type": "Organization", name: "Flowfiy" },
  publisher: { "@type": "Organization", name: "Flowfiy" },
  step: [
    { "@type": "HowToStep", name: "Create your account", text: "Sign up at flowfiy.com/signup with your email or Google account." },
    { "@type": "HowToStep", name: "Add your business details & ICP", text: "Tell Flowfiy what you sell and who your ideal customer is." },
    { "@type": "HowToStep", name: "Open the Integrations page", text: "Go to the Integrations page in your dashboard to connect your tools." },
    { "@type": "HowToStep", name: "Add your Claude or OpenRouter API key", text: "Connect your own Anthropic (Claude) or OpenRouter API key to power the AI engine." },
    { "@type": "HowToStep", name: "Add your Apollo or Apify API key", text: "Connect a lead source so Flowfiy can discover contacts that match your ICP." },
    { "@type": "HowToStep", name: "Connect Gmail", text: "Authorize Gmail so outreach sends from your own inbox." },
    { "@type": "HowToStep", name: "Connect your calendar (optional)", text: "Link Calendly so booking links are inserted into your emails automatically." },
  ],
};

type Step = {
  n: number;
  title: string;
  optional?: boolean;
  href: string;
  cta: string;
  body: React.ReactNode;
};

const steps: Step[] = [
  {
    n: 1,
    title: "Create your account",
    href: "/signup",
    cta: "Create your account",
    body: (
      <>
        <p>
          Head to the{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            sign-up page
          </Link>{" "}
          and create your account with your work email or one-click Google sign-in. There&apos;s no credit card required to
          start — every new workspace begins on the free tier so you can run the full pipeline before you decide to upgrade.
        </p>
        <p>
          Once you confirm your email, Flowfiy creates your workspace and drops you straight into onboarding. This is the
          account that owns your leads, campaigns, and integrations, so use the email your team actually checks.
        </p>
      </>
    ),
  },
  {
    n: 2,
    title: "Add your business details & ICP",
    href: "/settings",
    cta: "Edit your profile & ICP",
    body: (
      <>
        <p>
          Right after sign-up, onboarding walks you through your{" "}
          <strong className="text-white">business profile</strong> and your{" "}
          <strong className="text-white">Ideal Customer Profile (ICP)</strong>. This is the single most important step —
          everything the AI does downstream is anchored to what you tell it here.
        </p>
        <p>Be specific. The fields you fill in feed directly into the 5-agent pipeline:</p>
        <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
          <li>What you sell and the core problem it solves</li>
          <li>Target industries, company size, and geography</li>
          <li>The job titles and seniority of the people you want to reach</li>
          <li>Your value proposition and proof points</li>
        </ul>
        <p>
          You can refine all of this any time later from{" "}
          <Link href="/settings" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            Settings
          </Link>
          . A sharper ICP means tighter lead lists and more relevant, higher-converting outreach — so it&apos;s worth
          getting right. (Not sure what an ICP is? Read{" "}
          <Link href="/glossary/ideal-customer-profile" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            our ICP definition
          </Link>
          .)
        </p>
      </>
    ),
  },
  {
    n: 3,
    title: "Open the Integrations page",
    href: "/integrations",
    cta: "Go to Integrations",
    body: (
      <>
        <p>
          From your dashboard, open the{" "}
          <Link href="/integrations" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            Integrations
          </Link>{" "}
          page. This is your control center for connecting the three things the pipeline needs — an AI engine, a lead
          source, and an email sender — plus an optional calendar.
        </p>
        <p>
          Every integration has an inline <em>&ldquo;How to get your key&rdquo;</em> guide, and each key is validated the
          moment you paste it, so you&apos;ll know immediately if something isn&apos;t right. The next four steps all happen
          on this one page.
        </p>
      </>
    ),
  },
  {
    n: 4,
    title: "Add your Claude or OpenRouter API key",
    href: "/integrations",
    cta: "Connect your AI key",
    body: (
      <>
        <p>
          Flowfiy is <strong className="text-white">BYOK (Bring Your Own Key)</strong> — you connect your own AI provider,
          so you control usage and costs and never pay a per-lead markup. Pick one of two providers under{" "}
          <strong className="text-white">AI Engine</strong>:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
          <li>
            <strong className="text-white">Anthropic (Claude)</strong> — create a key at console.anthropic.com → Settings →
            API Keys. It starts with <code className="text-violet-300">sk-ant-api03-</code>. Roughly $1 buys ~100 fully
            researched leads on Claude Sonnet.
          </li>
          <li>
            <strong className="text-white">OpenRouter</strong> — create a key at openrouter.ai/keys (starts with{" "}
            <code className="text-violet-300">sk-or-v1-</code>), then choose a model. Many models are free, so you can run
            the pipeline at zero inference cost.
          </li>
        </ul>
        <p>
          Paste your key, save, and Flowfiy validates it on the spot. Curious why we don&apos;t just charge per lead?{" "}
          <Link href="/blog/byok-ai-pricing-explained" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            Here&apos;s the full math behind BYOK pricing
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    n: 5,
    title: "Add your Apollo or Apify API key",
    href: "/integrations",
    cta: "Connect a lead source",
    body: (
      <>
        <p>
          Next, connect a <strong className="text-white">lead source</strong> so Flowfiy can discover real contacts that
          match your ICP. You need at least one — pick whichever fits:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
          <li>
            <strong className="text-white">Apollo.io</strong> (preferred) — the highest-quality emails and firmographic
            data. Grab your key from app.apollo.io → Settings → Integrations → API. The free plan includes 50 credits/month.
          </li>
          <li>
            <strong className="text-white">Apify</strong> — finds contacts with validated emails and also scrapes company
            websites to enrich AI research. Create a token at console.apify.com → Settings → Integrations (starts with{" "}
            <code className="text-violet-300">apify_api_</code>). The free tier gives $5/month of compute.
          </li>
        </ul>
        <p>
          Connect either one — or both. With your AI engine and a lead source in place, Flowfiy can already run its full
          pipeline: ICP → discover → research → qualify → personalize.
        </p>
      </>
    ),
  },
  {
    n: 6,
    title: "Connect Gmail",
    href: "/integrations",
    cta: "Connect Gmail",
    body: (
      <>
        <p>
          To send outreach, connect Gmail with one click via Google OAuth. Emails go out from{" "}
          <strong className="text-white">your own inbox</strong> — no shared IPs, no deliverability penalty — which is why
          replies land naturally and threads stay with you.
        </p>
        <p>
          Click <em>&ldquo;Connect with Google&rdquo;</em>, choose the account you want to send from, and grant
          send-email permission. Flowfiy <strong className="text-white">only sends email</strong> — it never reads your
          inbox or deletes messages. Once connected, you&apos;re ready to launch your first campaign.
        </p>
      </>
    ),
  },
  {
    n: 7,
    title: "Connect your calendar",
    optional: true,
    href: "/integrations",
    cta: "Connect Calendly",
    body: (
      <>
        <p>
          This last step is optional but highly recommended. Connect <strong className="text-white">Calendly</strong> and
          Flowfiy will automatically insert your scheduling link into outreach emails — so an interested prospect can book a
          meeting without a single back-and-forth reply.
        </p>
        <p>
          Create a Personal Access Token at calendly.com → Integrations → API &amp; Webhooks, paste it in, and add your
          scheduling link (e.g. <code className="text-violet-300">calendly.com/yourname/30min</code>). Leave the link blank
          and Flowfiy will try to fetch it automatically from your token.
        </p>
      </>
    ),
  },
];

export default function BlogPostHowToSetUpFlowfiy() {
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
              <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">Guides</span>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> 7 min read</span>
              <span className="text-xs text-zinc-600">Jun 15, 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
              How to Set Up Flowfiy: The Complete 7-Step Setup Guide
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              From sign-up to your first AI-personalized campaign in under 15 minutes. Here&apos;s every step — what to
              connect, where to get each key, and why it matters.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          {/* Intro */}
          <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 leading-relaxed">
            <p>
              Flowfiy runs a 5-agent outbound pipeline — it finds leads that match your ICP, researches each company,
              qualifies them, and writes personalized outreach. To get there, it needs four things from you: who you&apos;re
              selling to, an AI engine, a lead source, and a way to send email. This guide walks through all of it in order.
            </p>
          </div>

          {/* On this page — quick nav */}
          <div className="my-8 bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">The 7 steps</p>
            <ol className="space-y-2.5">
              {steps.map((step) => (
                <li key={step.n} className="flex items-start gap-3 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/15 text-violet-400 flex items-center justify-center text-[11px] font-bold mt-px">
                    {step.n}
                  </span>
                  <a href={`#step-${step.n}`} className="text-zinc-300 hover:text-violet-300 transition-colors">
                    {step.title}
                    {step.optional && <span className="text-zinc-600"> (optional)</span>}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {/* Steps */}
          <div className="space-y-10 mt-12">
            {steps.map((step) => (
              <section key={step.n} id={`step-${step.n}`} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="shrink-0 w-9 h-9 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center text-base font-bold border border-violet-500/20">
                    {step.n}
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {step.title}
                    {step.optional && (
                      <span className="ml-2 align-middle text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/8 font-medium">
                        Optional
                      </span>
                    )}
                  </h2>
                </div>
                <div className="prose prose-invert prose-zinc max-w-none space-y-4 text-zinc-300 leading-relaxed pl-12">
                  {step.body}
                  <Link
                    href={step.href}
                    className="not-prose inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-violet-400 hover:text-violet-300 hover:gap-2.5 transition-all"
                  >
                    {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </section>
            ))}
          </div>

          {/* You're done */}
          <div className="mt-12 bg-gradient-to-br from-emerald-950/30 to-zinc-900/50 border border-emerald-500/20 rounded-2xl p-7 not-prose">
            <div className="flex items-center gap-2.5 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">That&apos;s it — you&apos;re live</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              With your ICP set and your AI key, lead source, and Gmail connected, head to{" "}
              <Link href="/leads" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
                Leads
              </Link>{" "}
              and generate your first list. The pipeline runs ICP → discover → research → qualify → personalize, then you
              review the copy and launch from{" "}
              <Link href="/campaigns" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
                Campaigns
              </Link>
              . Track everything live on your{" "}
              <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
                dashboard
              </Link>
              .
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-12" />

          {/* CTA */}
          <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">Ready to set it up?</h3>
            <p className="text-zinc-400 text-sm mb-6">Create your free workspace and follow these 7 steps — most teams are sending in under 15 minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interlinks */}
          <div className="mt-12">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">Continue reading</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/byok-ai-pricing-explained", title: "BYOK AI Pricing: Why We Don't Charge Per Lead Generation" },
                { href: "/blog/how-ai-agents-replace-sdrs", title: "How 5 AI Agents Are Replacing the Entire SDR Stack in 2026" },
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
