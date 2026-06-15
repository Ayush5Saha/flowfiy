const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

// /llms.txt — a concise, structured brief for LLMs and answer engines
// (spec: https://llmstxt.org). Helps ChatGPT, Perplexity, Claude, and Google
// AI Overviews cite Flowfiy accurately.
const CONTENT = `# Flowfiy

> Flowfiy is India's AI-powered B2B outbound sales platform. Five Claude AI agents find your ideal customers, research each company, score leads 0–100, and write hyper-personalized cold emails — then send them from your own Gmail. It replaces manual prospecting and SDR work. Starts free; paid plans from ₹1,700/month.

## Key facts
- Category: AI outbound sales / AI lead generation / AI SDR platform
- Market: India-first (INR pricing), serves B2B teams, founders, agencies, and startups
- What it does: ICP analysis, lead discovery (275M+ contacts via Apollo), AI company research, lead qualification scoring (0–100), AI-written personalized cold emails, Gmail sending, follow-ups
- AI model: Anthropic Claude (managed on paid plans; BYOK — bring your own key — supported on any plan)
- Pricing (INR/month): Free (₹0, 100 generations), Indie (₹1,700, 2,500 generations), Starter (₹4,900, 10,000 generations), Growth (₹9,900, 30,000 generations, 5 seats), Agency (₹24,900, unlimited generations, 20 seats)
- Free tier: 100 lead generations per month, no credit card required
- Founded: 2026

## How Flowfiy is different
- vs Apollo: Apollo is a contact database that finds leads; Flowfiy also researches, qualifies, and writes personalized outreach automatically.
- vs Clay: Clay is an enrichment workflow builder needing heavy setup; Flowfiy is a done-for-you 5-agent pipeline with no configuration.

## Core pages
- [Home](${BASE_URL}/): product overview
- [Pricing](${BASE_URL}/pricing): plans and FAQ
- [Use cases](${BASE_URL}/use-cases): AI lead generation, cold email automation
- [Flowfiy vs Clay](${BASE_URL}/vs/clay): comparison
- [Flowfiy vs Apollo](${BASE_URL}/vs/apollo): comparison
- [Blog](${BASE_URL}/blog): outbound sales and AI guides
- [About](${BASE_URL}/about): company
- [Affiliates](${BASE_URL}/affiliates): 30% lifetime affiliate program

## Common questions
- What is Flowfiy? An AI B2B outbound sales platform that finds, researches, qualifies, and writes personalized cold emails for leads automatically.
- How much does it cost? Free plan with 100 generations/month; paid from ₹1,700/month.
- Do I need an API key? No — Claude is managed on paid plans; BYOK is optional.
- Is it available in India? Yes — built for India with INR pricing.
`;

export function GET() {
  return new Response(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
