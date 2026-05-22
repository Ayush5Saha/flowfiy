# Hacker News — Show HN

**Title:**
Show HN: Flowfiy – 5-agent Claude pipeline that researches leads, scores them, and writes cold emails

**Body:**

Hey HN,

I built Flowfiy (flowfiy.com) — a 5-agent AI pipeline for B2B outbound sales research and email generation.

**The pipeline:**

1. ICP Analyzer (Haiku) — takes your business profile, outputs Apollo search filters + qualification criteria
2. Lead Discovery — Apollo.io API, returns up to 100 prospects per run
3. Company Analyzer (Sonnet) — Apify scrapes each website, Claude builds an intelligence report (brand maturity, acquisition gaps, tech stack signals, fit assessment)
4. Qualification Agent (Haiku) — scores leads 0–100 against your ICP, outputs reasoning + personalization hooks
5. Personalization Agent (Sonnet) — writes subject line + 3-touch email sequence per qualified lead, grounded in the company research

**Technical decisions worth sharing:**

- Orchestrator loop (not a fixed pipeline) — Claude decides when to scrape vs. skip based on available context
- temperature=0 on all agents + hard input truncation caps to make token spend predictable per run (was the biggest operational headache early on)
- ~240K tokens per 100-lead run (~$1.05) — we manage the API key centrally, no BYOK friction
- Gmail OAuth for sending — emails go out as replies in the same thread (for follow-ups)
- Reply detection via Gmail thread polling — follow-up sequence stops automatically on reply
- Timezone-aware send windows — won't send at 3am in the lead's local time

**Stack:** Next.js 15 / Supabase / Prisma / BullMQ / Railway (workers) / Vercel (app)

**What I'm unsure about:**
- Whether the qualification threshold (70/100) is too aggressive by default
- Whether the company analysis step adds enough value to justify the Apify cost for every lead
- Whether "review before send" is the right UX or if fully autonomous sends would convert better

Free tier: 50 lead generations. Would genuinely appreciate feedback on the architecture or the product.
