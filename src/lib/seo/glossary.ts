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
      "Flowfiy is an AI SDR platform: you describe the leads you want in plain English, and its managed AI handles lead discovery, company research, qualification scoring, and personalized email writing end-to-end.",
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
    slug: "condition-based-targeting",
    term: "Condition-Based Targeting",
    short:
      "Condition-based targeting is finding leads by qualitative conditions — like \"coffee shops with no website\" or \"dentists with bad reviews\" — rather than just category and location.",
    body: [
      "Most lead tools only filter by firmographics: industry, size, geography. Condition-based targeting goes further, matching on real-world signals such as a slow or outdated website, poor reviews, or a recent funding round — the things that actually indicate a prospect needs what you sell.",
      "With Flowfiy you describe the leads you want in plain English, and its managed AI finds matching businesses, scores each 0–100, and writes the outreach — no API keys to set up.",
    ],
    related: ["ideal-customer-profile", "ai-sdr", "lead-scoring"],
  },
  {
    slug: "lead-credits",
    term: "Lead Credits",
    short:
      "Lead credits are a prepaid in-app currency used to meter AI lead generation — you spend credits as the platform delivers qualified leads, rather than paying per API call or per month for unlimited use.",
    body: [
      "Credits make AI lead generation predictable: instead of juggling per-token AI bills and per-tool data charges, you hold a credit balance and spend it as leads are delivered. Each search reserves an estimate and is charged the actual cost when it finishes, so you're never billed above what you approved — and a search that returns no qualified leads costs nothing.",
      "Flowfiy runs on one plan: $50/month for 400 credits — roughly 600–800 leads, about two leads per credit, varying by how specific the search is. The AI and data sources are fully managed, so there are no API keys and no separate provider bills.",
    ],
    related: ["ai-sdr", "lead-scoring", "condition-based-targeting"],
  },
  {
    slug: "website-audit",
    term: "Website Audit",
    short:
      "A website audit is an automated check of a business's website health — grading it as having no site, broken, slow, or outdated — used to find prospects who need web design, performance, or marketing help.",
    body: [
      "For agencies and freelancers, website health is a buying signal: a business with no website, a broken one, or a slow, outdated site is a prospect who needs what you sell. An automated audit grades each site (none, broken, slow, outdated) from signals like load time, mobile readiness, HTTPS, and page metadata.",
      "Flowfiy runs a website-audit signal as part of condition-based targeting, so you can ask for leads like \"cafés with no website\" or \"agencies with an outdated site\" and get only the businesses that match — each tagged with the reason it qualified.",
    ],
    related: ["condition-based-targeting", "lead-enrichment", "lead-scoring"],
  },
];

export const GLOSSARY_BY_SLUG = new Map(GLOSSARY.map((t) => [t.slug, t]));
