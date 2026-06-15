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
      "Instantly is a cold-email sending and deliverability tool (mailbox rotation and warmup). Flowfiy is a full pipeline that also finds, researches, qualifies, and writes the emails.",
    intro: [
      "Instantly is built for sending volume: it rotates inboxes, warms them up, and helps cold email land. But it assumes you already have a list and copy — it doesn't find leads, research them, or write personalized emails for you.",
      "Flowfiy covers the steps before sending: it discovers leads from your ICP, researches each company, scores them 0–100, and writes a personalized email per lead — then sends from your own Gmail.",
    ],
    rows: [
      { feature: "AI lead discovery", flowfiy: true, them: false },
      { feature: "AI company research per lead", flowfiy: true, them: false },
      { feature: "AI qualification scoring (0–100)", flowfiy: true, them: false },
      { feature: "AI-written personalized emails", flowfiy: true, them: "Basic AI assist" },
      { feature: "Mailbox warmup / rotation", flowfiy: "Sends from your Gmail", them: true },
      { feature: "India (INR) pricing", flowfiy: true, them: false },
      { feature: "Free tier", flowfiy: "₹0 / 100 leads", them: "Limited trial" },
    ],
    verdict:
      "Use Instantly if you only need sending infrastructure for an existing list. Choose Flowfiy if you want the whole motion — from finding leads to writing the emails — done by AI.",
  },
  {
    slug: "smartlead",
    name: "Smartlead",
    category: "Cold email infrastructure",
    positioning:
      "Smartlead is cold-email infrastructure (unlimited mailboxes, warmup, deliverability). Flowfiy is an AI SDR that builds and qualifies the pipeline before any email is sent.",
    intro: [
      "Smartlead focuses on deliverability at scale — unlimited mailboxes, warmup, and inbox rotation for high-volume sending. It's strong infrastructure, but the research and personalization are on you.",
      "Flowfiy is the layer above that: it turns an ICP into researched, scored, ready-to-send personalized outreach, so the volume you send is actually relevant.",
    ],
    rows: [
      { feature: "AI lead discovery & research", flowfiy: true, them: false },
      { feature: "AI qualification scoring", flowfiy: true, them: false },
      { feature: "Per-lead personalized email writing", flowfiy: true, them: "Spintax / templates" },
      { feature: "Unlimited mailboxes / warmup", flowfiy: "Sends from your Gmail", them: true },
      { feature: "End-to-end pipeline (no setup)", flowfiy: true, them: false },
      { feature: "India (INR) pricing", flowfiy: true, them: false },
    ],
    verdict:
      "Smartlead wins on raw sending infrastructure. Flowfiy wins when you want AI to actually build and personalize the pipeline, not just send it.",
  },
  {
    slug: "lemlist",
    name: "lemlist",
    category: "Multichannel outreach sequencing",
    positioning:
      "lemlist is a multichannel sequencing tool with template personalization. Flowfiy researches each lead and writes a unique email from scratch, with built-in lead discovery and scoring.",
    intro: [
      "lemlist is known for sequences and personalization tokens across email and LinkedIn. It still relies on you to source leads and craft the templates that get personalized.",
      "Flowfiy removes that upfront work: its agents find the leads, read each company, qualify them, and write a genuinely per-lead email — no template tokens required.",
    ],
    rows: [
      { feature: "AI lead discovery", flowfiy: true, them: "Has a database add-on" },
      { feature: "AI research-based personalization", flowfiy: true, them: "Token/template based" },
      { feature: "AI qualification scoring (0–100)", flowfiy: true, them: false },
      { feature: "Multichannel sequences", flowfiy: "Email-first", them: true },
      { feature: "Done-for-you pipeline", flowfiy: true, them: false },
      { feature: "India (INR) pricing", flowfiy: true, them: false },
    ],
    verdict:
      "Pick lemlist for multichannel sequencing with manual control. Pick Flowfiy when you want AI to do the sourcing, research, and writing for you.",
  },
];

export const COMPETITOR_BY_SLUG = new Map(COMPETITORS.map((c) => [c.slug, c]));
