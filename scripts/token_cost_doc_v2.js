/**
 * Flowfiy Token Cost Analysis — v2 (post-standardization)
 * Updated to reflect src/ai/config.ts limits enforced in May 2026
 * Run: node scripts/token_cost_doc_v2.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageBreak, LevelFormat,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  indigo:   "4F46E5",
  indigoL:  "EEF2FF",
  slate900: "0F172A",
  slate700: "334155",
  slate500: "64748B",
  slate200: "E2E8F0",
  white:    "FFFFFF",
  green:    "166534",
  greenL:   "DCFCE7",
  amber:    "92400E",
  amberL:   "FEF3C7",
  red:      "991B1B",
  redL:     "FEE2E2",
  blue:     "1E40AF",
  blueL:    "DBEAFE",
  purple:   "6B21A8",
  purpleL:  "F3E8FF",
};

// ─── Borders / shading helpers ─────────────────────────────────────────────
const border  = (c = C.slate200) => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const borders = (c = C.slate200) => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) });
const shade   = (fill, type = ShadingType.CLEAR) => ({ fill, type });
const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 };

// ─── Reusable paragraph helpers ────────────────────────────────────────────
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 160 },
  children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: C.slate900 })],
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 120 },
  children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: C.indigo })],
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, font: "Arial", size: 20, bold: true, color: C.slate700 })],
});

const body = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  children: [new TextRun({ text, font: "Arial", size: 20, color: C.slate700, ...opts })],
});

const note = (text) => new Paragraph({
  spacing: { before: 80, after: 120 },
  children: [new TextRun({ text: `ⓘ  ${text}`, font: "Arial", size: 18, color: C.slate500, italics: true })],
});

const gap = (before = 160) => new Paragraph({ spacing: { before, after: 0 }, children: [] });

// ─── Table header row ──────────────────────────────────────────────────────
function headerRow(cols, widths) {
  return new TableRow({
    tableHeader: true,
    children: cols.map((text, i) =>
      new TableCell({
        borders: borders(C.indigo),
        width: { size: widths[i], type: WidthType.DXA },
        shading: shade(C.indigo),
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, font: "Arial", size: 18, bold: true, color: C.white })],
        })],
      })
    ),
  });
}

// ─── Data row ──────────────────────────────────────────────────────────────
function dataRow(cells, widths, { bg = C.white, bold = false, center = false } = {}) {
  return new TableRow({
    children: cells.map((text, i) =>
      new TableCell({
        borders: borders(),
        width: { size: widths[i], type: WidthType.DXA },
        shading: shade(bg),
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: center ? AlignmentType.CENTER : (i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER),
          children: [new TextRun({ text, font: "Arial", size: 18, bold, color: bg === C.white ? C.slate700 : C.slate900 })],
        })],
      })
    ),
  });
}

// ─── Info banner ───────────────────────────────────────────────────────────
function banner(text, bg, textColor) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [new TableCell({
          borders: borders(bg),
          width: { size: 9360, type: WidthType.DXA },
          shading: shade(bg),
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [new Paragraph({
            children: [new TextRun({ text, font: "Arial", size: 18, color: textColor })],
          })],
        })],
      }),
    ],
  });
}

// ─── KPI cards row (4-up) ─────────────────────────────────────────────────
function kpiTable(cards) {
  // cards = [{ value, label, bg, textColor }]
  const colW = 2340; // 9360 / 4
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: cards.map(() => colW),
    rows: [
      new TableRow({
        children: cards.map(({ value, label, bg, textColor }) =>
          new TableCell({
            borders: borders(bg),
            width: { size: colW, type: WidthType.DXA },
            shading: shade(bg),
            margins: { top: 160, bottom: 160, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: value, font: "Arial", size: 36, bold: true, color: textColor })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [new TextRun({ text: label, font: "Arial", size: 16, color: textColor })],
              }),
            ],
          })
        ),
      }),
    ],
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ══════════════════════════════════════════════════════════════════════════

const children = [];

// ── Cover / Title ─────────────────────────────────────────────────────────
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: "FLOWFIY AI", font: "Arial", size: 52, bold: true, color: C.indigo })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "Token Usage & Cost Analysis", font: "Arial", size: 36, bold: false, color: C.slate700 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 320 },
    children: [new TextRun({ text: "100 Lead Generation Run  •  May 2026 (v2)  •  Post-Standardization", font: "Arial", size: 18, color: C.slate500, italics: true })],
  }),
);

// ── Version badge ─────────────────────────────────────────────────────────
children.push(
  banner(
    "★  v2 Update  —  Token standardization (May 2026): temperature=0 on all agents, hard input truncation caps, and output character limits injected into all prompts. Result: ~62% fewer tokens per run, fully predictable spend per user.",
    C.indigoL, C.indigo
  ),
  gap(200),
);

// ── Quick Summary KPIs ────────────────────────────────────────────────────
children.push(h2("Quick Summary — 100 Leads"));
children.push(gap(80));
children.push(
  kpiTable([
    { value: "~240K",  label: "Total Tokens (was 631K)", bg: C.indigoL, textColor: C.indigo },
    { value: "~$1.05", label: "Total AI Cost (was $2.70)", bg: C.greenL, textColor: C.green },
    { value: "$0.011", label: "Cost per Lead (was $0.027)", bg: C.blueL, textColor: C.blue },
    { value: "~50",    label: "Qualified Leads Out (~50%)", bg: C.purpleL, textColor: C.purple },
  ])
);
children.push(gap(240));

// ─────────────────────────────────────────────────────────────────────────
// 1. PRICING ASSUMPTIONS
// ─────────────────────────────────────────────────────────────────────────
children.push(h1("1. Pricing Assumptions"));
children.push(body("All costs are based on Anthropic Claude pricing as of May 2026. Flowfiy uses two models in the pipeline: Claude Sonnet 4-5 for heavy AI reasoning tasks, and Claude Haiku 4-5 for fast classification tasks."));
children.push(gap(100));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2800, 3000, 1780, 1780],
  rows: [
    headerRow(["Model", "Used For", "Input / MTok", "Output / MTok"], [2800, 3000, 1780, 1780]),
    dataRow(["Claude Sonnet 4-5", "Company Analyzer, Personalization", "$3.00", "$15.00"], [2800, 3000, 1780, 1780]),
    dataRow(["Claude Haiku 4-5", "ICP Analyzer, Qualification Agent", "$0.80", "$4.00"], [2800, 3000, 1780, 1780], { bg: C.slate200 }),
  ],
}));
children.push(gap(100));
children.push(note("1 token ≈ 4 chars in English. A typical email (200 words) ≈ 267 tokens. A company website page ≈ 500-1,000 tokens."));

// ─────────────────────────────────────────────────────────────────────────
// 2. THE 5-AGENT PIPELINE
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(200));
children.push(h1("2. The 5-Agent Pipeline"));
children.push(body("Every lead generation run passes through five agents. Two agents use no Claude tokens (Apollo.io API for lead discovery and Apify for website scraping). Three agents use Claude AI. One agent runs once per job; two run once per lead; and the Personalization Agent runs only for qualified leads (~50%)."));
children.push(gap(100));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [400, 2200, 2000, 2400, 2360],
  rows: [
    headerRow(["#", "Agent", "Model", "Runs", "Claude?"], [400, 2200, 2000, 2400, 2360]),
    dataRow(["1", "ICP Analyzer", "Haiku 4-5", "Once per job", "Yes"], [400, 2200, 2000, 2400, 2360]),
    dataRow(["2", "Lead Discovery", "Apollo.io API", "Once per job (100 leads)", "No (API)"], [400, 2200, 2000, 2400, 2360], { bg: C.slate200 }),
    dataRow(["3", "Company Analyzer", "Sonnet 4-5", "Per lead (100x)", "Yes"], [400, 2200, 2000, 2400, 2360]),
    dataRow(["4", "Qualification Agent", "Haiku 4-5", "Per lead (100x)", "Yes"], [400, 2200, 2000, 2400, 2360], { bg: C.slate200 }),
    dataRow(["5", "Personalization Agent", "Sonnet 4-5", "Per qualified lead (~50x)", "Yes"], [400, 2200, 2000, 2400, 2360]),
  ],
}));

// ─────────────────────────────────────────────────────────────────────────
// 3. TOKEN BREAKDOWN PER AGENT
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("3. Token Breakdown Per Agent"));

// --- Agent 1 ---
children.push(gap(120));
children.push(h3("Agent 1 — ICP Analyzer (Haiku 4-5)"));
children.push(body("Runs once per job. Reads the user’s business profile and converts it into structured ICP signals, Apollo search filters, outreach angles, and qualification criteria."));
children.push(gap(80));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [6480, 2880],
  rows: [
    headerRow(["Input Component", "Estimated Tokens"], [6480, 2880]),
    dataRow(["System prompt + instructions", "~250"], [6480, 2880]),
    dataRow(["Business profile (name, service, ICP, geographies, industries)", "~400"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Pain points + positioning + tone", "~150"], [6480, 2880]),
    dataRow(["Total Input", "~800"], [6480, 2880], { bold: true, bg: C.indigoL }),
  ],
}));
children.push(gap(60));
children.push(body("Output: ICP JSON with buyer personas, qualifying/disqualifying signals, Apollo filters, outreach angles, qualification criteria."));
children.push(body("Output tokens: ~350 (was ~500; char limits per field now enforced in prompt — max_tokens cap: 500)"));
children.push(body("Total Agent 1: ~1,150 tokens", { bold: true }));

// --- Agent 2 ---
children.push(gap(160));
children.push(h3("Agent 2 — Lead Discovery (Apollo.io — no Claude tokens)"));
children.push(body("Apollo.io REST API call — returns up to 100 raw lead records. No Claude tokens consumed. Apollo API cost is paid by the user via their own Apollo.io subscription."));

// --- Agent 3 ---
children.push(gap(160));
children.push(h3("Agent 3 — Company Analyzer (Sonnet 4-5) — Most Token-Heavy"));
children.push(body("Runs per lead. Apify scrapes the company website and feeds the content to Claude Sonnet for analysis."));
children.push(gap(60));
children.push(banner(
  "★  v2 change: Website content is now hard-capped at 2,000 chars (≈ 500 tokens) by INPUT_LIMITS.websiteContent in src/ai/config.ts. Previously estimated at ~2,000 tokens (8,000 chars). ICP summary is also capped at 400 chars (≈ 100 tokens). Total input per lead dropped from ~2,700 to ~950 tokens.",
  C.amberL, C.amber
));
children.push(gap(80));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [6480, 2880],
  rows: [
    headerRow(["Input Component (per lead)", "Tokens"], [6480, 2880]),
    dataRow(["System prompt + instructions", "~300"], [6480, 2880]),
    dataRow(["ICP summary (hard cap: 400 chars = 100 tokens)", "~100"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Lead info (name, title, company, location)", "~50"], [6480, 2880]),
    dataRow(["Apify scraped website content (hard cap: 2,000 chars = 500 tokens)", "~500"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Total Input per lead", "~950"], [6480, 2880], { bold: true, bg: C.indigoL }),
  ],
}));
children.push(gap(60));
children.push(body("Output: Brand maturity, marketing quality, acquisition gaps, growth bottlenecks, tech stack, recent signals, fit assessment, best outreach angle, confidence score."));
children.push(body("Output tokens per lead: ~260 (was ~500; output char limits enforced in prompt — max_tokens cap: 512)"));
children.push(body("Total per lead: ~1,210 tokens  |  Total for 100 leads: ~121,000 tokens", { bold: true }));
children.push(gap(60));
children.push(note("When Apify is not connected (optional), website content is empty and input drops to ~450 tokens/lead — cutting this agent’s cost by ~47%."));

// --- Agent 4 ---
children.push(gap(160));
children.push(h3("Agent 4 — Qualification Agent (Haiku 4-5)"));
children.push(body("Runs per lead. Scores each lead 0–100 against the ICP. Leads ≥70 are marked QUALIFIED. Uses Haiku because this is a classification/scoring task."));
children.push(gap(60));
children.push(banner(
  "★  v2 change: Company analysis JSON is now serialized compact (no pretty-print) and truncated to 600 chars (≈ 150 tokens) instead of ~500 tokens. ICP summary and qualification criteria are also capped. Total input per lead dropped from ~1,400 to ~625 tokens.",
  C.amberL, C.amber
));
children.push(gap(80));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [6480, 2880],
  rows: [
    headerRow(["Input Component (per lead)", "Tokens"], [6480, 2880]),
    dataRow(["System prompt + scoring rubric", "~250"], [6480, 2880]),
    dataRow(["Lead info (title, company, location, size)", "~50"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Company analysis JSON (compact, hard cap: 600 chars = 150 tokens)", "~150"], [6480, 2880]),
    dataRow(["ICP summary (hard cap: 400 chars = 100 tokens)", "~100"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Qualification criteria (hard cap: 300 chars = 75 tokens)", "~75"], [6480, 2880]),
    dataRow(["Total Input per lead", "~625"], [6480, 2880], { bold: true, bg: C.indigoL }),
  ],
}));
children.push(gap(60));
children.push(body("Output: Score 0–100, qualified flag, primary reason, best outreach angle, pain point match, 2–3 personalization hooks."));
children.push(body("Output tokens per lead: ~130 (was ~300; output char limits enforced — max_tokens cap: 256)"));
children.push(body("Total per lead: ~755 tokens  |  Total for 100 leads: ~75,500 tokens", { bold: true }));

// --- Agent 5 ---
children.push(gap(160));
children.push(h3("Agent 5 — Personalization Agent (Sonnet 4-5)"));
children.push(body("Runs only for QUALIFIED leads. Assumes ~50 of 100 leads pass qualification (50% rate). Writes a personalized subject line + 3-touch email sequence grounded in real company research."));
children.push(gap(60));
children.push(banner(
  "★  v2 change: Hard character limits per field are now injected directly into the prompt (subjectLine ≤55 chars, emailBody ≤400 chars, followUp1 ≤200 chars, followUp2 ≤130 chars). Output tokens dropped from ~800 to ~200. max_tokens reduced from 1,500 to 700.",
  C.amberL, C.amber
));
children.push(gap(80));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [6480, 2880],
  rows: [
    headerRow(["Input Component (per qualified lead)", "Tokens"], [6480, 2880]),
    dataRow(["System prompt + tone/style instructions", "~300"], [6480, 2880]),
    dataRow(["About the Sender (service, positioning)", "~150"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Lead Profile (name, title, company, industry)", "~50"], [6480, 2880]),
    dataRow(["Outreach Strategy (best angle, pain point, 3 hooks from Agent 4)", "~100"], [6480, 2880], { bg: C.slate200 }),
    dataRow(["Total Input per qualified lead", "~600"], [6480, 2880], { bold: true, bg: C.indigoL }),
  ],
}));
children.push(gap(60));
children.push(body("Output per qualified lead: Subject line (≤55 chars) + email body (≤400 chars) + follow-up 1 (≤200 chars) + follow-up 2 (≤130 chars)"));
children.push(body("Output tokens per lead: ~200 (was ~800; hard char limits in prompt — max_tokens cap: 700)"));
children.push(body("Total per qualified lead: ~800 tokens  |  Total for 50 qualified leads: ~40,000 tokens", { bold: true }));

// ─────────────────────────────────────────────────────────────────────────
// 4. GRAND TOTAL
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("4. Grand Total — 100 Leads"));

children.push(h3("4.1  Token Summary"));
children.push(gap(80));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2800, 1500, 1780, 1780, 1500],
  rows: [
    headerRow(["Agent", "Model", "Input Tokens", "Output Tokens", "Total"], [2800, 1500, 1780, 1780, 1500]),
    dataRow(["ICP Analyzer", "Haiku 4-5", "800", "350", "1,150"], [2800, 1500, 1780, 1780, 1500]),
    dataRow(["Lead Discovery", "Apollo API", "—", "—", "—"], [2800, 1500, 1780, 1780, 1500], { bg: C.slate200 }),
    dataRow(["Company Analyzer", "Sonnet 4-5", "95,000", "26,000", "121,000"], [2800, 1500, 1780, 1780, 1500]),
    dataRow(["Qualification Agent", "Haiku 4-5", "62,500", "13,000", "75,500"], [2800, 1500, 1780, 1780, 1500], { bg: C.slate200 }),
    dataRow(["Personalization Agent", "Sonnet 4-5", "30,000", "10,000", "40,000"], [2800, 1500, 1780, 1780, 1500]),
    dataRow(["TOTAL", "—", "~188,300", "~49,350", "~237,650"], [2800, 1500, 1780, 1780, 1500], { bold: true, bg: C.indigoL }),
  ],
}));
children.push(gap(60));
children.push(note("~240,000 tokens rounded (was ~631,500 in v1). A 62% reduction driven by hard input caps in src/ai/config.ts."));

children.push(gap(160));
children.push(h3("4.2  Cost Breakdown"));
children.push(gap(80));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2500, 1500, 1340, 1500, 1340, 1180],
  rows: [
    headerRow(["Model", "Input Tokens", "Input Cost", "Output Tokens", "Output Cost", "Subtotal"], [2500, 1500, 1340, 1500, 1340, 1180]),
    dataRow(["Sonnet 4-5\n(Co. Analyzer + Person.)", "125,000", "$0.375", "36,000", "$0.540", "$0.915"], [2500, 1500, 1340, 1500, 1340, 1180]),
    dataRow(["Haiku 4-5\n(ICP + Qualification)", "63,300", "$0.051", "13,350", "$0.053", "$0.104"], [2500, 1500, 1340, 1500, 1340, 1180], { bg: C.slate200 }),
    dataRow(["TOTAL — 100 LEADS", "~188,300", "$0.426", "~49,350", "$0.593", "~$1.05"], [2500, 1500, 1340, 1500, 1340, 1180], { bold: true, bg: C.indigoL }),
  ],
}));
children.push(gap(80));
children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [4680, 4680],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: borders(C.green),
          width: { size: 4680, type: WidthType.DXA },
          shading: shade(C.greenL),
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "Cost Per Lead", font: "Arial", size: 20, bold: true, color: C.green })] }),
            new Paragraph({ children: [new TextRun({ text: "~$0.011 per lead  (was $0.027)", font: "Arial", size: 28, bold: true, color: C.green })] }),
            new Paragraph({ children: [new TextRun({ text: "59% cheaper than v1", font: "Arial", size: 18, color: C.green })] }),
          ],
        }),
        new TableCell({
          borders: borders(C.blue),
          width: { size: 4680, type: WidthType.DXA },
          shading: shade(C.blueL),
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "Cost Per Qualified Lead", font: "Arial", size: 20, bold: true, color: C.blue })] }),
            new Paragraph({ children: [new TextRun({ text: "~$0.021 per qualified lead", font: "Arial", size: 28, bold: true, color: C.blue })] }),
            new Paragraph({ children: [new TextRun({ text: "At 50% qualification rate", font: "Arial", size: 18, color: C.blue })] }),
          ],
        }),
      ],
    }),
  ],
}));

// ─────────────────────────────────────────────────────────────────────────
// 5. COST SCENARIOS
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("5. Cost Scenarios — Min / Typical / Max"));
children.push(body("Token usage now has a much narrower range than v1 because all inputs are hard-capped in code. Website content can no longer drive runaway cost."));
children.push(gap(100));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1600, 2600, 1600, 1500, 2060],
  rows: [
    headerRow(["Scenario", "Key Variables", "Total Tokens", "Total Cost", "Cost / Lead"], [1600, 2600, 1600, 1500, 2060]),
    dataRow(["Minimum", "No Apify scraping, simple ICPs", "~165,000", "~$0.72", "$0.007"], [1600, 2600, 1600, 1500, 2060], { bg: C.greenL }),
    dataRow(["Typical", "Apify on ~70% of leads, avg website content", "~240,000", "~$1.05", "$0.011"], [1600, 2600, 1600, 1500, 2060]),
    dataRow(["Maximum", "All leads scraped, 70% qualification rate", "~260,000", "~$1.15", "$0.012"], [1600, 2600, 1600, 1500, 2060], { bg: C.amberL }),
  ],
}));
children.push(gap(100));

children.push(banner(
  "★  Why is the maximum so close to typical? In v1, the maximum was $6.00 because large websites could push Company Analyzer input to 5,000+ tokens/lead. In v2, the 2,000-char hard cap (500 tokens) eliminates this entirely. The only variable now is qualification rate (how many leads reach the Personalization Agent). Even at 100% qualification, maximum cost is ~$1.40.",
  C.blueL, C.blue
));
children.push(gap(80));
children.push(banner(
  "ⓘ  Minimum scenario: When Apify is not connected, website content is empty and Company Analyzer input drops from ~950 to ~450 tokens/lead. Total run cost: ~$0.72. The minimum is now higher than v1’s $0.80 because v1 estimates were underestimating the actual model costs.",
  C.indigoL, C.indigo
));

// ─────────────────────────────────────────────────────────────────────────
// 6. PLAN TIER ANALYSIS
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("6. How Many Lead Runs Per Plan?"));
children.push(body("Flowfiy applies two gates: a generation count limit (primary gate, shown in the sidebar) and a monthly token budget (secondary safety cap). With v2 token efficiency, the token budget is virtually never the limiting factor — the generation count limit will hit first in almost all cases."));
children.push(gap(100));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1200, 1000, 1800, 2200, 1560, 1600],
  rows: [
    headerRow(["Plan", "Price", "Token Budget / Month", "Est. Runs at Budget (tokens)", "AI Cost / Month (gen limit)", "Margin"], [1200, 1000, 1800, 2200, 1560, 1600]),
    dataRow(["Free", "$0", "500K", "~2.1 runs (gen limit: 50 leads = 0.5 runs)", "~$0.55", "~-$0.55 loss"], [1200, 1000, 1800, 2200, 1560, 1600]),
    dataRow(["Starter", "$49", "6M", "~25 runs (gen limit: 500 leads = 5 runs)", "~$5.25", "~$43.75 margin"], [1200, 1000, 1800, 2200, 1560, 1600], { bg: C.slate200 }),
    dataRow(["Growth", "$119", "20M", "~83 runs (gen limit: 1,500 leads = 15 runs)", "~$15.75", "~$103.25 margin"], [1200, 1000, 1800, 2200, 1560, 1600]),
    dataRow(["Agency", "$299", "Unlimited", "Unlimited", "Varies", "Built-in"], [1200, 1000, 1800, 2200, 1560, 1600], { bg: C.slate200 }),
  ],
}));
children.push(gap(100));
children.push(note("Generation count limit is the primary gate and will always hit first under normal usage. The token budget is a backstop for abnormal/runaway jobs only."));
children.push(note("Starter AI cost at gen limit: 500 leads × $0.011 = $5.25/month. Gross margin: ($49 - $5.25) / $49 = 89%."));
children.push(note("Growth AI cost at gen limit: 1,500 leads × $0.011 = $15.75/month. Gross margin: ($119 - $15.75) / $119 = 87%."));

// ─────────────────────────────────────────────────────────────────────────
// 7. TOKEN STANDARDIZATION — WHAT CHANGED IN V2
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("7. Token Standardization — What Changed in v2"));
children.push(body("Before v2, token usage varied per user, per run, and per company based on how much website content Apify scraped, how verbose the user's ICP description was, and Claude's natural tendency to write longer responses when not constrained. This made cost-per-run unpredictable and difficult to budget."));
children.push(gap(100));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2400, 2400, 2400, 2160],
  rows: [
    headerRow(["Change", "v1 (before)", "v2 (after)", "Impact"], [2400, 2400, 2400, 2160]),
    dataRow(["temperature", "Not set (default = 1)", "0 (all agents)", "Eliminates run-to-run output variance"], [2400, 2400, 2400, 2160]),
    dataRow(["websiteContent cap", "3,000 chars (~750 tok)", "2,000 chars (~500 tok)", "-33% input on Company Analyzer"], [2400, 2400, 2400, 2160], { bg: C.slate200 }),
    dataRow(["icpSummary cap", "Uncapped", "400 chars (~100 tok)", "Fixed input regardless of ICP length"], [2400, 2400, 2400, 2160]),
    dataRow(["companyAnalysis in Qualification", "Pretty-printed JSON (~500 tok)", "Compact JSON, 600 chars (~150 tok)", "-70% on this input field"], [2400, 2400, 2400, 2160], { bg: C.slate200 }),
    dataRow(["Output char limits in prompts", "None", "Injected for all fields in all prompts", "Guides Claude to concise output"], [2400, 2400, 2400, 2160]),
    dataRow(["max_tokens (ICP Analyzer)", "1,024", "500 (sized to actual schema)", "-51% output ceiling"], [2400, 2400, 2400, 2160], { bg: C.slate200 }),
    dataRow(["max_tokens (Company Analyzer)", "1,024", "512 (sized to actual schema)", "-50% output ceiling"], [2400, 2400, 2400, 2160]),
    dataRow(["max_tokens (Qualification)", "512", "256 (sized to actual schema)", "-50% output ceiling"], [2400, 2400, 2400, 2160], { bg: C.slate200 }),
    dataRow(["max_tokens (Personalization)", "1,500", "700 (sized to actual schema)", "-53% output ceiling"], [2400, 2400, 2400, 2160]),
    dataRow(["Model: Company Analyzer", "claude-sonnet-4-6 (invalid)", "claude-sonnet-4-5 (correct)", "Bug fix — was falling back to default"], [2400, 2400, 2400, 2160], { bg: C.amberL }),
    dataRow(["Model: Personalization", "claude-sonnet-4-6 (invalid)", "claude-sonnet-4-5 (correct)", "Bug fix — was falling back to default"], [2400, 2400, 2400, 2160], { bg: C.amberL }),
  ],
}));
children.push(gap(100));
children.push(banner(
  "⚠  Bug Fixed: Both Company Analyzer and Personalization Agent were calling model \"claude-sonnet-4-6\" which does not exist. Claude was likely falling back to a default model. Both are now correctly set to \"claude-sonnet-4-5\" via the central CLAUDE_MODELS.smart constant.",
  C.amberL, C.amber
));

// ─────────────────────────────────────────────────────────────────────────
// 8. MANAGED AI vs. BYOK COMPARISON
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("8. Managed AI vs. Old BYOK Model"));
children.push(body("Before Flowfiy switched to managed AI (central API key), users paid Anthropic directly. Here is how the economics compare after the v2 token optimization."));
children.push(gap(100));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2800, 3280, 3280],
  rows: [
    headerRow(["", "Old BYOK Model", "New Managed AI (v2)"], [2800, 3280, 3280]),
    dataRow(["Who pays Anthropic", "User (direct bill)", "Flowfiy (central API key)"], [2800, 3280, 3280]),
    dataRow(["Onboarding friction", "High — create Anthropic account + generate key + paste into Flowfiy", "Zero — works on sign-up"], [2800, 3280, 3280], { bg: C.slate200 }),
    dataRow(["Cost per 100 leads", "User bears it (~$1.05 after v2)", "Flowfiy bears it (~$1.05)"], [2800, 3280, 3280]),
    dataRow(["Token variance", "None (user controls their prompts)", "Fully standardized via config.ts"], [2800, 3280, 3280], { bg: C.slate200 }),
    dataRow(["Cost control", "None — unlimited spend per user", "Monthly token budget per plan tier"], [2800, 3280, 3280]),
    dataRow(["Gross Margin", "~95% (no Claude COGS)", "~87-89% at gen count limit"], [2800, 3280, 3280], { bg: C.slate200 }),
    dataRow(["User trust signal", "Confusing for non-technical users", "Seamless — feels like any SaaS product"], [2800, 3280, 3280]),
  ],
}));
children.push(gap(100));
children.push(banner(
  "★  Gross Margin at Starter plan: Revenue $49 − AI cost $5.25 = $43.75 gross margin = 89%. At Growth: $119 − $15.75 = $103.25 = 87%. These are strong SaaS margins even with fully managed AI. The generation count limit is the primary reason margins hold — typical users never approach the token budget ceiling.",
  C.greenL, C.green
));

// ─────────────────────────────────────────────────────────────────────────
// 9. KEY ASSUMPTIONS & NOTES
// ─────────────────────────────────────────────────────────────────────────
children.push(gap(240));
children.push(h1("9. Key Assumptions & Notes"));

const bullets = [
  "Qualification rate: Assumed 50% (50 of 100 leads qualify). Actual rates range 30%–65% depending on ICP specificity. Even at 70% qualification, maximum cost per 100 leads is ~$1.15.",
  "Apify scraping: Assumed active for all 100 leads in the typical scenario. When Apify is disabled, Company Analyzer input drops from ~950 to ~450 tokens/lead. Cost for a no-scraping run: ~$0.72/100 leads.",
  "Hard input caps are enforced in code (src/ai/config.ts INPUT_LIMITS), not just in prompts. No user action or malformed input can exceed these limits.",
  "temperature=0 on all agents means Claude always chooses the most probable token. Output length is consistent across all users and all runs for identical inputs.",
  "max_tokens values are sized to the maximum plausible JSON output per schema, not generous round numbers. The actual output is almost always smaller than the cap.",
  "Token counting method: These are estimates based on 4 chars ≈ 1 token. Actual usage is tracked in the organizations.monthly_tokens_used DB column and visible in the billing dashboard.",
  "Model bug fix: Company Analyzer and Personalization Agent were previously calling claude-sonnet-4-6 (non-existent model). Both now correctly use claude-sonnet-4-5 via CLAUDE_MODELS.smart.",
  "Price changes: Claude pricing may change. All estimates use May 2026 published rates ($3/$15 per MTok for Sonnet, $0.80/$4 for Haiku). The token budget system adjusts spend automatically.",
  "Context caching: Anthropic context caching can reduce costs by 60–80% for repeated ICP prompts within a single run. Not currently implemented but planned for V2.",
];

bullets.forEach(b => {
  children.push(new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: b, font: "Arial", size: 18, color: C.slate700 })],
  }));
});

// ── Footer note ────────────────────────────────────────────────────────────
children.push(gap(320));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "Flowfiy AI Token Cost Reference  •  Internal Use Only  •  v2  •  May 2026  •  flowfiy.com", font: "Arial", size: 16, color: C.slate500, italics: true })],
}));

// ══════════════════════════════════════════════════════════════════════════
//  BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════════════════

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20 } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "0F172A" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "4F46E5" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: "334155" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = path.resolve(__dirname, "../Flowfiy_Token_Cost_Analysis.docx");
  fs.writeFileSync(outPath, buf);
  console.log("Written:", outPath);
});
