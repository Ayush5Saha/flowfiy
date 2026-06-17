import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Set Up Flowfiy: The Complete 4-Step Setup Guide | Flowfiy Blog",
  description:
    "A step-by-step guide to setting up Flowfiy — subscribe, set your business profile, describe the leads you want in plain English, then review and send from your Gmail. No API keys, no per-tool setup. Go from zero to your first AI outbound campaign in minutes.",
  keywords: [
    "how to set up Flowfiy",
    "Flowfiy setup guide",
    "Flowfiy onboarding",
    "AI outbound setup",
    "describe leads in plain English",
    "condition-based lead targeting",
    "AI cold email setup",
    "connect Gmail Flowfiy",
    "AI sales pipeline setup",
  ],
  openGraph: {
    title: "How to Set Up Flowfiy: The Complete 4-Step Setup Guide",
    description:
      "Subscribe, set your business profile, describe the leads you want, then review and send from Gmail — your AI outbound pipeline, live in minutes.",
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
    "A 4-step guide to setting up Flowfiy's AI outbound sales pipeline — subscribe, set your business profile, describe the leads you want, then review and send from Gmail.",
  totalTime: "PT10M",
  datePublished: "2026-06-15",
  author: { "@type": "Organization", name: "Flowfiy" },
  publisher: { "@type": "Organization", name: "Flowfiy" },
  step: [
    { "@type": "HowToStep", name: "Subscribe to start", text: "Sign up at flowfiy.com/signup and start your $50/month plan with 400 credits — about 600-800 leads." },
    { "@type": "HowToStep", name: "Set your business profile", text: "Tell Flowfiy what you sell and who you want to reach so every email is written in context." },
    { "@type": "HowToStep", name: "Describe the leads you want", text: "Type the leads you want in plain English, including qualitative conditions, and answer any clarifying questions." },
    { "@type": "HowToStep", name: "Review and send from Gmail", text: "Review the qualified leads and personalized emails, then send from your own Gmail." },
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
    title: "Subscribe and create your workspace",
    href: "/signup",
    cta: "Create your account",
    body: (
      <>
        <p>
          Head to the{" "}
          <Link href="/signup" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            sign-up page
          </Link>{" "}
          and create your account with your work email or one-click Google sign-in, then start your plan —{" "}
          <strong className="text-white">$50/month for 400 credits</strong>, roughly 600–800 leads depending on how
          specific your searches are. There are no API keys to buy and no separate provider bills; the AI and data
          sources are fully managed.
        </p>
        <p>
          Once you confirm your email, Flowfiy creates your workspace and drops you straight into onboarding. This is the
          account that owns your leads, campaigns, and credits, so use the email your team actually checks.
        </p>
      </>
    ),
  },
  {
    n: 2,
    title: "Set your business profile & ICP",
    href: "/settings",
    cta: "Edit your profile & ICP",
    body: (
      <>
        <p>
          Onboarding walks you through your{" "}
          <strong className="text-white">business profile</strong> and your{" "}
          <strong className="text-white">Ideal Customer Profile (ICP)</strong>. This is the single most important step —
          everything the AI writes is anchored to what you tell it here.
        </p>
        <p>Be specific. These details shape both who Flowfiy targets and how every email reads:</p>
        <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
          <li>What you sell and the core problem it solves</li>
          <li>Target industries, company size, and geography</li>
          <li>The job titles and seniority of the people you want to reach</li>
          <li>Your value proposition and proof points</li>
        </ul>
        <p>
          You can refine all of this any time from{" "}
          <Link href="/settings" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
            Settings
          </Link>
          . A sharper profile means tighter lead lists and more relevant, higher-converting outreach. (Not sure what an
          ICP is? Read{" "}
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
    title: "Describe the leads you want",
    href: "/leads",
    cta: "Describe your leads",
    body: (
      <>
        <p>
          This is where Flowfiy replaces filters and manual list-building. In plain English, describe exactly who you
          want to reach — including qualitative conditions a normal filter can&apos;t express:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-zinc-400">
          <li>&ldquo;Coffee shops in Austin with no website&rdquo;</li>
          <li>&ldquo;Dentists in Texas with poor Google reviews&rdquo;</li>
          <li>&ldquo;B2B marketing agencies under 20 people with an outdated site&rdquo;</li>
        </ul>
        <p>
          If your request is ambiguous, Flowfiy asks a couple of quick clarifying questions, then shows you a plan:
          which sources it will search, how each condition is checked, and a credit estimate. Nothing is charged until
          you hit Run — and you&apos;re never charged above the estimate you approve.
        </p>
      </>
    ),
  },
  {
    n: 4,
    title: "Review and send from your Gmail",
    href: "/integrations",
    cta: "Connect Gmail",
    body: (
      <>
        <p>
          Connect Gmail with one click via Google OAuth so outreach goes out from{" "}
          <strong className="text-white">your own inbox</strong> — no shared IPs, no deliverability penalty. Flowfiy{" "}
          <strong className="text-white">only sends email</strong>; it never reads your inbox or deletes messages.
        </p>
        <p>
          When a run finishes you get a list of qualified leads — each scored 0–100 with reasoning — and a personalized
          email plus follow-ups for every one. Review them, edit anything you like, and send. You only spend credits on
          the qualified leads you keep; an empty search costs nothing.
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
              <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> 5 min read</span>
              <span className="text-xs text-zinc-600">Jun 15, 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-5">
              How to Set Up Flowfiy: The Complete 4-Step Setup Guide
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              From sign-up to your first AI-personalized campaign in under 15 minutes — no API keys to manage. Here&apos;s
              every step and why it matters.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          {/* Intro */}
          <div className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 leading-relaxed">
            <p>
              Flowfiy runs a fully managed outbound pipeline — it finds leads that match your description, researches each
              company, qualifies them 0–100, and writes personalized outreach. There are no API keys to wire up. All it
              needs from you is who you&apos;re selling to, who you want to reach, and your Gmail to send from. This guide
              walks through all of it in order.
            </p>
          </div>

          {/* On this page — quick nav */}
          <div className="my-8 bg-zinc-900/60 border border-white/8 rounded-xl p-6 not-prose">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">The 4 steps</p>
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
              With your profile set and Gmail connected, head to{" "}
              <Link href="/leads" className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline">
                Leads
              </Link>{" "}
              and describe your first search. The pipeline runs discover → research → qualify → personalize, then you
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
            <p className="text-zinc-400 text-sm mb-6">Start your $50/month plan and follow these 4 steps — most teams are sending in under 15 minutes.</p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interlinks */}
          <div className="mt-12">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">Continue reading</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { href: "/blog/byok-ai-pricing-explained", title: "Why We Removed API Keys: Simple Credit Pricing" },
                { href: "/blog/how-ai-agents-replace-sdrs", title: "How AI Is Replacing the Entire SDR Stack in 2026" },
                { href: "/blog/condition-based-targeting", title: "Condition-Based Targeting: Find Leads by Real-World Signals" },
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
