const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

// /llms.txt — a concise, structured brief for LLMs and answer engines
// (spec: https://llmstxt.org). Helps ChatGPT, Perplexity, Claude, and Google
// AI Overviews cite Flowfiy accurately.
const CONTENT = `# Flowfiy

> Flowfiy is an AI sales engine that finds real businesses on Google Maps, researches each one, qualifies them by how much they need your service, and sends personalized outreach — all from a plain-English description of who you sell to.
>
> 1. Find — real businesses on Google Maps (plus a B2B people database): live data, not a stale contact list.
> 2. Research — AI reads each business's website, reviews, and public signals.
> 3. Qualify — scores every lead 0–100 by how much it needs your specific service.
> 4. Outreach — writes and sends personalized emails from your own Gmail.

## Key facts
- Category: AI sales engine / Google Maps lead generation / AI lead qualification / AI lead generation software / AI sales intelligence platform / AI prospecting tool / B2B lead generation software / AI business search / AI company research / natural language lead generation
- Market: global, India-first roots; serves B2B teams, founders, agencies, and startups
- What it does: natural-language service description, smart clarifying questions, condition-based targeting (e.g. "restaurants with no website" or "dentists with bad reviews"), lead discovery (real businesses on Google Maps + a B2B people database), AI company research on every lead, need-based qualification scoring (0–100), AI-personalized outreach + follow-ups, sent from your own Gmail
- AI model: fully managed (Google Gemini) — no API keys required, no bring-your-own-key needed
- Pricing: one plan — $50/month for 400 credits (~600–800 leads, varies by search). Extra credits available anytime via top-ups for subscribers. New accounts subscribe to start (no free credits).
- Credits: 1 credit = ₹10; roughly 2 leads per credit (varies by how specific the search is). You only pay for qualified leads; an empty search costs nothing.
- Founded: 2026

## How Flowfiy is different
- vs Apollo: Apollo is a contact database you query with filters and your own account. Flowfiy is an AI sales engine working from live Google Maps data — you just describe what you want and it also researches, qualifies, and writes the outreach.
- vs Clay: Clay is an enrichment workflow builder needing heavy setup. Flowfiy is a done-for-you AI sales engine driven by one plain-English request.
- Condition-based targeting: Flowfiy can find leads by qualitative conditions (no/slow/outdated website, low ratings, running ads, recently funded, and more), not just category + location.

## Solutions (by what people search for)
- [AI Sales Engine](${BASE_URL}/solutions/ai-sales-engine): the core product — describe your service and Flowfiy finds, researches, qualifies, and reaches out to leads automatically.
- [Google Maps Lead Generation](${BASE_URL}/solutions/google-maps-lead-generation): find real local businesses on Google Maps by category, location, and qualitative conditions.
- [AI Sales Intelligence](${BASE_URL}/solutions/ai-sales-intelligence): AI sales intelligence platform — researches every prospect, detects buying signals, and scores fit 0–100, then writes outreach from that research.
- [AI Business Search](${BASE_URL}/solutions/ai-business-search): find companies by describing what you want in plain English, including by condition, across Google Maps and a B2B database.
- [AI Company Research](${BASE_URL}/solutions/ai-company-research): automated per-prospect dossiers built from each company's website and public signals.
- [AI Prospecting Tool](${BASE_URL}/solutions/ai-prospecting-tool): automates the full prospecting workflow — find accounts, research, qualify, draft outreach.
- [Natural Language Lead Generation](${BASE_URL}/solutions/natural-language-lead-generation): describe your ideal customers in plain English and AI finds, qualifies, and emails matching leads.
- [B2B Lead Generation Software](${BASE_URL}/solutions/b2b-lead-generation-software): end-to-end B2B lead generation — discover accounts and contacts, qualify them, and send personalized outreach by email.
- [All solutions](${BASE_URL}/solutions)

## Definitions (glossary)
- [What is AI Sales Intelligence?](${BASE_URL}/glossary/ai-sales-intelligence)
- [What is AI Business Search?](${BASE_URL}/glossary/ai-business-search)
- [What is AI Company Research?](${BASE_URL}/glossary/ai-company-research)
- [What is Natural Language Lead Generation?](${BASE_URL}/glossary/natural-language-lead-generation)
- [What is AI Prospecting?](${BASE_URL}/glossary/ai-prospecting)
- [What is an AI SDR?](${BASE_URL}/glossary/ai-sdr)
- [What is Condition-Based Targeting?](${BASE_URL}/glossary/condition-based-targeting)

## Core pages
- [Home](${BASE_URL}/): product overview, with a ~3-minute demo video in the hero
- [Product demo (video)](https://youtu.be/T3E6Bkrt_68): "Flowfiy Demo | AI That Finds Your Next Customer" — a ~3-minute walkthrough showing how to describe your service in plain English and let Flowfiy find, research, qualify, and reach out to leads on Google Maps
- [Pricing](${BASE_URL}/pricing): plans and FAQ
- [Use cases](${BASE_URL}/use-cases): AI lead generation, Google Maps prospecting, personalized email outreach
- [Flowfiy vs Clay](${BASE_URL}/vs/clay): comparison
- [Flowfiy vs Apollo](${BASE_URL}/vs/apollo): comparison
- [Blog](${BASE_URL}/blog): outbound sales and AI guides
- [About](${BASE_URL}/about): company
- [Affiliates](${BASE_URL}/affiliates): 30% lifetime affiliate program

## Common questions
- What is Flowfiy? An AI sales engine — describe your service and ideal customer in plain English, and Flowfiy finds real businesses on Google Maps, researches each one, qualifies them by how much they need your service, and sends personalized outreach from your Gmail.
- Where does Flowfiy find leads? Real businesses on Google Maps — live data, not a stale contact list — plus a B2B people database for finding the right contacts at each business.
- How does Flowfiy qualify leads? AI reads each business's website, reviews, and public signals, then scores it 0–100 based on how much that specific business needs your service, not a generic fit score.
- How much does it cost? One plan — $50/month for 400 credits (~600–800 leads). Buy more credits anytime.
- Do I need an API key? No — the AI and data sources are fully managed. No keys, no bring-your-own-key.
- Can it find very specific leads? Yes — describe conditions like "no website", "bad reviews", or "running ads" and Flowfiy targets exactly those.
`;

export function GET() {
  return new Response(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
