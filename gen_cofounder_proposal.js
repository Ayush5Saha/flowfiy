const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, Header, Footer, PageNumber, ExternalHyperlink
} = require('docx');
const fs = require('fs');

const BRAND_BLUE = "1a56db";
const BRAND_DARK = "111827";
const LIGHT_BLUE_BG = "EBF2FF";
const LIGHT_GRAY_BG = "F9FAFB";
const BORDER_COLOR = "D1D5DB";
const ACCENT_GOLD = "D97706";

const thinBorder = (color = BORDER_COLOR) => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NIL, size: 0, color: "FFFFFF" });

function sectionHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, color: BRAND_BLUE, size: 28, font: "Arial" })],
    spacing: { before: 400, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BLUE } },
  });
}

function bodyText(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Arial", color: BRAND_DARK, ...options })],
    spacing: { before: 80, after: 80 },
  });
}

function boldBodyText(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: "Arial", color: BRAND_DARK }),
      new TextRun({ text: value, size: 22, font: "Arial", color: BRAND_DARK }),
    ],
    spacing: { before: 80, after: 80 },
  });
}

function bulletItem(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: BRAND_DARK, bold })],
    spacing: { before: 60, after: 60 },
  });
}

function phaseRow(phase, months, goal, cells_bg = "FFFFFF") {
  const cellBorders = {
    top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder(),
  };
  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2200, type: WidthType.DXA },
        borders: cellBorders, margins: cellMargins,
        shading: { fill: cells_bg, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: phase, bold: true, size: 20, font: "Arial", color: BRAND_BLUE })] })],
      }),
      new TableCell({
        width: { size: 2000, type: WidthType.DXA },
        borders: cellBorders, margins: cellMargins,
        shading: { fill: cells_bg, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: months, size: 20, font: "Arial", color: BRAND_DARK })] })],
      }),
      new TableCell({
        width: { size: 5160, type: WidthType.DXA },
        borders: cellBorders, margins: cellMargins,
        shading: { fill: cells_bg, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: goal, size: 20, font: "Arial", color: BRAND_DARK })] })],
      }),
    ],
  });
}

function commercialsRow(item, detail, bg = "FFFFFF") {
  const cellBorders = {
    top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder(),
  };
  const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 3200, type: WidthType.DXA },
        borders: cellBorders, margins: cellMargins,
        shading: { fill: bg, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: item, bold: true, size: 20, font: "Arial", color: BRAND_DARK })] })],
      }),
      new TableCell({
        width: { size: 6160, type: WidthType.DXA },
        borders: cellBorders, margins: cellMargins,
        shading: { fill: bg, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: detail, size: 20, font: "Arial", color: BRAND_DARK })] })],
      }),
    ],
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: "bullet", text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: BRAND_DARK } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1200, right: 1440, bottom: 1200, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "FLOWFIY", bold: true, size: 22, font: "Arial", color: BRAND_BLUE }),
              new TextRun({ text: "  |  Strategic Advisor Proposal — Confidential", size: 20, font: "Arial", color: "6B7280" }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BRAND_BLUE } },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "flowfiy.co  |  ayush@flowfiy.co", size: 18, font: "Arial", color: "9CA3AF" }),
              new TextRun({ text: "    Page ", size: 18, font: "Arial", color: "9CA3AF" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "9CA3AF" }),
            ],
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_COLOR } },
            spacing: { before: 100 },
          }),
        ],
      }),
    },
    children: [

      // ── TITLE BLOCK ──────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: "Strategic Advisor Proposal", bold: true, size: 52, font: "Arial", color: BRAND_DARK })],
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Flowfiy  ×  Rajveer Dafle", size: 28, font: "Arial", color: BRAND_BLUE })],
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Confidential  |  May 2026", size: 20, font: "Arial", color: "9CA3AF" })],
        spacing: { before: 0, after: 400 },
      }),

      // ── THE OPPORTUNITY ───────────────────────────────────────────────
      sectionHeading("The Opportunity"),
      bodyText("Flowfiy is a fully functional, live AI-powered B2B outbound sales platform. The product is built. The architecture is solid. What's missing is the go-to-market muscle to turn it from a working product into a revenue-generating business."),
      new Paragraph({
        children: [new TextRun({ text: "That's exactly where I need you.", bold: true, size: 22, font: "Arial", color: BRAND_DARK })],
        spacing: { before: 80, after: 200 },
      }),

      // ── THE ROLE ─────────────────────────────────────────────────────
      sectionHeading("The Role — Strategic Growth Advisor (Part-Time)"),
      boldBodyText("What this means:  ", "This is a part-time advisory arrangement — a structured trial period where you plug in your SaaS expertise, network, and strategic guidance without a full-time commitment. Think of it as both of us figuring out how we work together before locking in anything long-term. Equity and deeper involvement get discussed at the 3-month mark based on real contribution and mutual fit."),

      new Paragraph({
        children: [new TextRun({ text: "Your Contribution Areas", bold: true, size: 22, font: "Arial", color: BRAND_DARK })],
        spacing: { before: 200, after: 80 },
      }),
      bulletItem("GTM strategy — advise on go-to-market approach, ICP, and positioning"),
      bulletItem("Customer conversations — join key sales calls and prospect meetings when available"),
      bulletItem("Investor network — introductions and warm referrals to relevant angels or funds"),
      bulletItem("Hiring decisions — provide input when we start building the team"),
      bulletItem("Growth playbook — share what has worked (and failed) from your past SaaS builds"),
      bulletItem("Ad-hoc execution — jump in on specific tasks, campaigns, or partnerships as needed"),

      new Paragraph({
        children: [new TextRun({ text: "Ayush's Domain (Full-Time)", bold: true, size: 22, font: "Arial", color: BRAND_DARK })],
        spacing: { before: 200, after: 80 },
      }),
      bulletItem("Full product ownership — features, AI pipeline, infrastructure, reliability"),
      bulletItem("Day-to-day operations and revenue execution"),
      bulletItem("Customer support, onboarding, and retention"),
      bulletItem("API integrations, billing, backend systems"),

      // ── WHAT WE'RE BUILDING ───────────────────────────────────────────
      sectionHeading("What We're Building Together"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2200, 2000, 5160],
        rows: [
          // Header row
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                width: { size: 2200, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Phase", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
              new TableCell({
                width: { size: 2000, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Timeline", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
              new TableCell({
                width: { size: 5160, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Goal", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
            ],
          }),
          phaseRow("Phase 1 — First Revenue", "Month 1–3", "Get to 10 paying customers. Validate ICP and pricing. Build the outbound engine using Flowfiy itself.", LIGHT_BLUE_BG),
          phaseRow("Phase 2 — Growth", "Month 3–6", "₹1L MRR. Launch agency partnerships. Begin content and community flywheel.", "FFFFFF"),
          phaseRow("Phase 3 — Scale", "Month 6–12", "₹5–10L MRR. Fundraise if needed, or stay profitable and grow. Expand team.", LIGHT_BLUE_BG),
        ],
      }),

      // ── COMMERCIALS ───────────────────────────────────────────────────
      sectionHeading("Terms of Engagement"),
      bodyText("This is a trial-first arrangement. No equity changes hands upfront. After 3 months of working together, we reassess — based on real contribution and mutual fit — and decide on equity, deeper involvement, or a different structure altogether."),

      new Paragraph({ children: [], spacing: { before: 120, after: 0 } }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3200, 6160],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                width: { size: 3200, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Term", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
              new TableCell({
                width: { size: 6160, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Details", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
            ],
          }),
          commercialsRow("Equity", "None at this stage — revisited at the 3-month mark", LIGHT_BLUE_BG),
          commercialsRow("Commitment", "Part-time — approx. 10–15 hrs/week, flexible schedule", "FFFFFF"),
          commercialsRow("Compensation", "None for now — this is contribution-first, equity-later", LIGHT_BLUE_BG),
          commercialsRow("Trial Period", "3 months — both sides evaluate fit before any formal agreement", "FFFFFF"),
          commercialsRow("Review Milestone", "After 3 months: equity, co-founder title, and deeper role discussed based on contribution", LIGHT_BLUE_BG),
        ],
      }),

      new Paragraph({ children: [], spacing: { before: 120, after: 0 } }),

      // Advisory note box
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 9360, type: WidthType.DXA },
                borders: { top: thinBorder(ACCENT_GOLD), bottom: thinBorder(ACCENT_GOLD), left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT_GOLD }, right: thinBorder(ACCENT_GOLD) },
                margins: { top: 120, bottom: 120, left: 180, right: 180 },
                shading: { fill: "FFFBEB", type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Why no equity upfront?", bold: true, size: 20, font: "Arial", color: ACCENT_GOLD })],
                    spacing: { before: 0, after: 60 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "Equity is the most valuable thing a founder can give away. Giving it before we've seen how we work together would be premature — for both of us. The 3-month trial lets us build real trust, see actual contribution, and then structure something that makes sense. If the fit is right, a meaningful equity conversation is absolutely on the table.", size: 20, font: "Arial", color: "92400E" })],
                    spacing: { before: 0, after: 0 },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // ── WHAT I'M ASKING ───────────────────────────────────────────────
      sectionHeading("What I'm Asking From You"),
      bulletItem("~10–15 hours per week — consistent engagement, not disappearing for weeks at a time", false),
      bulletItem("Strategic input on GTM, positioning, and first customers — your SaaS playbook is the asset", false),
      bulletItem("Available for key calls — investor meetings, important prospect calls, major decisions", false),
      bulletItem("Clear communication — if you're unavailable for a stretch, just let me know in advance", false),
      bulletItem("A 6-month real run — enough runway to validate whether this works for both of us", false),
      bulletItem("Honest feedback — if you see something broken in the product or strategy, tell me directly", false),

      // ── IMMEDIATE SUPPORT NEEDED ─────────────────────────────────────
      sectionHeading("Immediate Support Needed"),
      bodyText("Outside of the advisory role itself, there are two immediate blockers I need help with to get Flowfiy fully operational and testable right now:"),

      new Paragraph({ children: [], spacing: { before: 100, after: 0 } }),

      // Needs table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Need", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
              new TableCell({
                width: { size: 6560, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: thinBorder(BRAND_BLUE), right: thinBorder(BRAND_BLUE) },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Details", bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })],
              }),
            ],
          }),
          // Row 1 - Seed funds
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: LIGHT_BLUE_BG, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun({ text: "Seed Funds — ₹2,00,000", bold: true, size: 20, font: "Arial", color: BRAND_DARK })] })],
              }),
              new TableCell({
                width: { size: 6560, type: WidthType.DXA },
                borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: LIGHT_BLUE_BG, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Basic operational expenses to keep the platform running and growing — Claude API tokens, infrastructure hosting (Railway + Vercel + Supabase), domain, and initial marketing costs. This is a loan or seed investment, not a gift — to be structured fairly once we agree on terms.", size: 20, font: "Arial", color: BRAND_DARK })] }),
                ],
              }),
            ],
          }),
          // Row 2 - Credit card
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun({ text: "Credit Card Access", bold: true, size: 20, font: "Arial", color: BRAND_DARK })] })],
              }),
              new TableCell({
                width: { size: 6560, type: WidthType.DXA },
                borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
                margins: { top: 100, bottom: 100, left: 140, right: 140 },
                shading: { fill: "FFFFFF", type: ShadingType.CLEAR },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "My current credit card is blocked, which means I cannot load Claude API tokens or pay for cloud infrastructure subscriptions right now. The platform cannot be fully tested or used by customers without this. I need help either with a card I can use for these billing purposes, or guidance on the fastest way to get a new one activated. All charges would be accounted for and reimbursed.", size: 20, font: "Arial", color: BRAND_DARK })] }),
                ],
              }),
            ],
          }),
        ],
      }),

      new Paragraph({ children: [], spacing: { before: 120, after: 0 } }),

      // Urgency note
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 9360, type: WidthType.DXA },
                borders: { top: thinBorder(BRAND_BLUE), bottom: thinBorder(BRAND_BLUE), left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_BLUE }, right: thinBorder(BRAND_BLUE) },
                margins: { top: 120, bottom: 120, left: 180, right: 180 },
                shading: { fill: LIGHT_BLUE_BG, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: "Why this matters right now", bold: true, size: 20, font: "Arial", color: BRAND_BLUE })],
                    spacing: { before: 0, after: 60 },
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: "The product is built and live. The only thing stopping us from onboarding customers and generating real revenue is the ability to run the AI agents — which requires API tokens. Solving the credit card issue unlocks everything else immediately. The ₹2L covers roughly 6 months of operating costs at current burn rate, giving us a clean runway to get to first revenue without any further dependency.", size: 20, font: "Arial", color: "1e429f" })],
                    spacing: { before: 0, after: 0 },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // ── WHY NOW ──────────────────────────────────────────────────────
      sectionHeading("Why Now"),
      bodyText("The market timing is right. India's B2B SaaS ecosystem is growing fast, Western tools are expensive, and there is no dominant AI outbound player built for this market. Flowfiy can own that space — but only if we move in the next 6 months before someone else does."),
      new Paragraph({
        children: [new TextRun({ text: "I built the engine. I need a sharp advisor who can help me steer it — let's see what we can build together in 3 months.", bold: true, size: 22, font: "Arial", color: BRAND_DARK })],
        spacing: { before: 100, after: 300 },
      }),

      // ── CLOSING ──────────────────────────────────────────────────────
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_COLOR } },
        spacing: { before: 200, after: 200 },
        children: [],
      }),
      bodyText("Looking forward to your thoughts, Rajveer. Happy to discuss anything above — the advisory structure, the ₹2L seed, the credit card situation — on our call."),
      new Paragraph({
        children: [new TextRun({ text: "Let's build this.", bold: true, size: 24, font: "Arial", color: BRAND_BLUE })],
        spacing: { before: 160, after: 200 },
      }),
      bodyText("Ayush Saha"),
      new Paragraph({
        children: [new TextRun({ text: "Founder, Flowfiy", size: 22, font: "Arial", color: "6B7280" })],
        spacing: { before: 40, after: 40 },
      }),
      new Paragraph({
        children: [
          new ExternalHyperlink({
            link: "https://www.flowfiy.com",
            children: [new TextRun({ text: "www.flowfiy.com", size: 22, font: "Arial", color: BRAND_BLUE, underline: {} })],
          }),
        ],
        spacing: { before: 40, after: 40 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Flowfiy_Advisor_Proposal_Rajveer_v3.docx", buffer);
  console.log("Created: Flowfiy_Advisor_Proposal_Rajveer_v3.docx");
});
