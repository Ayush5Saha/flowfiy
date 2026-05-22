# Reddit Post — r/SaaS

**Title:**
I built a 5-agent Claude AI pipeline that researches leads, scores them 0–100, and writes personalized cold emails. Free to try.

**Body:**

Been building this for a few months. Finally feels ready to share.

**What it does:**

You describe your ideal customer (ICP), and 5 AI agents run in sequence:

1. **ICP Analyzer** — reads your business profile, generates Apollo search filters, qualifying signals, and outreach angles
2. **Lead Discovery** — hits Apollo.io and pulls matching leads
3. **Company Analyzer** — scrapes each company's website and builds an intelligence report
4. **Qualification Agent** — scores every lead 0–100 against your ICP
5. **Personalization Agent** — writes a subject line + 3-touch email sequence for each qualified lead, grounded in real company research

The whole run for 100 leads costs ~$1.05 in AI tokens (we manage Claude — no API key needed). You get a lead list with scores, research notes, and ready-to-send emails.

**Why I built it:**

The existing tools are either too expensive (Clay is great but $$$), too manual (Apollo gives you the leads but not the emails), or too "AI SDR" replacing humans (Artisan/11x — backlash is real). Flowfiy just automates the research + writing layer and puts the emails in front of you to review.

**Free tier:** 50 lead generations included. No credit card.

Would love brutal feedback from anyone running outbound.

→ flowfiy.com
