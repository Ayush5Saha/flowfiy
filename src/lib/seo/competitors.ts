// Programmatic competitor comparison data — powers /vs/[slug].
// NOTE: /vs/clay and /vs/apollo are hand-written static pages and intentionally
// excluded here; Next serves those static segments, these slugs use the dynamic
// route. Each entry has real, specific positioning to avoid thin/duplicate pages.

export type Competitor = {
  slug: string;
  name: string;
  category: string;
  // One-line summary of what they are vs Flowfiy.
  positioning: string;
  intro: string[];
  rows: { feature: string; flowfiy: string | boolean; them: string | boolean }[];
  verdict: string;
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "instantly",
    name: "Instantly",
    category: "Cold email sending & deliverability",
    positioning:
      "Instantly is a cold-email sending and deliverability tool (mailbox rotation and warmup) — it assumes you already have a list. Flowfiy is an AI sales engine: it finds real businesses on Google Maps and a B2B people database, researches and qualifies each one by how much it needs your service, then writes the emails.",
    intro: [
      "Instantly is built for sending volume: it rotates inboxes, warms them up, and helps cold email land. But it assumes you already have a list and copy — it doesn't find leads, research them, or score how much each one needs what you sell.",
      "With Flowfiy you describe the leads you want in plain English; it finds matching businesses on Google Maps and a B2B people database, researches each one, scores it 0–100 by how much it needs your service, and writes a personalized email per lead — then sends from your own Gmail after review.",
    ],
    rows: [
      { feature: "Describe-your-leads (plain-English) targeting", flowfiy: true, them: false },
      { feature: "Finds businesses on live Google Maps data", flowfiy: true, them: false },
      { feature: "Condition-based targeting (e.g. shops with no website)", flowfiy: true, them: false },
      { feature: "AI company research per lead", flowfiy: true, them: false },
      { feature: "AI qualification scoring by need (0–100)", flowfiy: true, them: false },
      { feature: "AI-written personalized emails", flowfiy: true, them: "Basic AI assist" },
      { feature: "Mailbox warmup / rotation", flowfiy: "Sends from your Gmail", them: true },
      { feature: "Managed AI & data (no API keys)", flowfiy: true, them: false },
    ],
    verdict:
      "Use Instantly if you only need sending infrastructure for an existing list. Choose Flowfiy if you want an AI sales engine that finds the businesses on Google Maps, qualifies them by need, and writes the emails for you.",
  },
  {
    slug: "smartlead",
    name: "Smartlead",
    category: "Cold email infrastructure",
    positioning:
      "Smartlead is cold-email infrastructure (unlimited mailboxes, warmup, deliverability). Flowfiy is an AI sales engine that finds real businesses on Google Maps, researches and qualifies each one by need, and builds the pipeline before any email is sent.",
    intro: [
      "Smartlead focuses on deliverability at scale — unlimited mailboxes, warmup, and inbox rotation for high-volume sending. It's strong infrastructure, but finding leads, researching them, and knowing who actually needs what you sell is on you.",
      "Flowfiy is the layer above that: you describe the leads you want in plain English and it searches Google Maps and a B2B people database, researches each business, scores it 0–100 by how much it needs your service, and returns ready-to-send personalized outreach — so the volume you send is actually relevant.",
    ],
    rows: [
      { feature: "Plain-English lead discovery & research", flowfiy: true, them: false },
      { feature: "Finds businesses on live Google Maps data", flowfiy: true, them: false },
      { feature: "AI qualification scoring by need", flowfiy: true, them: false },
      { feature: "Per-lead personalized email writing", flowfiy: true, them: "Spintax / templates" },
      { feature: "Unlimited mailboxes / warmup", flowfiy: "Sends from your Gmail", them: true },
      { feature: "End-to-end pipeline (no API keys, no setup)", flowfiy: true, them: false },
      { feature: "Pay only for qualified leads", flowfiy: true, them: false },
    ],
    verdict:
      "Smartlead wins on raw sending infrastructure. Flowfiy wins when you want an AI sales engine to find, research, and qualify the pipeline by need — not just send it.",
  },
  {
    slug: "lemlist",
    name: "lemlist",
    category: "Multichannel outreach sequencing",
    positioning:
      "lemlist is a multichannel sequencing tool with template personalization. Flowfiy is an AI sales engine: it finds real businesses on Google Maps, researches each one, scores it by how much it needs your service, and writes a unique email from scratch.",
    intro: [
      "lemlist is known for sequences and personalization tokens across email and LinkedIn. It still relies on you to source leads and craft the templates that get personalized.",
      "Flowfiy removes that upfront work: you describe the leads you want and it finds them on Google Maps and a B2B people database, reads each company's site and public signals, scores it 0–100 by how much it needs your service, and writes a genuinely per-lead email — no template tokens required.",
    ],
    rows: [
      { feature: "Plain-English lead discovery", flowfiy: true, them: "Has a database add-on" },
      { feature: "Finds businesses on live Google Maps data", flowfiy: true, them: false },
      { feature: "Condition-based targeting (qualitative filters)", flowfiy: true, them: false },
      { feature: "AI research-based personalization", flowfiy: true, them: "Token/template based" },
      { feature: "AI qualification scoring by need (0–100)", flowfiy: true, them: false },
      { feature: "Multichannel sequences", flowfiy: "Email-first", them: true },
      { feature: "Done-for-you pipeline (no API keys)", flowfiy: true, them: false },
    ],
    verdict:
      "Pick lemlist for multichannel sequencing with manual control. Pick Flowfiy when you want an AI sales engine to do the sourcing, research, need-based qualification, and writing for you.",
  },
];

export const COMPETITOR_BY_SLUG = new Map(COMPETITORS.map((c) => [c.slug, c]));
