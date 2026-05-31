const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, HeadingLevel, ExternalHyperlink,
  PageBreak
} = require('docx');
const fs = require('fs');

// ── Colours ──────────────────────────────────────────────────────────────────
const VIOLET      = "7C3AED";
const VIOLET_LIGHT= "EDE9FE";
const VIOLET_MID  = "DDD6FE";
const INDIGO      = "4F46E5";
const DARK_BG     = "1E1B4B";
const EMERALD     = "059669";
const EMERALD_LIGHT = "D1FAE5";
const AMBER_LIGHT = "FEF3C7";
const ZINC_100    = "F4F4F5";
const ZINC_200    = "E4E4E7";
const ZINC_700    = "3F3F46";
const WHITE       = "FFFFFF";
const BLACK       = "09090B";

// ── Border helpers ────────────────────────────────────────────────────────────
const border = (color = "CCCCCC", size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const allBorders = (color, size) => ({ top: border(color, size), bottom: border(color, size), left: border(color, size), right: border(color, size) });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

// ── Spacing helpers ───────────────────────────────────────────────────────────
const sp = (before, after, line) => ({ before, after, ...(line ? { line, lineRule: "auto" } : {}) });

// ── Cell helper ───────────────────────────────────────────────────────────────
function cell(children, { width, fill, textColor, bold, fontSize, align, borders: b, vAlign } = {}) {
  return new TableCell({
    width: { size: width || 4680, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    borders: b || allBorders("DDDDDD", 4),
    verticalAlign: vAlign || VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 160, right: 160 },
    children: Array.isArray(children) ? children : [new Paragraph({
      alignment: align || AlignmentType.LEFT,
      children: [new TextRun({
        text: children,
        color: textColor || BLACK,
        bold: bold || false,
        size: fontSize || 20,
        font: "Arial",
      })],
    })],
  });
}

// ── Header row helper ─────────────────────────────────────────────────────────
function headerRow(cells, colWidths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((text, i) =>
      cell(text, { width: colWidths[i], fill: DARK_BG, textColor: WHITE, bold: true, fontSize: 20 })
    ),
  });
}

// ── Data row helper ───────────────────────────────────────────────────────────
function dataRow(cells, colWidths, fills = []) {
  return new TableRow({
    children: cells.map((text, i) =>
      cell(text, { width: colWidths[i], fill: fills[i] || WHITE, fontSize: 20 })
    ),
  });
}

// ── Section heading ───────────────────────────────────────────────────────────
function sectionHeading(text) {
  return [
    new Paragraph({
      spacing: sp(360, 0),
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: VIOLET, space: 4 } },
      children: [new TextRun({ text, bold: true, size: 30, color: VIOLET, font: "Arial" })],
    }),
    new Paragraph({ spacing: sp(0, 120), children: [new TextRun("")] }),
  ];
}

// ── Sub-heading ───────────────────────────────────────────────────────────────
function subHeading(text) {
  return new Paragraph({
    spacing: sp(240, 80),
    children: [new TextRun({ text, bold: true, size: 24, color: INDIGO, font: "Arial" })],
  });
}

// ── Body paragraph ────────────────────────────────────────────────────────────
function body(text, { bold, color, spacing } = {}) {
  return new Paragraph({
    spacing: sp(spacing?.before || 0, spacing?.after || 120),
    children: [new TextRun({ text, size: 20, font: "Arial", bold: bold || false, color: color || BLACK })],
  });
}

// ── Highlight box ─────────────────────────────────────────────────────────────
function highlightBox(lines, { fill = VIOLET_LIGHT, borderColor = VIOLET } = {}) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          borders: { top: border(borderColor, 12), bottom: border(borderColor, 8), left: border(borderColor, 24), right: border(borderColor, 4) },
          margins: { top: 140, bottom: 140, left: 240, right: 240 },
          children: lines.map(([label, value, isHeader]) =>
            new Paragraph({
              spacing: sp(40, 40),
              children: isHeader
                ? [new TextRun({ text: label, bold: true, size: 22, color: VIOLET, font: "Arial" })]
                : [
                    new TextRun({ text: label + " ", bold: true, size: 20, color: BLACK, font: "Arial" }),
                    new TextRun({ text: value || "", size: 20, color: ZINC_700, font: "Arial" }),
                  ],
            })
          ),
        })],
      }),
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═════════════════════════════════════════════════════════════════════════════

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { color: VIOLET, font: "Arial" } } }],
      },
      {
        reference: "numbered",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Arial" } } }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20, color: BLACK } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: BLACK },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: VIOLET },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
    ],
  },

  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },

    headers: {
      default: new Header({
        children: [
          new Paragraph({
            spacing: sp(0, 80),
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: VIOLET, space: 4 } },
            children: [
              new TextRun({ text: "FLOWFIY", bold: true, size: 22, color: VIOLET, font: "Arial" }),
              new TextRun({ text: "   |   Affiliate & Influencer Program Brief", size: 18, color: ZINC_700, font: "Arial" }),
              new TextRun({ text: "\tCONFIDENTIAL", size: 16, color: "AAAAAA", font: "Arial" }),
            ],
            tabStops: [{ type: "right", position: 9026 }],
          }),
        ],
      }),
    },

    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            spacing: sp(80, 0),
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: ZINC_200, space: 4 } },
            children: [
              new TextRun({ text: "flowfiy.com/affiliates   |   affiliates@flowfiy.com", size: 16, color: "AAAAAA", font: "Arial" }),
              new TextRun({ text: "\tPage ", size: 16, color: "AAAAAA", font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "AAAAAA", font: "Arial" }),
            ],
            tabStops: [{ type: "right", position: 9026 }],
          }),
        ],
      }),
    },

    children: [

      // ── COVER BLOCK ────────────────────────────────────────────────────────
      new Table({
        width: { size: 9766, type: WidthType.DXA },
        columnWidths: [9766],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9766, type: WidthType.DXA },
          shading: { fill: DARK_BG, type: ShadingType.CLEAR },
          borders: noBorders(),
          margins: { top: 400, bottom: 400, left: 480, right: 480 },
          children: [
            new Paragraph({
              spacing: sp(0, 80),
              children: [new TextRun({ text: "FLOWFIY", bold: true, size: 52, color: WHITE, font: "Arial" }),
                         new TextRun({ text: "  ×  AFFILIATE", bold: false, size: 36, color: "A78BFA", font: "Arial" })],
            }),
            new Paragraph({
              spacing: sp(0, 60),
              children: [new TextRun({ text: "Influencer & Creator Program Brief", bold: true, size: 34, color: "C4B5FD", font: "Arial" })],
            }),
            new Paragraph({
              spacing: sp(0, 40),
              children: [new TextRun({ text: "Everything you need to know before sharing Flowfiy with your audience", size: 22, color: "A1A1AA", font: "Arial" })],
            }),
            new Paragraph({
              spacing: sp(20, 0),
              children: [new TextRun({ text: "30% Recurring Commission  •  Monthly UPI Payouts  •  No Minimum Audience", size: 18, color: "7C3AED", bold: true, font: "Arial" })],
            }),
          ],
        })]})],
      }),

      new Paragraph({ spacing: sp(0, 300), children: [new TextRun("")] }),

      // ── SECTION 1 ─────────────────────────────────────────────────────────
      ...sectionHeading("01  What is Flowfiy?"),

      body("Flowfiy is an AI-powered outbound sales system — a complete sales team on autopilot for B2B businesses. Most founders and sales teams waste hours every week on repetitive work: finding leads, researching companies, writing personalised cold emails, following up. Flowfiy automates all of it using 5 specialised Claude AI agents, each handling a distinct stage of the pipeline.", { spacing: { after: 200 } }),

      subHeading("The 5 AI Agents"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          headerRow(["Agent", "What It Does"], [2800, 6560]),
          dataRow(["ICP Analyst", "Analyses your ideal customer profile — who to target, what pain points to lead with"], [2800, 6560], [VIOLET_LIGHT, WHITE]),
          dataRow(["Lead Discovery", "Finds real leads using Apollo.io + web scrapers — names, companies, job titles, websites"], [2800, 6560], [WHITE, WHITE]),
          dataRow(["Company Researcher", "Visits each company's website, reads their content, understands their business"], [2800, 6560], [VIOLET_LIGHT, WHITE]),
          dataRow(["Qualification Scorer", "Scores every lead 0–100 based on fit — so you only chase the ones worth chasing"], [2800, 6560], [WHITE, WHITE]),
          dataRow(["Email Writer", "Writes hyper-personalised cold emails for each lead, grounded in real research"], [2800, 6560], [VIOLET_LIGHT, WHITE]),
        ],
      }),

      new Paragraph({ spacing: sp(160, 0), children: [new TextRun("")] }),

      highlightBox([
        ["The result:", "Set up your ICP once, hit “Generate”, and get a fully researched, scored, and email-ready lead list in minutes — not days."],
      ], { fill: EMERALD_LIGHT, borderColor: EMERALD }),

      new Paragraph({ spacing: sp(0, 280), children: [new TextRun("")] }),

      // ── SECTION 2 ─────────────────────────────────────────────────────────
      ...sectionHeading("02  Who is it for?"),

      body("Flowfiy is built for anyone doing B2B sales who wants to stop doing manual work:"),

      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Founders doing their own outbound without a sales team", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Sales teams who want to 10× their pipeline without hiring SDRs", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Agencies & consultants who pitch clients and need consistent leads", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 160), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Anyone doing B2B sales who currently relies on manual research or referrals only", size: 20, font: "Arial" })] }),

      body("Works particularly well for audiences in: SaaS, marketing, agencies, sales, consulting, or startup growth.", { color: ZINC_700 }),

      new Paragraph({ spacing: sp(0, 280), children: [new TextRun("")] }),

      // ── SECTION 3 ─────────────────────────────────────────────────────────
      ...sectionHeading("03  Pricing"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2000, 2000, 2680, 2680],
        rows: [
          headerRow(["Plan", "Price", "Generations / mo", "Best For"], [2000, 2000, 2680, 2680]),
          dataRow(["Free", "₹0", "100", "Try it out"], [2000, 2000, 2680, 2680], [ZINC_100, ZINC_100, ZINC_100, ZINC_100]),
          dataRow(["Indie", "₹1,700/mo", "2,500", "Solo founders"], [2000, 2000, 2680, 2680], [WHITE, WHITE, WHITE, WHITE]),
          dataRow(["Starter", "₹4,900/mo", "10,000", "Small teams"], [2000, 2000, 2680, 2680], [ZINC_100, ZINC_100, ZINC_100, ZINC_100]),
          dataRow(["Growth", "₹9,900/mo", "30,000", "Scaling teams"], [2000, 2000, 2680, 2680], [WHITE, WHITE, WHITE, WHITE]),
        ],
      }),

      new Paragraph({ spacing: sp(120, 0), children: [new TextRun("")] }),
      body("No contracts. Cancel anytime. India-first pricing — but works for any market.", { color: ZINC_700 }),

      new Paragraph({ spacing: sp(0, 280), children: [new TextRun("")] }),

      // ── SECTION 4 ─────────────────────────────────────────────────────────
      ...sectionHeading("04  The Affiliate Program"),

      // 4a Commission
      subHeading("Commission Structure"),

      highlightBox([
        ["30% recurring commission", "on every payment your referrals make — forever."],
        ["Not a one-time bounty.", "If someone subscribes to the ₹4,900/mo Starter plan and stays 12 months, you earn ₹1,470 every single month for that one referral."],
      ], { fill: VIOLET_LIGHT, borderColor: VIOLET }),

      new Paragraph({ spacing: sp(0, 200), children: [new TextRun("")] }),

      // 4b Earnings
      subHeading("Earnings Calculator"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2720, 3640, 3000],
        rows: [
          headerRow(["Your Referrals", "Plan", "You Earn / Month"], [2720, 3640, 3000]),
          dataRow(["5 customers", "Indie (₹1,700/mo)", "₹2,550"], [2720, 3640, 3000], [WHITE, WHITE, WHITE]),
          dataRow(["10 customers", "Indie (₹1,700/mo)", "₹5,100"], [2720, 3640, 3000], [ZINC_100, ZINC_100, ZINC_100]),
          dataRow(["5 customers", "Starter (₹4,900/mo)", "₹7,350"], [2720, 3640, 3000], [WHITE, WHITE, WHITE]),
          new TableRow({ children: [
            cell("10 customers", { width: 2720, fill: AMBER_LIGHT }),
            cell("Starter (₹4,900/mo)", { width: 3640, fill: AMBER_LIGHT }),
            cell([new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "₹14,700", bold: true, size: 22, color: EMERALD, font: "Arial" })] })], { width: 3000, fill: AMBER_LIGHT }),
          ]}),
          dataRow(["5 customers", "Growth (₹9,900/mo)", "₹14,850"], [2720, 3640, 3000], [WHITE, WHITE, WHITE]),
          new TableRow({ children: [
            cell("10 customers", { width: 2720, fill: AMBER_LIGHT }),
            cell("Growth (₹9,900/mo)", { width: 3640, fill: AMBER_LIGHT }),
            cell([new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: "₹29,700", bold: true, size: 22, color: EMERALD, font: "Arial" })] })], { width: 3000, fill: AMBER_LIGHT }),
          ]}),
        ],
      }),

      new Paragraph({ spacing: sp(100, 0), children: [new TextRun("")] }),
      body("All earnings are monthly and recurring — not one-time payouts.", { color: ZINC_700 }),
      new Paragraph({ spacing: sp(0, 200), children: [new TextRun("")] }),

      // 4c How it works
      subHeading("How It Works"),

      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "Apply at flowfiy.com/affiliates — takes 2 minutes", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "We review within 48 hours and email you once approved", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "You get a unique link — e.g. flowfiy.com?ref=YOURCODE", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "Share it anywhere — YouTube, Instagram bio, newsletter, LinkedIn, stories", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "Someone clicks → we track it (30-day cookie window)", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "They subscribe to any paid plan → commission is recorded automatically", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 180), numbering: { reference: "numbered", level: 0 }, children: [new TextRun({ text: "You get paid monthly via UPI — directly to your UPI ID, no invoicing needed", size: 20, font: "Arial" })] }),

      // 4d Key Terms
      subHeading("Key Terms"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: [
          headerRow(["Term", "Detail"], [3000, 6360]),
          dataRow(["Commission rate", "30% recurring on every payment"], [3000, 6360], [VIOLET_LIGHT, WHITE]),
          dataRow(["Cookie window", "30 days from click"], [3000, 6360], [WHITE, WHITE]),
          dataRow(["Payout method", "UPI (India) — monthly"], [3000, 6360], [VIOLET_LIGHT, WHITE]),
          dataRow(["Minimum payout", "₹500"], [3000, 6360], [WHITE, WHITE]),
          dataRow(["Minimum audience", "None — quality over quantity"], [3000, 6360], [VIOLET_LIGHT, WHITE]),
          dataRow(["Approval", "Manual review within 48 hours"], [3000, 6360], [WHITE, WHITE]),
        ],
      }),

      new Paragraph({ spacing: sp(0, 200), children: [new TextRun("")] }),

      // 4e What you get
      subHeading("What You Get Access To"),

      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Personal affiliate dashboard with real-time stats: clicks, signups, earnings, unpaid balance", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 60), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Your unique referral link", size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: sp(60, 200), numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Monthly UPI payout — no invoicing, no chasing", size: 20, font: "Arial" })] }),

      // ── SECTION 5 ─────────────────────────────────────────────────────────
      ...sectionHeading("05  Why Your Audience Will Convert"),

      body("If your content covers sales, B2B growth, cold email, lead generation, LinkedIn outreach, startup scaling, or founder life — Flowfiy solves an exact, painful problem your audience faces daily.", { spacing: { after: 160 } }),

      body("It is not a “nice to have”. It is a direct replacement for either:"),

      new Paragraph({ spacing: sp(80, 80), numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "Hiring a ₹40,000–80,000/mo SDR", size: 20, font: "Arial", bold: true }),
      ]}),
      new Paragraph({ spacing: sp(80, 160), numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "Spending 10+ hours/week on manual prospecting", size: 20, font: "Arial", bold: true }),
      ]}),

      body("Your audience already knows the pain. You just have to show them the solution.", { color: ZINC_700 }),

      new Paragraph({ spacing: sp(0, 280), children: [new TextRun("")] }),

      // ── SECTION 6 ─────────────────────────────────────────────────────────
      ...sectionHeading("06  Apply Now"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: DARK_BG, type: ShadingType.CLEAR },
          borders: noBorders(),
          margins: { top: 320, bottom: 320, left: 400, right: 400 },
          children: [
            new Paragraph({
              spacing: sp(0, 100),
              children: [new TextRun({ text: "Ready to join?", bold: true, size: 28, color: WHITE, font: "Arial" })],
            }),
            new Paragraph({
              spacing: sp(0, 80),
              children: [
                new TextRun({ text: "Apply: ", bold: true, size: 22, color: "A78BFA", font: "Arial" }),
                new TextRun({ text: "flowfiy.com/affiliates", size: 22, color: WHITE, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: sp(0, 80),
              children: [
                new TextRun({ text: "Questions: ", bold: true, size: 22, color: "A78BFA", font: "Arial" }),
                new TextRun({ text: "affiliates@flowfiy.com", size: 22, color: WHITE, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: sp(0, 0),
              children: [
                new TextRun({ text: "Review time: ", bold: true, size: 22, color: "A78BFA", font: "Arial" }),
                new TextRun({ text: "Within 48 hours of application", size: 22, color: WHITE, font: "Arial" }),
              ],
            }),
          ],
        })]})],
      }),

      new Paragraph({ spacing: sp(240, 0), children: [new TextRun("")] }),

      // Footer note
      new Paragraph({
        spacing: sp(120, 0),
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: ZINC_200, space: 4 } },
        children: [new TextRun({
          text: "This document is for approved or prospective Flowfiy affiliate partners. All commission rates and terms are accurate as of the date of this document and subject to change with notice.",
          size: 16, color: "AAAAAA", font: "Arial", italics: true,
        })],
      }),

    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("E:\\CodeX Developemt\\AI_Sales_outbound_system\\Flowfiy_Affiliate_Influencer_Brief.docx", buf);
  console.log("Created: Flowfiy_Affiliate_Influencer_Brief.docx");
});
