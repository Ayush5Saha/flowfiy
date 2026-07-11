// Solution / category landing-page data — powers /solutions and /solutions/[slug].
//
// Each entry targets one head keyword cluster with genuinely distinct content
// (no thin/duplicate pages). The structure is built for all three search layers:
//   • SEO  — title/description/keywords + SoftwareApplication & BreadcrumbList schema
//   • AEO  — `definition` is an answer-first, citable one-liner; `faqs` back FAQPage schema
//   • GEO  — definition-first prose + concrete facts that generative engines can cite
//
// Facts kept consistent with the rest of the site: $50/mo for 400 credits
// (~600–800 leads, ~2 leads/credit), fully managed AI, no API keys, plain-English
// + condition-based targeting, Google Maps + B2B people-database discovery, AI
// research + 0–100 scoring, personalized emails sent from your own Gmail, you only
// pay for qualified leads.

export type Solution = {
  slug: string;
  /** Primary head keyword this page targets, e.g. "AI Sales Intelligence". */
  keyword: string;
  /** Short category label shown in the hero chip + breadcrumb. */
  category: string;
  /** <title> contents (Flowfiy suffix added by the template). */
  title: string;
  metaDescription: string;
  keywords: string[];
  /** Visible H1; `h1Highlight` is rendered as a gradient span appended to it. */
  h1: string;
  h1Highlight: string;
  /** Hero sub-headline — also the answer-first lead paragraph. */
  subhead: string;
  /** One-sentence, citable "What is X?" definition (AEO/GEO snippet). */
  definition: string;
  /** 2–3 supporting paragraphs. */
  intro: string[];
  /** 4–6 capability cards. */
  capabilities: { title: string; desc: string }[];
  /** "Everything included" checklist. */
  included: string[];
  /** Hero stat strip — [value, label]. */
  stats: [string, string][];
  /** Visible FAQ + FAQPage schema. */
  faqs: { q: string; a: string }[];
  /** Related solution slugs (internal linking). */
  related: string[];
  /** Related glossary slugs (entity cross-links). */
  glossary: string[];
};

export const SOLUTIONS: Solution[] = [
  // ── AI Sales Intelligence / Sales Intelligence Platform ─────────────────
  {
    slug: "ai-sales-intelligence",
    keyword: "AI Sales Intelligence",
    category: "AI Sales Intelligence Platform",
    title: "AI Sales Intelligence Platform — Research & Score Every Lead",
    metaDescription:
      "Flowfiy is an AI sales intelligence platform that researches every prospect, scores fit 0–100, and turns company signals into ready-to-send outreach. Describe your ideal leads in plain English — no API keys. $50/mo for 400 credits.",
    keywords: [
      "AI sales intelligence",
      "sales intelligence platform",
      "AI sales intelligence platform",
      "sales intelligence software",
      "AI lead scoring software",
      "buying signals software",
      "B2B sales intelligence",
      "AI prospect research",
    ],
    h1: "Sales intelligence that researches and scores",
    h1Highlight: "every lead for you",
    subhead:
      "Flowfiy is an AI sales intelligence platform: it researches every prospect, reads the real signals about their business, and scores fit 0–100 — so you know who to contact, why, and what to say before you send a single email.",
    definition:
      "AI sales intelligence is the use of AI to automatically gather, analyze, and score data about prospects and companies — so sales teams know who to contact, how much each one needs what they sell, and what to say, without doing the research by hand.",
    intro: [
      "Traditional sales intelligence tools hand you a database and a pile of filters. You still have to interpret the data, decide who's worth pursuing, and figure out the angle for each account. That research is where reps lose most of their week.",
      "Flowfiy turns sales intelligence into an outcome instead of a dataset. You describe the leads you want in plain English; it finds matching businesses, reads each company's website and public signals, scores them 0–100 with reasoning, and writes the outreach — so the intelligence arrives already acted on.",
      "Because the AI and data sources are fully managed, there are no API keys, no credits to wire into other tools, and no manual scoring rubric to maintain. You get a prioritized, research-backed pipeline on one plan.",
    ],
    capabilities: [
      { title: "Per-company research", desc: "Every lead's website and public footprint is read for positioning, size cues, tech signals, and growth language — the context that makes outreach land." },
      { title: "0–100 qualification scoring", desc: "Each prospect is scored for how much they need what you sell, with transparent reasoning, so your team works the highest-need accounts first instead of treating every lead the same." },
      { title: "Buying-signal detection", desc: "Condition-based targeting surfaces real signals — no website, bad reviews, a slow or outdated site, a recent raise — that indicate a prospect actually needs what you sell." },
      { title: "Enriched, verified contacts", desc: "Leads arrive with verified emails and enriched company data, so the intelligence is ready to use, not a starting point for more cleanup." },
      { title: "Prioritized pipeline", desc: "Only leads above your score threshold move forward. You spend zero time on prospects that won't convert — and an empty search costs nothing." },
      { title: "Outreach written from the research", desc: "The same intelligence is turned into a personalized subject line, body, and follow-ups per lead — referencing each company's real context." },
    ],
    included: [
      "Plain-English targeting — no query builder",
      "Condition-based buying signals (no website, bad reviews, slow site…)",
      "Company research from each site's public data",
      "AI qualification scoring 0–100 with reasoning",
      "Email verification & enrichment included",
      "Personalized subject line + body + follow-ups",
      "Send from your own Gmail after review",
      "Fully managed AI & data — no API keys",
    ],
    stats: [
      ["0–100", "Fit score per prospect"],
      ["Per-lead", "Company research & signals"],
      ["600–800", "Researched leads / month"],
      ["$0", "Cost for an empty search"],
    ],
    faqs: [
      { q: "What is AI sales intelligence?", a: "AI sales intelligence is the use of AI to automatically gather, analyze, and score data about prospects and companies — so sales teams know who to contact, why they're a fit, and what to say, without doing the research manually. Flowfiy does this end-to-end: it researches every lead, scores fit 0–100, and writes the outreach." },
      { q: "Is Flowfiy a sales intelligence platform?", a: "Yes. Flowfiy is an AI sales intelligence platform that researches each prospect, detects buying signals, and scores fit 0–100 — then goes a step further than most platforms by writing personalized outreach from that research and sending it from your own Gmail." },
      { q: "How does Flowfiy score leads?", a: "Every discovered lead is scored 0–100 by an AI qualification agent based on how much it needs what you sell — combining fit to the leads you described with the company signals it researched. The score comes with reasoning, and only leads above your threshold move forward." },
      { q: "Do I need API keys or to connect other data tools?", a: "No. The AI and all data sources are fully managed by Flowfiy — there are no API keys to bring and no separate data subscriptions to wire in. You connect Gmail to send, and that's it." },
      { q: "How much does it cost?", a: "One plan: $50/month for 400 credits — about 600–800 researched, scored leads (roughly two leads per credit, varying by search). You only pay for qualified leads, so a search that returns nothing costs nothing." },
    ],
    related: ["ai-company-research", "ai-prospecting-tool", "ai-sales-engine"],
    glossary: ["ai-sales-intelligence", "lead-scoring", "ai-sales-engine"],
  },

  // ── AI Business Search / Business Search AI ─────────────────────────────
  {
    slug: "ai-business-search",
    keyword: "AI Business Search",
    category: "AI Business Search",
    title: "AI Business Search — Find Companies in Plain English",
    metaDescription:
      "Flowfiy's AI business search finds companies by describing what you want in plain English — even by condition, like 'coffee shops with no website.' It searches Google Maps + a B2B people database, then researches and scores each match. No API keys. $50/mo.",
    keywords: [
      "AI business search",
      "business search AI",
      "AI company finder",
      "find businesses by condition",
      "natural language business search",
      "AI business lookup",
      "search for companies with AI",
      "find companies with no website",
    ],
    h1: "Describe the businesses you want.",
    h1Highlight: "AI finds them.",
    subhead:
      "Flowfiy's AI business search lets you find companies by describing what you want in plain English — even by qualitative condition, like \"coffee shops with no website\" — instead of wrestling with rigid filters and dropdowns.",
    definition:
      "AI business search is a way to find companies by describing what you want in natural language — including qualitative conditions like \"coffee shops with no website\" — rather than filtering by fixed categories and locations alone.",
    intro: [
      "Most business-search tools are just filtered directories: pick an industry, pick a city, get a list. They can't answer the searches that actually matter — the ones with a condition attached, like a business with no website, bad reviews, or a slow, outdated site.",
      "Flowfiy reads your description, asks a smart clarifying question when it needs to narrow things down, then searches across Google Maps and a B2B people database to return businesses that genuinely match — each one researched and scored 0–100, not just listed.",
      "It's search that ends in action: the matching companies arrive with verified contacts and a personalized email already written, ready to review and send from your Gmail. No API keys, no setup.",
    ],
    capabilities: [
      { title: "Natural-language queries", desc: "Type what you're looking for the way you'd say it out loud. No boolean operators, no filter trees — Flowfiy translates your sentence into a targeted search." },
      { title: "Condition-based matching", desc: "Search by real-world conditions a directory can't: \"no website,\" \"bad reviews,\" \"slow or outdated site,\" \"recently raised.\" The signal that says they need you is the search itself." },
      { title: "Google Maps + people database", desc: "Coverage spans local businesses via Google Maps and B2B companies and people via a managed database — so one search reaches both." },
      { title: "Smart clarifying questions", desc: "When a search is ambiguous, Flowfiy asks one focused question to sharpen it — the way a good researcher would — instead of returning noise." },
      { title: "Researched, not just listed", desc: "Every match is read and profiled: positioning, size cues, tech signals. You get context, not a bare row in a spreadsheet." },
      { title: "From result to outreach", desc: "Each matched business is scored 0–100 for how much it needs what you're selling, then gets a personalized email plus follow-ups, sent from your own Gmail after review." },
    ],
    included: [
      "Plain-English search — no filters or boolean",
      "Condition-based targeting (no website, bad reviews, slow site…)",
      "Google Maps + B2B people-database coverage",
      "Clarifying questions when a search needs them",
      "Per-company research on every match",
      "AI qualification scoring 0–100",
      "Verified contacts + personalized outreach",
      "Fully managed AI — no API keys",
    ],
    stats: [
      ["Plain English", "Describe what you want"],
      ["By condition", "Not just category + city"],
      ["Maps + B2B DB", "Two sources, one search"],
      ["$0", "Cost for an empty search"],
    ],
    faqs: [
      { q: "What is AI business search?", a: "AI business search is a way to find companies by describing what you want in plain English — including qualitative conditions like \"coffee shops with no website\" — rather than filtering by fixed categories and locations alone. Flowfiy returns matches that are already researched and scored." },
      { q: "Can I search for businesses by condition, not just industry and location?", a: "Yes — that's the core of it. You can search for conditions like \"dentists with bad reviews,\" \"shops with a slow or outdated site,\" or \"SaaS that recently raised,\" not just category plus city. Flowfiy treats the condition as a buying signal." },
      { q: "Where does Flowfiy search?", a: "Across Google Maps for local and physical businesses and a managed B2B people database for companies and contacts — so a single description can reach both kinds of targets." },
      { q: "Do I need to set up filters or API keys?", a: "No. You describe what you want in a sentence; Flowfiy asks a clarifying question if needed and does the rest. The AI and data sources are fully managed — no API keys, no filter-building." },
      { q: "What does a search cost?", a: "Flowfiy runs on $50/month for 400 credits (~600–800 leads). You only pay for qualified matches, so a search that finds nothing costs nothing." },
    ],
    related: ["google-maps-lead-generation", "natural-language-lead-generation", "ai-company-research"],
    glossary: ["ai-business-search", "condition-based-targeting", "website-audit"],
  },

  // ── AI Company Research ─────────────────────────────────────────────────
  {
    slug: "ai-company-research",
    keyword: "AI Company Research",
    category: "AI Company Research",
    title: "AI Company Research — Automated Prospect Dossiers",
    metaDescription:
      "Flowfiy's AI company research reads each prospect's website and public signals to build a dossier — positioning, size, tech, and buying signals — then writes outreach from it. No manual research, no API keys. $50/mo for 400 credits.",
    keywords: [
      "AI company research",
      "automated company research",
      "AI prospect research",
      "company research tool",
      "AI account research",
      "automated prospect dossiers",
      "company enrichment AI",
      "B2B company research software",
    ],
    h1: "Every prospect, researched",
    h1Highlight: "before you reach out",
    subhead:
      "Flowfiy's AI company research reads each prospect's website and public footprint to build a working dossier — positioning, size cues, tech signals, and buying signals — and turns it straight into personalized outreach.",
    definition:
      "AI company research is the automated process of reading a company's website and public signals to build a profile — positioning, size, tech stack, and buying signals — that sales teams use to personalize their outreach.",
    intro: [
      "SDRs spend the majority of their time on research: opening tabs, skimming sites, copying notes into a doc, trying to find the one detail that makes an email feel written for the recipient. It's the least scalable part of outbound.",
      "Flowfiy does that research automatically for every lead. It reads each company's website and public signals, extracts what matters for outreach, and keeps the findings attached to the lead — so personalization is grounded in real context, not guesswork.",
      "The research isn't a dead-end report. It feeds the qualification score and the email Flowfiy writes, so the time you'd spend digging is spent on conversations instead. No API keys, fully managed.",
    ],
    capabilities: [
      { title: "Website reading", desc: "Flowfiy reads each prospect's site for positioning, products, audience, and tone — the raw material for a relevant first line." },
      { title: "Firmographic signals", desc: "Size cues, team signals, and growth language are inferred from public data, so you understand the account before you contact it." },
      { title: "Tech & maturity clues", desc: "Signals like an outdated or slow site, missing website, or thin web presence surface exactly the prospects who need what you sell." },
      { title: "Verified contact enrichment", desc: "Each company's research is paired with verified, enriched contact data — name, role, email — ready for outreach." },
      { title: "Research → score", desc: "Findings feed an AI qualification score 0–100 for how much each business needs what you sell, with reasoning, so research directly prioritizes your pipeline." },
      { title: "Research → email", desc: "The dossier becomes a personalized subject line, body, and follow-ups that reference the company's real context." },
    ],
    included: [
      "Automated website reading per lead",
      "Firmographic & maturity signals",
      "Buying-signal detection (no website, slow site, bad reviews…)",
      "Verified email + contact enrichment",
      "AI qualification scoring 0–100 with reasoning",
      "Research-backed personalized outreach",
      "Send from your own Gmail after review",
      "Fully managed AI — no API keys",
    ],
    stats: [
      ["Per-lead", "Automated research"],
      ["0–100", "Score from the research"],
      ["600–800", "Researched leads / month"],
      ["No tabs", "Zero manual digging"],
    ],
    faqs: [
      { q: "What is AI company research?", a: "AI company research is the automated process of reading a company's website and public signals to build a profile — positioning, size, tech stack, and buying signals — that sales teams use to personalize outreach. Flowfiy does this for every lead automatically." },
      { q: "What does Flowfiy research about each company?", a: "It reads the company's website and public footprint for positioning, products, size cues, tech and maturity signals, and buying signals like a missing, slow, or outdated site — then pairs that with verified contact data." },
      { q: "Does the research feed into the email?", a: "Yes. The research drives both the 0–100 qualification score and the personalized email Flowfiy writes, so every message references the company's real context rather than a generic template." },
      { q: "Is this manual or automatic?", a: "Fully automatic. You describe the leads you want; Flowfiy finds and researches each one without you opening a single tab. The AI and data sources are managed — no API keys." },
      { q: "How much does it cost?", a: "$50/month for 400 credits — about 600–800 researched leads. You only pay for qualified leads, so an empty search is free." },
    ],
    related: ["ai-sales-intelligence", "ai-prospecting-tool", "ai-sales-engine"],
    glossary: ["ai-company-research", "lead-enrichment", "personalization-at-scale"],
  },

  // ── AI Prospecting Tool ─────────────────────────────────────────────────
  {
    slug: "ai-prospecting-tool",
    keyword: "AI Prospecting Tool",
    category: "AI Prospecting Tool",
    title: "AI Prospecting Tool — Automate Lead Research & Outreach",
    metaDescription:
      "Flowfiy is an AI prospecting tool that finds target accounts, researches them, qualifies fit 0–100, and drafts personalized outreach — so reps spend time on conversations, not list-building. No API keys. $50/mo for 400 credits.",
    keywords: [
      "AI prospecting tool",
      "AI sales prospecting tool",
      "automated prospecting software",
      "AI prospecting software",
      "sales prospecting automation",
      "AI SDR tool",
      "automated lead research tool",
      "prospecting tool for startups",
    ],
    h1: "Prospecting, done by AI",
    h1Highlight: "while you sleep",
    subhead:
      "Flowfiy is an AI prospecting tool that finds your target accounts, researches each one, qualifies fit 0–100, and drafts the outreach — so your reps spend their time on conversations, not list-building.",
    definition:
      "An AI prospecting tool automates the prospecting workflow — finding target accounts, researching them, qualifying fit, and drafting outreach — so sales reps spend their time on conversations instead of manual list-building and research.",
    intro: [
      "Prospecting is the grind at the front of every sales motion: build the list, research each account, find the contact, write the email. Done by hand it doesn't scale, and it's the first thing that slips when reps get busy.",
      "Flowfiy automates the whole workflow. Describe who you want to reach in plain English and it finds matching accounts, researches each company, scores prospects 0–100, and drafts a personalized email plus follow-ups — ready to send from your own Gmail after review.",
      "It runs whether or not you're at your desk, so you wake up to a researched, qualified, ready-to-send pipeline. No API keys, no per-tool setup — the AI and data are fully managed.",
    ],
    capabilities: [
      { title: "Account discovery", desc: "Describe your target and Flowfiy finds matching businesses and people across Google Maps and a B2B database — including by condition, not just category." },
      { title: "Automated research", desc: "Each account is researched from its website and public signals, so you understand the prospect before the first touch." },
      { title: "Qualification scoring", desc: "Prospects are scored 0–100 for how much they need what you sell, with reasoning; only those above your threshold move forward, so capacity goes to the highest-need accounts." },
      { title: "Drafted outreach", desc: "A personalized subject line, body, and two follow-ups are written per qualified prospect, grounded in the research." },
      { title: "Runs on its own", desc: "Set the brief and Flowfiy works in the background — your pipeline fills while you focus elsewhere." },
      { title: "Send from your inbox", desc: "Connect Gmail, review the drafts, and send from your own warmed mailbox — not a shared sending pool." },
    ],
    included: [
      "Plain-English account targeting",
      "Condition-based prospecting (no website, bad reviews…)",
      "Automated per-account research",
      "AI qualification scoring 0–100",
      "Personalized email + follow-ups drafted",
      "Gmail OAuth sending from your inbox",
      "Pay only for qualified prospects",
      "Fully managed AI — no API keys",
    ],
    stats: [
      ["Plain English", "Describe your targets"],
      ["0–100", "Score per prospect"],
      ["600–800", "Prospects / month"],
      ["$0", "Cost for an empty run"],
    ],
    faqs: [
      { q: "What is an AI prospecting tool?", a: "An AI prospecting tool automates the prospecting workflow — finding target accounts, researching them, qualifying fit, and drafting outreach — so reps spend time on conversations instead of manual list-building. Flowfiy runs the whole workflow from one plain-English brief." },
      { q: "How is Flowfiy different from a contact database?", a: "A database hands you a list; you still research, qualify, and write. Flowfiy is end-to-end: it finds the accounts, researches each, scores them 0–100, and drafts personalized outreach — then sends from your Gmail after you review." },
      { q: "Can it prospect by condition, like 'businesses with no website'?", a: "Yes. Condition-based targeting lets you prospect by real signals — no website, bad reviews, a slow or outdated site, a recent raise — which is exactly what indicates a prospect needs what you sell." },
      { q: "Does it run automatically?", a: "Yes. You set the brief and Flowfiy finds, researches, qualifies, and drafts in the background, so you return to a ready-to-send pipeline. No API keys or per-tool setup." },
      { q: "What does it cost?", a: "$50/month for 400 credits — about 600–800 prospects. You only pay for qualified prospects, so an empty run costs nothing." },
    ],
    related: ["b2b-lead-generation-software", "ai-sales-engine", "ai-company-research"],
    glossary: ["ai-prospecting", "ai-sdr", "ai-sales-engine"],
  },

  // ── Natural Language Lead Generation ────────────────────────────────────
  {
    slug: "natural-language-lead-generation",
    keyword: "Natural Language Lead Generation",
    category: "Natural Language Lead Generation",
    title: "Natural Language Lead Generation — Describe Leads, AI Finds Them",
    metaDescription:
      "Natural language lead generation: describe your ideal customers in plain English and Flowfiy finds, qualifies, and emails matching leads — no boolean filters, query builders, or API setup. $50/mo for 400 credits.",
    keywords: [
      "natural language lead generation",
      "describe your leads in plain English",
      "plain English lead generation",
      "conversational lead generation",
      "AI lead generation natural language",
      "no-filter lead generation",
      "natural language prospecting",
      "describe leads AI finds them",
    ],
    h1: "Say it in plain English.",
    h1Highlight: "Get leads.",
    subhead:
      "Natural language lead generation means you describe your ideal customers the way you'd say them out loud — and Flowfiy finds, qualifies, and emails the matching leads. No boolean filters, no query builder, no API setup.",
    definition:
      "Natural language lead generation lets you describe your ideal customers in plain English and have AI find, qualify, and contact matching leads — without boolean filters, query builders, or API setup.",
    intro: [
      "Every other lead tool starts with the same wall: industry dropdowns, employee-count sliders, boolean filter strings, and a data integration to configure. The result only ever captures what fits into a form field.",
      "Flowfiy starts with a sentence. Describe who you want — \"coffee shops with no website,\" \"B2B SaaS in India that recently raised,\" \"dentists with bad reviews near me\" — and it asks a clarifying question if needed, then finds matching businesses, researches each, scores them 0–100, and writes the outreach.",
      "Plain language captures intent that filters can't: the qualitative conditions that actually signal a prospect needs you. And there's nothing to set up — the AI and data sources are fully managed, with no API keys.",
    ],
    capabilities: [
      { title: "Describe, don't filter", desc: "Type your ideal customer as a sentence. Flowfiy translates it into a targeted search — no dropdowns, sliders, or boolean strings." },
      { title: "Qualitative conditions", desc: "Capture intent filters can't express: \"no website,\" \"bad reviews,\" \"slow site,\" \"recently raised.\" The condition is the buying signal." },
      { title: "Clarifying questions", desc: "When your description is ambiguous, Flowfiy asks one sharp question to narrow it — like briefing a researcher, not configuring software." },
      { title: "Find → research → score", desc: "Matching businesses are discovered, researched from public data, and scored 0–100 for how much they need what you sell, all from the one description." },
      { title: "Outreach included", desc: "Every qualified lead gets a personalized subject line, body, and follow-ups, sent from your own Gmail after review." },
      { title: "Zero setup", desc: "No API keys, no data integrations, no filter-building. Describe, review, send." },
    ],
    included: [
      "Plain-English input — no filters or boolean",
      "Condition-based targeting from your description",
      "Smart clarifying questions",
      "Google Maps + B2B people-database discovery",
      "Per-company research + 0–100 scoring",
      "Personalized email + follow-ups",
      "Send from your own Gmail",
      "Fully managed AI — no API keys",
    ],
    stats: [
      ["Plain English", "Your only input"],
      ["No filters", "No boolean, no query builder"],
      ["600–800", "Leads / month"],
      ["$0", "Cost for an empty search"],
    ],
    faqs: [
      { q: "What is natural language lead generation?", a: "Natural language lead generation lets you describe your ideal customers in plain English and have AI find, qualify, and contact matching leads — without boolean filters, query builders, or API setup. Flowfiy is built around this: you type a sentence and it runs the whole pipeline." },
      { q: "Do I really not need filters or boolean queries?", a: "Correct. You describe what you want in a sentence — including conditions like \"shops with no website\" — and Flowfiy asks a clarifying question if it needs to, then finds and qualifies the matches. There are no dropdowns or boolean strings to build." },
      { q: "What kinds of descriptions work?", a: "Anything from a simple category-and-location (\"law firms in Mumbai\") to a qualitative condition (\"dentists with bad reviews,\" \"SaaS that recently raised,\" \"cafés with no website\"). Conditions are treated as buying signals." },
      { q: "What happens after it finds the leads?", a: "Each match is researched, scored 0–100, and given a personalized email plus follow-ups. You review and send from your own Gmail — the whole pipeline runs from your one description." },
      { q: "How much does it cost?", a: "$50/month for 400 credits — about 600–800 leads. You only pay for qualified leads, so an empty search costs nothing." },
    ],
    related: ["ai-business-search", "google-maps-lead-generation", "b2b-lead-generation-software"],
    glossary: ["natural-language-lead-generation", "condition-based-targeting", "ideal-customer-profile"],
  },

  // ── B2B Lead Generation Software ────────────────────────────────────────
  {
    slug: "b2b-lead-generation-software",
    keyword: "B2B Lead Generation Software",
    category: "B2B Lead Generation Software",
    title: "B2B Lead Generation Software — AI Finds, Qualifies & Emails",
    metaDescription:
      "Flowfiy is B2B lead generation software that finds target companies and contacts, researches and qualifies them 0–100, and writes personalized cold emails sent from your Gmail. Describe your ICP in plain English — no API keys. $50/mo for 400 credits.",
    keywords: [
      "B2B lead generation software",
      "B2B lead generation tool",
      "AI B2B lead generation",
      "B2B lead generation platform",
      "B2B prospecting software",
      "B2B lead generation software India",
      "automated B2B lead generation",
      "B2B sales lead software",
    ],
    h1: "B2B lead generation,",
    h1Highlight: "end to end, by AI",
    subhead:
      "Flowfiy is B2B lead generation software that finds your target companies and contacts, researches and qualifies each one 0–100, and writes the personalized cold emails — from a brief you describe in plain English.",
    definition:
      "B2B lead generation software helps businesses find and engage other businesses as customers — discovering target accounts and contacts, qualifying them, and starting outreach. Flowfiy does all of it with AI from a single plain-English brief.",
    intro: [
      "Most B2B lead generation software stops at the list: it hands you accounts and contacts, then leaves the research, qualification, and email writing to you and your reps. The data is the easy part — turning it into booked meetings is the work.",
      "Flowfiy covers the whole motion. Describe your ICP in plain English — including conditions like \"agencies with an outdated site\" — and it finds matching companies and the right contacts, researches each business, scores fit 0–100, and writes a personalized email plus follow-ups for every qualified lead.",
      "You connect Gmail, review the drafts, and send from your own inbox. There are no API keys, no per-tool setup, and no separate data bills — the AI and data sources are fully managed, billed in your local currency including rupees in India.",
    ],
    capabilities: [
      { title: "Account + contact discovery", desc: "Find target companies and the right people across Google Maps and a B2B people database — from a plain-English ICP, including by condition." },
      { title: "Firmographic research", desc: "Each account is researched from its website and public data: positioning, size cues, tech and maturity signals." },
      { title: "Need-based qualification 0–100", desc: "Every prospect is scored by how much they need your service, with reasoning, so reps work the highest-need accounts first." },
      { title: "Personalized cold email", desc: "A subject line, body, and follow-ups are written per qualified lead, grounded in the company research — no templates." },
      { title: "Send from your Gmail", desc: "Connect Gmail and send from your own warmed mailbox after review, protecting deliverability." },
      { title: "Predictable pricing", desc: "One plan, credit-metered. You only pay for qualified leads, and an empty search costs nothing." },
    ],
    included: [
      "Plain-English ICP targeting",
      "Condition-based targeting (no website, bad reviews, slow site…)",
      "Google Maps + B2B people-database discovery",
      "Company research + verified contact enrichment",
      "AI qualification scoring 0–100",
      "Personalized subject line + body + follow-ups",
      "Gmail OAuth sending from your inbox",
      "Fully managed AI & data — no API keys",
    ],
    stats: [
      ["Plain English", "Describe your ICP"],
      ["0–100", "Fit score per lead"],
      ["600–800", "B2B leads / month"],
      ["$50/mo", "400 credits, one plan"],
    ],
    faqs: [
      { q: "What is B2B lead generation software?", a: "B2B lead generation software helps businesses find and engage other businesses as customers — discovering target accounts and contacts, qualifying them, and starting outreach. Flowfiy does all of it with AI from a single plain-English brief, including the research and personalized emails." },
      { q: "How is Flowfiy different from a B2B database like Apollo or ZoomInfo?", a: "Databases hand you contacts and leave the research, qualification, and writing to you. Flowfiy is end-to-end: from your ICP it finds accounts and contacts, researches each company, scores fit 0–100, writes personalized emails, and sends from your Gmail." },
      { q: "Does it work for B2B in India?", a: "Yes. Flowfiy is built for B2B teams in India and beyond — it's billed in your local currency including rupees, and supports India-specific targeting from a plain-English description." },
      { q: "Can I target by condition, not just industry and size?", a: "Yes. Beyond firmographics, you can target by qualitative conditions — no website, bad reviews, a slow or outdated site, a recent raise — which are strong B2B buying signals." },
      { q: "What does it cost?", a: "One plan: $50/month for 400 credits — about 600–800 B2B leads. You only pay for qualified leads, so a search that returns nothing is free, and subscribers can top up credits anytime." },
    ],
    related: ["ai-prospecting-tool", "ai-sales-engine", "natural-language-lead-generation"],
    glossary: ["ideal-customer-profile", "outbound-sales", "ai-sales-engine"],
  },

  // ── AI Sales Engine ──────────────────────────────────────────────────────
  {
    slug: "ai-sales-engine",
    keyword: "AI Sales Engine",
    category: "AI Sales Engine",
    title: "AI Sales Engine — Find, Research, Qualify & Reach Out With AI",
    metaDescription:
      "Flowfiy is an AI sales engine: it finds real businesses on Google Maps and a B2B database, researches each one, scores them 0–100 by how much they need your service, and sends personalized outreach from your Gmail. No API keys. $50/mo for 400 credits.",
    keywords: [
      "AI sales engine",
      "what is an AI sales engine",
      "AI sales engine software",
      "AI sales engine vs AI SDR",
      "AI sales automation engine",
      "sales engine software",
      "AI powered sales engine",
      "AI outbound sales engine",
    ],
    h1: "One AI sales engine.",
    h1Highlight: "Not a stack of five tools.",
    subhead:
      "Flowfiy is an AI sales engine: it finds real businesses on Google Maps and a B2B people database, researches each one, scores them 0–100 by how much they need your service, and sends personalized outreach — all from a plain-English description of who you sell to.",
    definition:
      "An AI sales engine is a single AI system that runs the full top-of-funnel sales motion — finding real businesses, researching each one, scoring how much each needs your service, and writing and sending personalized outreach — replacing a stack of a contact database, an enrichment tool, and an email sender with one plain-English brief.",
    intro: [
      "Most teams run outbound with a stack: a contact database for names, an enrichment tool to fill in the gaps, a scoring spreadsheet nobody keeps updated, and a separate email tool to send from. Each piece has its own login, its own bill, and its own blind spots — and none of them tell you why a specific business needs what you sell.",
      "Flowfiy replaces the stack with one engine. You describe who you sell to and who needs it, in plain English. Flowfiy finds real, currently-operating businesses on Google Maps and a B2B people database, reads each one's website, reviews, and public signals, scores it 0–100 for how much it needs your service, and writes a personalized email ready to send from your own Gmail.",
      "It isn't a cold-email tool with an AI feature bolted on, and it isn't a database you still have to research and qualify by hand. Email is just the last step — the engine's real work is finding the right businesses and knowing why each one is worth contacting before a single message goes out.",
    ],
    capabilities: [
      { title: "Find — real businesses on Google Maps", desc: "Discovery starts on Google Maps plus a B2B people database, so you're contacting businesses that are actually open today — not names pulled from an export that's months stale." },
      { title: "Research — read before you reach out", desc: "Each business's website, reviews, and public signals are read automatically, building the context a human researcher would spend twenty minutes finding." },
      { title: "Qualify — scored 0–100 by need", desc: "Every business is scored for how much it needs your specific service — not generic firmographic fit — so you know who to contact and why before you send anything." },
      { title: "Outreach — personalized, from your Gmail", desc: "A subject line, body, and follow-ups are written from the real research for every qualified business, then sent from your own connected Gmail account." },
      { title: "Condition-based targeting", desc: "Target by real-world conditions — no website, bad reviews, a slow or outdated site — the exact signals that mean a business needs what you sell." },
      { title: "One engine, one price", desc: "No separate database subscription, enrichment tool, or scoring spreadsheet to maintain — one plan, fully managed AI, no API keys." },
    ],
    included: [
      "Plain-English targeting — describe who you sell to",
      "Discovery from Google Maps + B2B people database",
      "AI research per business (website, reviews, public signals)",
      "AI qualification scoring 0–100 by need",
      "Personalized subject line + body + follow-ups",
      "Send from your own Gmail after review",
      "Fully managed AI & data — no API keys",
      "Pay only for qualified leads",
    ],
    stats: [
      ["4-in-1", "Find, research, qualify, outreach"],
      ["0–100", "Need-based score per business"],
      ["600–800", "Qualified leads / month"],
      ["$50/mo", "One plan, 400 credits"],
    ],
    faqs: [
      { q: "What is an AI sales engine?", a: "An AI sales engine is a single AI system that runs the full top-of-funnel sales motion — finding real businesses, researching each one, scoring how much each needs your service, and writing personalized outreach — instead of stitching together a separate database, enrichment tool, and email sender. Flowfiy is built as one plain-English-driven engine." },
      { q: "How is an AI sales engine different from an AI SDR or a cold email tool?", a: "A cold-email tool only sends — you still have to bring a list and write the copy. Many 'AI SDR' tools add AI on top of a static contact database. An AI sales engine like Flowfiy starts a step earlier: it finds the businesses itself from live sources like Google Maps, researches and scores each one by need, and only then writes and sends the outreach — so email is the last step, not the whole product." },
      { q: "Where does Flowfiy find businesses?", a: "From Google Maps, for real, currently-operating local and physical businesses, and a B2B people database for companies and contacts beyond Maps. Both are searched from a single plain-English description, including by condition — like \"dentists with bad reviews.\"" },
      { q: "How does the qualification score work?", a: "Every business Flowfiy finds is scored 0–100 by an AI agent based on how much it needs your specific service — not just generic firmographic fit — using the research gathered from that business's website and public signals. The score comes with reasoning, and you only pay for leads above your threshold." },
      { q: "Do I need to connect a database, an enrichment tool, or my own AI keys?", a: "No. The AI and every data source — Google Maps, the B2B people database, enrichment — are fully managed inside Flowfiy. You connect only your own Gmail to send. There are no API keys and no separate subscriptions to stitch together." },
      { q: "What does it cost?", a: "One plan: $50/month for 400 credits — about 600–800 qualified leads, roughly two leads per credit. You only pay for qualified leads, so a search that finds nothing costs nothing." },
    ],
    related: ["google-maps-lead-generation", "ai-sales-intelligence", "ai-prospecting-tool"],
    glossary: ["ai-sales-engine", "condition-based-targeting", "lead-scoring"],
  },

  // ── Google Maps Lead Generation ──────────────────────────────────────────
  {
    slug: "google-maps-lead-generation",
    keyword: "Google Maps Lead Generation",
    category: "Google Maps Lead Generation",
    title: "Google Maps Lead Generation — Find & Qualify Real Local Businesses",
    metaDescription:
      "Flowfiy turns Google Maps into a lead generation engine: it finds real, currently-operating local businesses, researches each one, scores them 0–100 by how much they need your service, and sends personalized outreach from your Gmail. No API keys. $50/mo for 400 credits.",
    keywords: [
      "Google Maps lead generation",
      "find leads on Google Maps",
      "Google Maps leads for business",
      "local business leads Google Maps",
      "AI Google Maps leads",
      "Google Maps prospecting",
      "local lead generation AI",
      "Google Maps B2B leads",
    ],
    h1: "Turn Google Maps into",
    h1Highlight: "a qualified lead list",
    subhead:
      "Flowfiy finds real, currently-operating local businesses on Google Maps, researches each one, scores it 0–100 by how much it needs your service, and writes a personalized email — from one plain-English description of who you're looking for.",
    definition:
      "Google Maps lead generation is finding prospective customers directly from Google Maps listings — real, currently-operating local businesses with addresses, reviews, and websites — rather than from a static, exported contact database that goes stale the day it's downloaded.",
    intro: [
      "A contact database is a snapshot: names and emails exported once, resold many times, and stale by the time you buy it. Businesses close, move, or already have what you're selling — the list doesn't know.",
      "Google Maps is live. Every listing is a business operating today, with a real address, reviews, and usually a website — exactly the signals that tell you whether it needs what you sell. Flowfiy searches Google Maps, plus a B2B people database for contacts beyond Maps, from a plain-English description, including by condition, like \"plumbers with no website\" or \"cafés with bad reviews.\"",
      "Every match is then researched from its website and public signals, scored 0–100 for how much it needs your service, and turned into a personalized email — ready to send from your own Gmail after review.",
    ],
    capabilities: [
      { title: "Live, not stale", desc: "Every result comes from Google Maps' current listings — real, open businesses, not an export that was accurate six months ago." },
      { title: "Condition-based search", desc: "Search by real-world conditions — no website, bad reviews, a slow or outdated site — the exact buying signals a plain category-and-city search can't find." },
      { title: "Reviews & website as research", desc: "Each business's reviews, listing details, and website are read automatically, so you know its reputation and online presence before contacting it." },
      { title: "0–100 need-based scoring", desc: "Every business found on Maps is scored for how much it needs your specific service, with reasoning — so you work the highest-need businesses first." },
      { title: "Personalized outreach included", desc: "A subject line, body, and follow-ups are written from the research for every qualified business, sent from your own Gmail." },
      { title: "Maps + B2B database, one search", desc: "Local, physical businesses come from Google Maps; companies and people beyond Maps come from a managed B2B people database — one plain-English search reaches both." },
    ],
    included: [
      "Plain-English search of Google Maps listings",
      "Condition-based targeting (no website, bad reviews, slow site…)",
      "B2B people database for contacts beyond Maps",
      "Automated research from each listing's site & reviews",
      "AI qualification scoring 0–100 by need",
      "Personalized email + follow-ups per lead",
      "Send from your own Gmail after review",
      "Fully managed AI & data — no API keys",
    ],
    stats: [
      ["Live data", "Real, open businesses"],
      ["Maps + B2B DB", "Two sources, one search"],
      ["0–100", "Need-based score per lead"],
      ["600–800", "Leads / month"],
    ],
    faqs: [
      { q: "Can AI find leads from Google Maps?", a: "Yes. Flowfiy searches Google Maps from a plain-English description — including by condition, like \"dentists with bad reviews\" or \"coffee shops with no website\" — and returns real, currently-operating businesses, each researched and scored 0–100 before you see it." },
      { q: "How is Google Maps data better than a contact database?", a: "A contact database is a static export: names and emails collected once and resold, often stale by the time you buy it. Google Maps listings are live — every result is a business that's open right now, with a real address, reviews, and usually a website, which are also the signals Flowfiy uses to tell whether it needs your service." },
      { q: "Does Flowfiy only search Google Maps?", a: "No. Google Maps covers local and physical businesses; Flowfiy also searches a managed B2B people database for companies and contacts beyond what's on Maps, so one plain-English description can reach both." },
      { q: "What do I get for each Google Maps lead?", a: "Every matching business is researched from its website and reviews, scored 0–100 for how much it needs your service, and paired with a personalized email and follow-ups — ready to review and send from your own Gmail." },
      { q: "Do I need a Google Maps API key or scraper?", a: "No. Google Maps discovery is fully managed inside Flowfiy — there's no API key to bring, no scraper to run or maintain, and no rate limits to manage yourself." },
      { q: "What does it cost?", a: "$50/month for 400 credits — about 600–800 leads. You only pay for qualified leads, so a search that returns nothing costs nothing." },
    ],
    related: ["ai-sales-engine", "ai-business-search", "natural-language-lead-generation"],
    glossary: ["ai-sales-engine", "condition-based-targeting", "website-audit"],
  },
];

export const SOLUTION_BY_SLUG = new Map(SOLUTIONS.map((s) => [s.slug, s]));
