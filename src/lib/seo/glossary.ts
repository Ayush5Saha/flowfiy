// Glossary data — powers /glossary and /glossary/[slug]. Definition-first
// content is highly citable by answer engines (AI Overviews, Perplexity, etc.)
// and ranks for "what is X" queries.

export type GlossaryTerm = {
  slug: string;
  term: string;
  short: string; // one-sentence definition (answer-engine snippet)
  body: string[]; // supporting paragraphs
  related: string[]; // slugs
};

export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "ai-sdr",
    term: "AI SDR (AI Sales Development Representative)",
    short:
      "An AI SDR is software that automates the work of a sales development rep — finding leads, researching them, and writing outreach — without a human doing it manually.",
    body: [
      "A traditional SDR spends most of their week building lists, researching companies, and writing cold emails. An AI SDR does that work automatically using AI agents, so a founder or small team can run outbound at scale without hiring.",
      "Flowfiy is an AI SDR platform: five Claude AI agents handle ICP analysis, lead discovery, company research, qualification scoring, and personalized email writing end-to-end.",
    ],
    related: ["outbound-sales", "cold-email", "lead-scoring"],
  },
  {
    slug: "ideal-customer-profile",
    term: "Ideal Customer Profile (ICP)",
    short:
      "An Ideal Customer Profile (ICP) is a description of the company type that gets the most value from your product — by industry, size, location, and other traits.",
    body: [
      "A sharp ICP is the foundation of good outbound: it tells you who to target so you don't waste time on poor-fit leads. It typically covers industry, company size, geography, tech stack, and buying triggers.",
      "Flowfiy turns a plain-English ICP description into a structured targeting brief its agents use to discover and qualify matching leads.",
    ],
    related: ["lead-scoring", "outbound-sales", "ai-sdr"],
  },
  {
    slug: "lead-scoring",
    term: "Lead Scoring",
    short:
      "Lead scoring is the practice of ranking prospects by how likely they are to convert, usually on a numeric scale, so you contact the best-fit leads first.",
    body: [
      "Scoring lets a team focus limited outreach capacity on the highest-potential prospects instead of treating every lead the same. Signals can include firmographics, fit to the ICP, and buying intent.",
      "Flowfiy scores every discovered lead 0–100 with an AI qualification agent, so your pipeline is prioritized before you send a single email.",
    ],
    related: ["ideal-customer-profile", "ai-sdr", "lead-enrichment"],
  },
  {
    slug: "cold-email",
    term: "Cold Email",
    short:
      "A cold email is an unsolicited outreach email sent to a prospect you have no prior relationship with, aimed at starting a sales conversation.",
    body: [
      "Effective cold email is relevant and personalized — it references the recipient's company and a specific reason for reaching out, rather than a generic blast. Deliverability and personalization are the two biggest drivers of reply rates.",
      "Flowfiy writes a personalized subject line, body, and follow-ups for each lead based on real company research, then sends from your own Gmail.",
    ],
    related: ["cold-email", "email-deliverability", "personalization-at-scale"],
  },
  {
    slug: "lead-enrichment",
    term: "Lead Enrichment",
    short:
      "Lead enrichment is the process of adding extra data — like company size, role, tech stack, or recent news — to a basic lead record to make outreach more relevant.",
    body: [
      "Enrichment turns a bare email address into context you can personalize around. The richer and more accurate the data, the more targeted your outreach can be.",
      "Flowfiy enriches leads by reading each company's website and public data, then uses that research directly in the email it writes.",
    ],
    related: ["lead-scoring", "personalization-at-scale", "ai-sdr"],
  },
  {
    slug: "email-deliverability",
    term: "Email Deliverability",
    short:
      "Email deliverability is the ability of your emails to reach the recipient's inbox instead of the spam folder or being blocked.",
    body: [
      "Deliverability depends on domain reputation, authentication (SPF, DKIM, DMARC), sending volume, and how recipients engage with your mail. Poor deliverability quietly kills outbound results.",
      "Because Flowfiy sends from your own connected Gmail account, your emails go out from a real, warmed mailbox rather than a shared sending pool.",
    ],
    related: ["cold-email", "outbound-sales"],
  },
  {
    slug: "personalization-at-scale",
    term: "Personalization at Scale",
    short:
      "Personalization at scale means tailoring outreach to each individual prospect automatically, so every message feels one-to-one even across thousands of leads.",
    body: [
      "Generic templates get ignored; truly personalized emails get replies — but writing them by hand doesn't scale. AI closes that gap by researching and writing per-lead at volume.",
      "Flowfiy generates a unique, research-backed email for every qualified lead, so personalization no longer trades off against volume.",
    ],
    related: ["cold-email", "lead-enrichment", "ai-sdr"],
  },
  {
    slug: "outbound-sales",
    term: "Outbound Sales",
    short:
      "Outbound sales is a go-to-market motion where you proactively reach out to potential customers — via email, calls, or social — rather than waiting for them to come to you.",
    body: [
      "Outbound is predictable and controllable: you choose exactly who to target. The trade-off is the manual effort of list-building, research, and writing — which is what AI outbound tools automate.",
      "Flowfiy is an autonomous outbound engine: you define your ICP and it runs discovery, research, qualification, and personalized outreach for you.",
    ],
    related: ["ai-sdr", "cold-email", "ideal-customer-profile"],
  },
  {
    slug: "byok",
    term: "BYOK (Bring Your Own Key)",
    short:
      "BYOK (Bring Your Own Key) lets you connect your own AI provider API key to a product, so AI usage runs on — and is billed to — your own account.",
    body: [
      "BYOK gives you control over AI costs and usage limits, and is common with developer-friendly tools. The alternative is a fully managed model where the platform handles the AI for you.",
      "Flowfiy supports BYOK with your Anthropic Claude key on any plan, and also offers fully managed Claude on paid plans so no key is required.",
    ],
    related: ["ai-sdr"],
  },
];

export const GLOSSARY_BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]));
