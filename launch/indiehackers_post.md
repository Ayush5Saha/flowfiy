# IndieHackers Post

**Title:**
From manual outbound grind to a 5-agent AI pipeline — how I built Flowfiy and what I learned

**Body:**

Hey IH,

I want to share something I've been building and get honest feedback from founders who do outbound.

**The problem I was solving for myself:**

I run a small AI automation business. Getting clients required outbound. Outbound required hours of research per week. I was spending more time finding and qualifying leads than actually doing the work.

**What I built:**

Flowfiy (flowfiy.com) — a 5-agent Claude AI pipeline for B2B outbound.

You set up your business profile and ICP once. Then run jobs that:
1. Pull leads from Apollo based on AI-generated filters
2. Scrape each company's website for intelligence
3. Score every lead 0–100 against your ICP
4. Write personalized email sequences for qualified leads
5. Send via Gmail with automatic follow-ups and reply detection

**The honest numbers:**

- ~$1.05 in AI cost per 100 leads
- ~20 minutes per run
- ~50 qualified leads with full email sequences per 100 pulled

**3 things that took longer than expected:**

1. **Token predictability** — Claude's output varied a lot by user/input until I built a central config (temperature=0, hard input caps, output char limits in every prompt). Took a full week just to stabilize.

2. **Onboarding** — Early version required a Bring Your Own Key setup for Anthropic. Killed conversion. Moved to managed AI (we pay centrally). Night and day difference in activation.

3. **The qualification step** — Getting the scoring right took 10+ iterations. Too low = garbage leads getting emails. Too high = too few qualified leads to make the system worth using.

**Where I am now:**

Product is live. Free tier is 50 generations. I have zero users from outside my network.

That's why I'm here. If you're doing B2B outbound and either (a) hate the research grind or (b) pay for tools like Clay + Apollo + Instantly separately, Flowfiy is worth trying.

What questions do you have? Happy to go deep on the technical side or the outbound strategy side.

→ flowfiy.com
