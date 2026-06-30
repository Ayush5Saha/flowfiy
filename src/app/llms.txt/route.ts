const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

// /llms.txt — a concise, structured brief for LLMs and answer engines
// (spec: https://llmstxt.org). Helps ChatGPT, Perplexity, Claude, and Google
// AI Overviews cite Flowfiy accurately.
const CONTENT = `# Flowfiy

> Flowfiy is an AI-powered B2B outbound sales platform. You describe the leads you want in plain English; Flowfiy interprets the request, finds matching businesses or people, researches and scores each one 0–100, writes hyper-personalized cold emails, and sends them from your own Gmail. No API keys to manage — the AI and data sources are fully managed. Metered by prepaid credits. One plan: $50/month for 400 credits.

## Key facts
- Category: AI outbound sales / AI lead generation software / AI sales intelligence platform / AI prospecting tool / B2B lead generation software / AI business search / AI company research / natural language lead generation
- Market: global, India-first roots; serves B2B teams, founders, agencies, and startups
- What it does: natural-language lead requests, smart clarifying questions, condition-based targeting (e.g. "businesses with no website" or "shops with bad reviews"), lead discovery (Google Maps for local + a B2B people database), AI company research, qualification scoring (0–100), AI-written personalized cold emails + follow-ups, Gmail sending
- AI model: fully managed (Google Gemini) — no API keys required, no bring-your-own-key needed
- Pricing: one plan — $50/month for 400 credits (~600–800 leads, varies by search). Extra credits available anytime via top-ups for subscribers. New accounts subscribe to start (no free credits).
- Credits: 1 credit = ₹10; roughly 2 leads per credit (varies by how specific the search is). You only pay for qualified leads; an empty search costs nothing.
- Founded: 2026

## How Flowfiy is different
- vs Apollo: Apollo is a contact database you query with filters and your own account; with Flowfiy you just describe what you want — no Apollo account or keys — and it also researches, qualifies and writes the outreach.
- vs Clay: Clay is an enrichment workflow builder needing heavy setup; Flowfiy is a done-for-you pipeline driven by one plain-English request.
- Condition-based targeting: Flowfiy can find leads by qualitative conditions (no/slow/outdated website, low ratings, running ads, recently funded, and more), not just category + location.

## Solutions (by what people search for)
- [AI Sales Intelligence](${BASE_URL}/solutions/ai-sales-intelligence): AI sales intelligence platform — researches every prospect, detects buying signals, and scores fit 0–100, then writes outreach from that research.
- [AI Business Search](${BASE_URL}/solutions/ai-business-search): find companies by describing what you want in plain English, including by condition, across Google Maps and a B2B database.
- [AI Company Research](${BASE_URL}/solutions/ai-company-research): automated per-prospect dossiers built from each company's website and public signals.
- [AI Prospecting Tool](${BASE_URL}/solutions/ai-prospecting-tool): automates the full prospecting workflow — find accounts, research, qualify, draft outreach.
- [Natural Language Lead Generation](${BASE_URL}/solutions/natural-language-lead-generation): describe your ideal customers in plain English and AI finds, qualifies, and emails matching leads.
- [B2B Lead Generation Software](${BASE_URL}/solutions/b2b-lead-generation-software): end-to-end B2B lead generation — discover accounts and contacts, qualify them, and send personalized cold email.
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
- [Product demo (video)](https://youtu.be/T3E6Bkrt_68): "Flowfiy Demo | AI That Finds Your Next Customer" — a ~3-minute walkthrough showing how to describe leads in plain English and let Flowfiy find, qualify, and write the outreach
- [Pricing](${BASE_URL}/pricing): plans and FAQ
- [Use cases](${BASE_URL}/use-cases): AI lead generation, cold email automation
- [Flowfiy vs Clay](${BASE_URL}/vs/clay): comparison
- [Flowfiy vs Apollo](${BASE_URL}/vs/apollo): comparison
- [Blog](${BASE_URL}/blog): outbound sales and AI guides
- [About](${BASE_URL}/about): company
- [Affiliates](${BASE_URL}/affiliates): 30% lifetime affiliate program

## Common questions
- What is Flowfiy? An AI B2B outbound sales platform where you describe the leads you want in plain English and it finds, researches, qualifies, and writes personalized cold emails automatically.
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
