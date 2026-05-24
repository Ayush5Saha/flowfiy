const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Footer, Header, AlignmentType, HeadingLevel, BorderStyle, PageNumber,
  WidthType, ShadingType, VerticalAlign,
} = require("docx");

const A4_W = 11906;
const A4_H = 16838;
const MARGIN_TOP = 1000;
const MARGIN_SIDE = 1134;
const CONTENT_W = A4_W - MARGIN_SIDE * 2; // 9638

// ── Colour palette (black & white + one accent) ───────────────────────────────
const BLACK   = "111111";
const DARK    = "222222";
const MID     = "444444";
const LIGHT   = "777777";
const RULE    = "DDDDDD";
const ACCENT  = "111111"; // keep mono — no colour as instructed

// ── Helpers ───────────────────────────────────────────────────────────────────
const gap = (pt = 6) => new Paragraph({
  spacing: { before: 0, after: pt * 20 },
  children: [new TextRun("")],
});

const rule = () => new Paragraph({
  spacing: { before: 80, after: 80 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 2 } },
  children: [new TextRun("")],
});

function sectionLabel(text) {
  return new Paragraph({
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK, space: 4 } },
    children: [
      new TextRun({ text: text.toUpperCase(), font: "Arial", bold: true, size: 20, characterSpacing: 120, color: BLACK }),
    ],
  });
}

// Big stat block — number + label + supporting note
function statRow(items) {
  // items = [{num, label, note}]
  const cells = items.map(({ num, label, note }) =>
    new TableCell({
      width: { size: Math.floor(CONTENT_W / items.length), type: WidthType.DXA },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      borders: {
        top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 40 },
          children: [new TextRun({ text: num, font: "Arial", bold: true, size: 52, color: BLACK })],
        }),
        new Paragraph({
          spacing: { before: 0, after: 40 },
          children: [new TextRun({ text: label, font: "Arial", bold: true, size: 20, color: DARK })],
        }),
        new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: note, font: "Arial", size: 17, color: LIGHT, italics: true })],
        }),
      ],
    })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: items.map(() => Math.floor(CONTENT_W / items.length)),
    rows: [new TableRow({ children: cells })],
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.SINGLE, size: 4, color: RULE },
    },
  });
}

// Two-column bullet row
function bulletPara(label, value) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: label + "  ", font: "Arial", bold: true, size: 21, color: DARK }),
      new TextRun({ text: value, font: "Arial", size: 21, color: MID }),
    ],
  });
}

// Quote / callout block
function callout(text) {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    indent: { left: 480 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: BLACK, space: 12 },
    },
    children: [
      new TextRun({ text, font: "Arial", size: 23, italics: true, color: DARK }),
    ],
  });
}

function bodyText(text, bold = false) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 21, bold, color: MID })],
  });
}

function boldLine(text) {
  return new Paragraph({
    spacing: { before: 100, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: DARK })],
  });
}

// Comparison table
function compTable(headers, rows) {
  const colW = Math.floor(CONTENT_W / headers.length);
  const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
  const borders = { top: border, bottom: border, left: border, right: border };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) =>
      new TableCell({
        width: { size: colW, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 140, right: 140 },
        shading: { fill: "F0F0F0", type: ShadingType.CLEAR },
        borders,
        children: [new Paragraph({
          children: [new TextRun({ text: h, font: "Arial", bold: true, size: 19, color: BLACK })],
        })],
      })
    ),
  });

  const dataRows = rows.map((row) =>
    new TableRow({
      children: row.map((cell, i) =>
        new TableCell({
          width: { size: colW, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          borders,
          children: [new Paragraph({
            children: [new TextRun({
              text: String(cell),
              font: "Arial",
              size: 19,
              bold: i === 0,
              color: i === 0 ? DARK : MID,
            })],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: headers.map(() => colW),
    rows: [headerRow, ...dataRows],
  });
}

// ── Document body ─────────────────────────────────────────────────────────────
const children = [];

// ─────────────────────────────────────────────────────────────────────────────
// COVER
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(4),
  new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "FLOWFIY", font: "Arial", bold: true, size: 72, color: BLACK })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLACK, space: 8 } },
    children: [new TextRun({ text: "Investor Data Points — Quick Reference", font: "Arial", size: 28, color: MID })],
  }),
  gap(4),
  callout(
    "The only full-stack AI outbound platform at SMB pricing. " +
    "BYOK model means near-100% gross margins from day one."
  ),
  gap(10),
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. THE MARKET OPPORTUNITY
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  sectionLabel("1.  The Market Opportunity"),
  gap(6),
  statRow([
    { num: "$4.12B",  label: "AI SDR Market (2025)",  note: "Current addressable market size" },
    { num: "$15.01B", label: "AI SDR Market (2030)",  note: "Projected in 5 years" },
    { num: "29.5%",   label: "CAGR",                  note: "Fastest-growing B2B SaaS segment" },
  ]),
  gap(10),
  statRow([
    { num: "4.2M+",  label: "SMBs Running Outbound",  note: "Globally — our primary TAM" },
    { num: "$1,200", label: "Avg Monthly Tool Spend",  note: "Clay + Apollo + Instantly stack" },
    { num: "$49–249", label: "Flowfiy Monthly Price",  note: "Full replacement at a fraction" },
  ]),
  gap(8),
  bodyText("The market is moving fast. Artisan and 11x charge $2,000–$5,000/month for an \"AI SDR\" that replaces the human entirely — and they're facing backlash. Buyers want control. Flowfiy gives them the power of a full AI pipeline while keeping the human in the loop at a price any SMB can afford."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. THE PROBLEM
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("2.  The Problem We Solve"),
  gap(6),
  boldLine("Most SMBs and agencies have no outbound system at all."),
  bodyText("They rely on referrals, post on LinkedIn, and hope for inbound. When that dries up, the founder does BD manually — which doesn't scale. The ones who try to build an outbound stack hit three walls:"),
  gap(4),
  bulletPara("Wall 1 — Cost:", "Clay ($800/mo) + Apollo ($500/mo) + Instantly ($97/mo) = $1,400+/month before a single lead is worked."),
  bulletPara("Wall 2 — Complexity:", "These tools don't talk to each other. Stitching them into a workflow takes weeks of setup and a technical co-founder."),
  bulletPara("Wall 3 — Generic output:", "Even with the tools, the emails are generic. No real personalization. Reply rates stay below 1%."),
  gap(6),
  callout("Flowfiy collapses the entire stack — discovery, research, qualification, personalization, sending, and follow-up — into one platform that runs on autopilot."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. THE PRODUCT
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("3.  The Product — What It Does"),
  gap(6),
  boldLine("5-Agent Claude AI Pipeline:"),
  gap(4),
  bulletPara("Agent 1 — ICP Analyzer:", "Reads the user's business profile and generates a precise Ideal Customer Profile."),
  bulletPara("Agent 2 — Lead Discovery:", "Searches Apollo.io's 275M+ contacts using ICP-derived parameters. Fully autonomous."),
  bulletPara("Agent 3 — Company Analyzer:", "Scrapes each prospect's website in real time via Apify to gather live business intelligence."),
  bulletPara("Agent 4 — Qualification Agent:", "Scores each lead 0–100. Leads above 60 are QUALIFIED. Below that, DISQUALIFIED."),
  bulletPara("Agent 5 — Personalization Agent:", "Writes a personalized email + 3 follow-ups grounded in real research, not templates."),
  gap(6),
  boldLine("Then the platform handles everything else automatically:"),
  gap(4),
  bulletPara("Sends via Gmail:", "From the user's own inbox. No shared sending domain — better deliverability."),
  bulletPara("Follow-ups:", "3-step sequence sent at user-defined intervals. Stops the moment a prospect replies."),
  bulletPara("Reply detection:", "Polls Gmail threads daily. Classifies replies as INTERESTED, OOO, NOT_INTERESTED, etc. using Claude Haiku."),
  bulletPara("A/B Testing:", "Splits leads 50/50 across two email variants. Declares a winner automatically."),
  bulletPara("Timezone scheduling:", "Sends only between 08:00–18:00 in the prospect's local time. 50+ country timezone mappings."),
  bulletPara("Webhook integrations:", "Pushes events (lead qualified, reply received) to Zapier, Make, or any CRM in real time."),
  gap(6),
  statRow([
    { num: "38",   label: "Features Shipped",       note: "In production as of May 2026" },
    { num: "6",    label: "Tool Categories",         note: "AI, Campaigns, Deliverability, Integrations, Billing, Infra" },
    { num: "100%", label: "Async Architecture",      note: "BullMQ + Redis — never blocks the UI" },
  ]),
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. THE BUSINESS MODEL — BYOK
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("4.  Business Model — Why BYOK Changes Everything"),
  gap(6),
  callout(
    "BYOK = Bring Your Own Key. Users connect their own Anthropic API key. " +
    "Flowfiy never pays for Claude calls. That cost hits the user's Anthropic bill directly."
  ),
  gap(6),
  boldLine("What this means for gross margins:"),
  gap(4),
  bulletPara("Traditional AI SaaS:", "Company buys compute → resells it → margins crushed to 40–60%."),
  bulletPara("Flowfiy (BYOK):", "User pays Anthropic directly → Flowfiy's COGS = hosting only → gross margin ~95%."),
  gap(6),
  statRow([
    { num: "~95%",   label: "Gross Margin",           note: "Infrastructure is the only COGS" },
    { num: "$0",     label: "Claude API Cost to Us",   note: "100% passed through to users" },
    { num: "∞",      label: "Scalability",             note: "Adding users doesn't add AI cost" },
  ]),
  gap(8),
  bodyText("This is the same model that made Vercel, Railway, and Supabase defensible — sell the platform, not the commodity. As Claude gets cheaper, users benefit. Flowfiy's margins stay constant regardless of model pricing fluctuations."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. PRICING
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("5.  Pricing Tiers"),
  gap(6),
  compTable(
    ["Plan", "Price (INR)", "Price (USD)", "Lead Gens/mo", "Seats", "Best For"],
    [
      ["Free",    "₹0",      "$0",    "50",        "1",  "Try the pipeline"],
      ["Starter", "₹4,900",  "$59",   "500",       "1",  "Solo founders"],
      ["Growth",  "₹9,900",  "$119",  "7,500",     "5",  "Growing teams"],
      ["Agency",  "₹24,900", "$299",  "Unlimited", "20", "Agencies & resellers"],
    ]
  ),
  gap(8),
  boldLine("Dual billing gateway:"),
  bulletPara("India (INR):", "Razorpay subscriptions — preferred payment method for Indian users."),
  bulletPara("International (USD):", "Stripe Checkout — auto-detected by IP geolocation, no friction."),
  bulletPara("Currency display:", "Prices shown in user's local currency (AED, GBP, EUR, SGD, etc.) on the landing page."),
  gap(6),
  statRow([
    { num: "$119",  label: "Growth ARPU (USD)",    note: "Primary target segment" },
    { num: "$299",  label: "Agency ARPU (USD)",     note: "High-value, multi-seat" },
    { num: "0%",    label: "Churn Incentive",       note: "Sequences, leads & history lock users in" },
  ]),
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPETITIVE LANDSCAPE
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("6.  Competitive Landscape"),
  gap(6),
  compTable(
    ["Company", "Valuation", "Price/mo", "Full Pipeline?", "BYOK?", "SMB-Friendly?"],
    [
      ["Clay",        "$3.1B",  "$800+",      "No — enrichment only",      "No",  "No"],
      ["Apollo.io",   "$1.6B",  "$500+",      "No — discovery only",       "No",  "Partial"],
      ["Artisan",     "N/A",    "$2,000–5,000","Yes — replaces the human",  "No",  "No"],
      ["11x.ai",      "N/A",    "$2,000–5,000","Yes — replaces the human",  "No",  "No"],
      ["Instantly",   "N/A",    "$97+",        "No — sending only",         "No",  "Yes"],
      ["Flowfiy",     "Seed",   "$49–299",     "Yes — full stack",          "Yes", "Yes"],
    ]
  ),
  gap(8),
  boldLine("Our competitive moat:"),
  bulletPara("Price:", "10–40x cheaper than Artisan/11x for the same outcome."),
  bulletPara("Completeness:", "Clay, Apollo, and Instantly each do one thing. Flowfiy does all of it."),
  bulletPara("BYOK margin advantage:", "Competitors absorb AI compute costs. We don't."),
  bulletPara("Control:", "Users approve every email before it sends. Artisan backlash is real — buyers want oversight."),
  bulletPara("Depth:", "38 features including A/B testing, timezone scheduling, webhook integrations, suppression — not just a lead scraper."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. TRACTION & PROGRESS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("7.  Traction & Build Progress"),
  gap(6),
  statRow([
    { num: "38",   label: "Features in Production",  note: "Full product live at flowfiy.com" },
    { num: "5",    label: "AI Agents Built",          note: "ICP → Discovery → Research → Qualify → Personalize" },
    { num: "2",    label: "Payment Gateways Live",    note: "Razorpay (INR) + Stripe (USD)" },
  ]),
  gap(8),
  boldLine("Infrastructure already live:"),
  bulletPara("Hosting:", "Vercel (Next.js frontend + API) + Railway (BullMQ worker) + Supabase (PostgreSQL)"),
  bulletPara("Job queue:", "BullMQ + Upstash Redis for async email sends and pipeline runs"),
  bulletPara("Security:", "AES-256-GCM credential encryption, HMAC-signed webhooks, HMAC-signed unsubscribe tokens"),
  bulletPara("Compliance:", "Unsubscribe links on every email, suppression list, audit logs, bounce classification"),
  bulletPara("Integrations:", "Claude (BYOK), Gmail OAuth, Apollo.io, Apify, Calendly, Razorpay, Stripe"),
  gap(6),
  callout("The full product is built and deployed. We are not raising to build — we are raising to acquire users and grow."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. UNIT ECONOMICS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("8.  Unit Economics (Projections)"),
  gap(6),
  compTable(
    ["Metric", "Month 6", "Month 12", "Month 24"],
    [
      ["Paying Customers",   "50",      "200",       "800"],
      ["Avg MRR per user",   "$89",     "$99",       "$119"],
      ["MRR",                "$4,450",  "$19,800",   "$95,200"],
      ["ARR",                "$53,400", "$237,600",  "$1.14M"],
      ["Gross Margin",       "~95%",    "~95%",      "~95%"],
      ["Customer Acq. Cost", "<$30",    "<$25",      "<$20"],
      ["LTV (est. 18mo)",    "$1,600",  "$1,782",    "$2,142"],
      ["LTV:CAC Ratio",      "53:1",    "71:1",      "107:1"],
    ]
  ),
  gap(8),
  bodyText("LTV:CAC ratios are high because acquisition is primarily content-led and organic. CAC is driven by our own Flowfiy outbound system — we eat our own cooking. Every signed customer is a proof of product."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. GO-TO-MARKET
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("9.  Go-To-Market Strategy"),
  gap(6),
  bulletPara("Channel 1 — Outbound (using Flowfiy itself):", "We use our own platform to find and contact ideal customers. Marketing agencies, web dev agencies, consultancies, and service businesses in India and UAE. Every signed customer validates the product."),
  bulletPara("Channel 2 — SEO & content:", "Targeting search terms like 'AI cold email tool', 'Apollo alternative', 'Clay alternative for small business'. Long-tail content builds compounding organic traffic."),
  bulletPara("Channel 3 — Product-led free tier:", "50 free lead generations with no credit card required. Users experience the full pipeline — ICP analysis, real leads, personalized emails — before they pay."),
  bulletPara("Channel 4 — Agency partnerships:", "Agencies on the Agency plan ($299/mo, 20 seats) resell Flowfiy to their own clients. Built-in distribution with no extra CAC."),
  bulletPara("Target ICP:", "Marketing agencies, branding agencies, web dev agencies, consulting firms — 2 to 50 employees, India and UAE — founder-led sales."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. THE ASK
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("10.  The Ask"),
  gap(6),
  statRow([
    { num: "$150K",   label: "Seed Round Target",      note: "Pre-seed / angel round" },
    { num: "18 mo",   label: "Runway",                  note: "At current burn rate" },
    { num: "10–15%",  label: "Equity Offered",          note: "Negotiable based on terms" },
  ]),
  gap(8),
  boldLine("Use of funds:"),
  bulletPara("40% — User Acquisition:", "Paid content promotion, SEO, outbound campaigns, community partnerships."),
  bulletPara("30% — Hiring:", "One full-stack engineer and one growth/sales hire."),
  bulletPara("20% — Infrastructure & operations:", "Scaling Railway workers, Supabase, Redis as user volume grows."),
  bulletPara("10% — Legal & compliance:", "Entity formation, terms of service, GDPR/data policy work."),
  gap(8),
  callout(
    "We are not raising to figure out what to build. The product is live, the architecture is solid, " +
    "the margins are structural. We are raising to pour fuel on distribution."
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. KEY RISKS & MITIGATIONS
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(6),
  sectionLabel("11.  Key Risks & How We Mitigate Them"),
  gap(6),
  bulletPara("Risk — Anthropic API dependency:", "BYOK means users hold their own keys. If Anthropic pricing changes, it only affects user costs, not Flowfiy's margins. We can also add support for other model providers (Gemini, GPT-4o) as alternatives."),
  bulletPara("Risk — Gmail API restrictions:", "Google enforces OAuth verification for production apps. We are in the verification process. In parallel, we are building SMTP fallback (Resend, SendGrid) as an alternative sending channel."),
  bulletPara("Risk — Apollo rate limits:", "Apollo search quotas are per API key. We handle this with smart pagination, caching, and graceful degradation to Apify-based sourcing when Apollo is unavailable."),
  bulletPara("Risk — Competitive pressure:", "Clay and Apollo have massive resources. Our bet is on SMB affordability + completeness + BYOK margins — a wedge the incumbents cannot easily copy without destroying their own margin structure."),
  bulletPara("Risk — Deliverability:", "Cold email faces increasing spam filters. We mitigate this with: sending from user's own Gmail (not a shared domain), hard bounce suppression, unsubscribe compliance, and timezone-aware scheduling."),
);

// ─────────────────────────────────────────────────────────────────────────────
// 12. ONE-LINE CLOSER
// ─────────────────────────────────────────────────────────────────────────────
children.push(
  gap(10),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: BLACK, space: 8 },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK, space: 8 },
    },
    children: [],
  }),
  new Paragraph({
    spacing: { before: 160, after: 160 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "Flowfiy is what happens when you take a $1,400/month tool stack, compress it into one AI pipeline, and price it at $49.",
        font: "Arial",
        bold: true,
        size: 24,
        color: BLACK,
        italics: true,
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK, space: 8 },
    },
    children: [],
  }),
);

// ── Assemble ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 21 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: BLACK },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: A4_W, height: A4_H },
          margin: { top: MARGIN_TOP, right: MARGIN_SIDE, bottom: 1000, left: MARGIN_SIDE },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } },
              children: [
                new TextRun({ text: "Flowfiy  |  Confidential — For Investor Use Only  |  Page ", font: "Arial", size: 16, color: LIGHT }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: LIGHT }),
                new TextRun({ text: " of ", font: "Arial", size: 16, color: LIGHT }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: LIGHT }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = "E:\\CodeX Developemt\\AI_Sales_outbound_system\\Flowfiy_Investor_DataPoints.docx";
  fs.writeFileSync(out, buf);
  console.log("Done:", out, `(${(buf.length / 1024).toFixed(1)} KB)`);
});
