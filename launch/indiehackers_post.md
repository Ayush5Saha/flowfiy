# IndieHackers Post

**Title:**
From manual outbound grind to a plain-English AI pipeline — how I built Flowfiy and what I learned

**Body:**

Hey IH,

I want to share something I've been building and get honest feedback from founders who do outbound.

**The problem I was solving for myself:**

I run a small AI automation business. Getting clients required outbound. Outbound required hours of research per week. I was spending more time finding and qualifying leads than actually doing the work.

**What I built:**

Flowfiy (flowfiy.com) — a fully managed AI pipeline for B2B outbound.

You set up your business profile and ICP once. Then describe the leads you want in plain English (even by condition — "no website", "bad reviews") and it:
1. Finds matching leads across Google Maps + a B2B people database
2. Reads each company's website for intelligence
3. Scores every lead 0–100 against your criteria
4. Writes personalized email sequences for qualified leads
5. Sends via Gmail with automatic follow-ups and reply detection

**The honest numbers:**

- ~2 leads per credit (you only pay for qualified leads)
- ~20 minutes per run
- ~50 qualified leads with full email sequences per 100 pulled

**3 things that took longer than expected:**

1. **Token predictability** — the model's output varied a lot by user/input until I built a central config (temperature=0, hard input caps, output char limits in every prompt). Took a full week just to stabilize.

2. **Onboarding** — Early version required a Bring Your Own Key setup. Killed conversion. Moved to fully managed AI + data (we run it centrally). Night and day difference in activation.

3. **The qualification step** — Getting the scoring right took 10+ iterations. Too low = garbage leads getting emails. Too high = too few qualified leads to make the system worth using.

**Where I am now:**

Product is live. Your first 100 leads are free on credits (no subscription); after that it's $50/mo for 400 credits. I have zero users from outside my network.

That's why I'm here. If you're doing B2B outbound and either (a) hate the research grind or (b) pay for tools like Clay + Apollo + Instantly separately, Flowfiy is worth trying.

What questions do you have? Happy to go deep on the technical side or the outbound strategy side.

→ flowfiy.com
