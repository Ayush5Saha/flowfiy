const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, Header, Footer, LevelFormat
} = require("C:/Users/ADMIN/AppData/Roaming/npm/node_modules/docx");

const bd = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bds = { top: bd, bottom: bd, left: bd, right: bd };
const hbd = { style: BorderStyle.SINGLE, size: 1, color: "14213D" };
const hbds = { top: hbd, bottom: hbd, left: hbd, right: hbd };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "14213D" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "E63946" })] });
}
function para(text, opts) {
  return new Paragraph({ spacing: { before: 60, after: 60 },
    children: [new TextRun(Object.assign({ text, size: 22, font: "Arial" }, opts || {}))] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial" })] });
}
function spacer() { return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] }); }
function divider() {
  return new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 2 } }, spacing: { before: 160, after: 160 }, children: [new TextRun("")] });
}

function th(text, w) {
  return new TableCell({ borders: hbds, width: { size: w, type: WidthType.DXA },
    shading: { fill: "14213D", type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })] });
}
function td(text, w, shade, bold, center) {
  return new TableCell({ borders: bds, width: { size: w, type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, size: 20, font: "Arial", bold: bold || false })] })] });
}
function tdRed(text, w) {
  return new TableCell({ borders: bds, width: { size: w, type: WidthType.DXA },
    shading: { fill: "FFF0F0", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", color: "C0392B" })] })] });
}
function tdGreen(text, w) {
  return new TableCell({ borders: bds, width: { size: w, type: WidthType.DXA },
    shading: { fill: "F0FFF4", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", color: "1A7A3A", bold: true })] })] });
}

// Highlight box
function highlightBox(title, body) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [
      new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "E63946" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "E63946" }, left: { style: BorderStyle.SINGLE, size: 8, color: "E63946" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }, shading: { fill: "FFF8F8", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 240, right: 240 }, width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: title, bold: true, size: 24, font: "Arial", color: "E63946" })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: body, size: 22, font: "Arial", color: "333333" })] }),
        ] })] })
    ]
  });
}

function blueBox(title, body) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [
      new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "14213D" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "14213D" }, left: { style: BorderStyle.SINGLE, size: 8, color: "14213D" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }, shading: { fill: "F0F4FF", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 240, right: 240 }, width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ spacing: { before: 0, after: 80 }, children: [new TextRun({ text: title, bold: true, size: 24, font: "Arial", color: "14213D" })] }),
          new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: body, size: 22, font: "Arial", color: "333333" })] }),
        ] })] })
    ]
  });
}

// Key metrics summary table (2x4 grid)
const metricsTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [2340,2340,2340,2340],
  rows: [
    new TableRow({ children: [
      new TableCell({ borders: bds, width: { size: 2340, type: WidthType.DXA }, shading: { fill: "14213D", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 160, right: 160 }, children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Funding Ask", bold: true, size: 20, font: "Arial", color: "AAAAAA" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "$300K", bold: true, size: 40, font: "Arial", color: "FFFFFF" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pre-Seed Round", size: 18, font: "Arial", color: "CCCCCC" })] }) ] }),
      new TableCell({ borders: bds, width: { size: 2340, type: WidthType.DXA }, shading: { fill: "1A3A5C", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 160, right: 160 }, children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pre-Money Valuation", bold: true, size: 20, font: "Arial", color: "AAAAAA" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "$3M", bold: true, size: 40, font: "Arial", color: "FFFFFF" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "10% equity", size: 18, font: "Arial", color: "CCCCCC" })] }) ] }),
      new TableCell({ borders: bds, width: { size: 2340, type: WidthType.DXA }, shading: { fill: "14213D", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 160, right: 160 }, children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Gross Margin", bold: true, size: 20, font: "Arial", color: "AAAAAA" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~95%", bold: true, size: 40, font: "Arial", color: "4ADE80" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BYOK model", size: 18, font: "Arial", color: "CCCCCC" })] }) ] }),
      new TableCell({ borders: bds, width: { size: 2340, type: WidthType.DXA }, shading: { fill: "1A3A5C", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 160, right: 160 }, children: [ new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "12-Mo ARR Target", bold: true, size: 20, font: "Arial", color: "AAAAAA" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "$400K", bold: true, size: 40, font: "Arial", color: "FFFFFF" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "450+ paid users", size: 18, font: "Arial", color: "CCCCCC" })] }) ] }),
    ]}),
  ]
});

// Market sizing table
const marketTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [2000, 2200, 2000, 3160],
  rows: [
    new TableRow({ children: [th("Market",2000),th("Size (2024)",2200),th("CAGR",2000),th("Methodology",3160)] }),
    new TableRow({ children: [td("TAM",2000,"F0F4F8",true),td("$4.8B",2200,"F0F4F8",true),td("15%",2000,"F0F4F8"),td("Global sales automation software market",3160,"F0F4F8")] }),
    new TableRow({ children: [td("SAM",2000),td("$1.2B",2200,null,true),td("18%",2000),td("AI-powered outbound prospecting tools",3160)] }),
    new TableRow({ children: [td("SOM (Yr 1)",2000,"F0F4F8"),td("$400K ARR",2200,"F0F4F8",true),td("--",2000,"F0F4F8"),td("450 paid users x $75 ARPU x 12 months",3160,"F0F4F8")] }),
    new TableRow({ children: [td("SOM (Yr 3)",2000),td("$8M ARR",2200,null,true),td("--",2000),td("Expand to 6,500 users, agency + white-label tier",3160)] }),
  ]
});

// Valuation comp table
const compValTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 1500, 1500, 1500, 2660],
  rows: [
    new TableRow({ children: [th("Company",2200),th("Stage",1500),th("Valuation",1500),th("Revenue",1500),th("Multiple / Notes",2660)] }),
    new TableRow({ children: [td("Clay",2200,"F0F4F8"),td("Series B",1500,"F0F4F8"),td("$1.5B",1500,"F0F4F8"),td("~$50M ARR",1500,"F0F4F8"),td("30x ARR -- AI enrichment leader",2660,"F0F4F8")] }),
    new TableRow({ children: [td("Apollo.io",2200),td("Series D",1500),td("$1.6B",1500),td("~$100M ARR",1500),td("16x ARR -- broad GTM platform",2660)] }),
    new TableRow({ children: [td("Instantly",2200,"F0F4F8"),td("Bootstrapped",1500,"F0F4F8"),td("~$100M est.",1500,"F0F4F8"),td("~$10M ARR",1500,"F0F4F8"),td("10x ARR -- email sequences only",2660,"F0F4F8")] }),
    new TableRow({ children: [td("Smartlead",2200),td("Bootstrapped",1500),td("~$50M est.",1500),td("~$5M ARR",1500),td("10x ARR -- email-first platform",2660)] }),
    new TableRow({ children: [tdGreen("Flowfiy (ask)",2200),tdGreen("Pre-Seed",1500),tdGreen("$3M pre-money",1500),tdGreen("$0 (pre-revenue)",1500),tdGreen("Early entry with 95% GM + BYOK moat",2660)] }),
  ]
});

// Use of funds table
const fundsTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [3600, 1800, 1800, 2160],
  rows: [
    new TableRow({ children: [th("Use of Funds",3600),th("Amount",1800),th("% of Raise",1800),th("Expected Outcome",2160)] }),
    new TableRow({ children: [td("Full-Stack Engineer (6-month contract)",3600,"F0F4F8"),td("$12,000",1800,"F0F4F8"),td("40%",1800,"F0F4F8"),td("V2: LinkedIn + WhatsApp channels",2160,"F0F4F8")] }),
    new TableRow({ children: [td("Infrastructure & DevOps (12 months)",3600),td("$6,000",1800),td("20%",1800),td("Scale to 1,000+ concurrent users",2160)] }),
    new TableRow({ children: [td("Marketing & Content Production",3600,"F0F4F8"),td("$9,000",1800,"F0F4F8"),td("30%",1800,"F0F4F8"),td("YouTube channel, paid ads, SEO sprints",2160,"F0F4F8")] }),
    new TableRow({ children: [td("Legal, Compliance & IP Protection",3600),td("$1,500",1800),td("5%",1800),td("Terms of service, privacy policy, trademark",2160)] }),
    new TableRow({ children: [td("Contingency & Operations",3600,"F0F4F8"),td("$1,500",1800,"F0F4F8"),td("5%",1800,"F0F4F8"),td("Buffer for unexpected costs",2160,"F0F4F8")] }),
    new TableRow({ children: [td("TOTAL",3600,null,true),td("$30,000",1800,null,true),td("100%",1800,null,true),td("18-month runway to $400K ARR",2160,null,true)] }),
  ]
});

// Unit economics table
const unitEconTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 2120, 2120, 2120],
  rows: [
    new TableRow({ children: [th("Metric",3000),th("Starter ($49)",2120),th("Growth ($99)",2120),th("Agency ($249)",2120)] }),
    new TableRow({ children: [td("Monthly Revenue",3000,"F0F4F8"),td("$49",2120,"F0F4F8"),td("$99",2120,"F0F4F8"),td("$249",2120,"F0F4F8")] }),
    new TableRow({ children: [td("Infra Cost per User/Mo",3000),td("~$0.50",2120),td("~$1.00",2120),td("~$3.00",2120)] }),
    new TableRow({ children: [td("Claude API Cost (BYOK)",3000,"F0F4F8"),td("$0.00",2120,"F0F4F8"),td("$0.00",2120,"F0F4F8"),td("$0.00",2120,"F0F4F8")] }),
    new TableRow({ children: [td("Gross Margin",3000),td("~99%",2120,null,true),td("~99%",2120,null,true),td("~98.8%",2120,null,true)] }),
    new TableRow({ children: [td("CAC (blended)",3000,"F0F4F8"),td("$60",2120,"F0F4F8"),td("$80",2120,"F0F4F8"),td("$120",2120,"F0F4F8")] }),
    new TableRow({ children: [td("LTV (24-month, 3% churn)",3000),td("$1,633",2120,null,true),td("$3,300",2120,null,true),td("$8,300",2120,null,true)] }),
    new TableRow({ children: [td("LTV:CAC",3000,"F0F4F8"),td("27:1",2120,"F0F4F8",true),td("41:1",2120,"F0F4F8",true),td("69:1",2120,"F0F4F8",true)] }),
    new TableRow({ children: [td("Payback Period",3000),td("~1.2 months",2120,null,true),td("~0.8 months",2120,null,true),td("~0.5 months",2120,null,true)] }),
  ]
});

// Risk table
const riskTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [2600, 1200, 1200, 4360],
  rows: [
    new TableRow({ children: [th("Risk",2600),th("Probability",1200),th("Impact",1200),th("Mitigation",4360)] }),
    new TableRow({ children: [td("Anthropic API price increases",2600,"FFF8F8"),td("Medium",1200,"FFF8F8"),td("Low",1200,"FFF8F8"),td("BYOK means cost is user-borne; add OpenAI/Gemini fallback in V2",4360,"FFF8F8")] }),
    new TableRow({ children: [td("Clay launches BYOK feature",2600),td("Medium",1200),td("Medium",1200),td("Compete on price ($49 vs $149+), ease of use, and India/APAC market positioning",4360)] }),
    new TableRow({ children: [td("Low free-to-paid conversion",2600,"FFF8F8"),td("Medium",1200,"FFF8F8"),td("High",1200,"FFF8F8"),td("Usage-triggered upgrade prompts, email nurture, time-limited free boost offers",4360,"FFF8F8")] }),
    new TableRow({ children: [td("Gmail/Apollo API deprecations",2600),td("Low",1200),td("High",1200),td("Modular integration layer -- swap providers without rebuilding core pipeline",4360)] }),
    new TableRow({ children: [td("Founder single point of failure",2600,"FFF8F8"),td("Low",1200,"FFF8F8"),td("High",1200,"FFF8F8"),td("Use $120K engineer budget to distribute critical engineering knowledge",4360,"FFF8F8")] }),
  ]
});

const doc = new Document({
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "14213D" }, paragraph: { spacing: { before: 400, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "E63946" }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E63946", space: 4 } }, children: [new TextRun({ text: "CONFIDENTIAL -- Flowfiy Pre-Seed Due Diligence & Valuation Report", size: 18, font: "Arial", color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18, font: "Arial", color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "999999" }), new TextRun({ text: " | Flowfiy -- Due Diligence & Valuation Report -- May 2026", size: 18, font: "Arial", color: "999999" })] })] }) },
    children: [
      // COVER
      spacer(), spacer(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 60 }, children: [new TextRun({ text: "FLOWFIY", bold: true, size: 72, font: "Arial", color: "14213D" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Due Diligence & Investor Valuation Report", bold: true, size: 36, font: "Arial", color: "E63946" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Pre-Seed Funding Round -- May 2026", size: 26, font: "Arial", color: "555555" })] }),
      spacer(),
      metricsTable,
      spacer(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Prepared by: Ayush Saha, Founder & CEO  |  ayush@flowfiy.com  |  flowfiy.com", size: 20, font: "Arial", color: "777777" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 480 }, children: [new TextRun({ text: "STRICTLY CONFIDENTIAL -- For Authorized Investors Only", bold: true, size: 20, font: "Arial", color: "E63946" })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // SECTION 1: INVESTMENT THESIS
      h1("1. Investment Thesis"),
      blueBox("Why Flowfiy Will Win", "The $4.8B outbound sales automation market is dominated by tools that charge a premium to absorb API costs. Flowfiy inverts this model: users bring their own Claude API key (BYOK), giving Flowfiy ~95% gross margins from day one -- while delivering Clay-level AI intelligence at Apollo-level pricing. This structural cost advantage creates a near-unassailable moat."),
      spacer(),
      h2("Core Investment Reasons"),
      bullet("Near-zero COGS: BYOK model eliminates Claude API cost exposure. ~$0.002 infra cost per full lead generation pipeline."),
      bullet("Defensible moat: 5 specialized AI agents working in concert (ICP -> Lead Discovery -> Company Analysis -> Qualification -> Personalization) cannot be replicated by a single-prompt competitor."),
      bullet("Global market, local advantage: Competing globally but launching from India enables 5-10x cost efficiency vs. US-based competitors building similar products."),
      bullet("Proven demand signals: Clay's $1.5B valuation and 50,000+ users proves the market. Flowfiy enters at 3-10x lower price point with better AI and higher margins."),
      bullet("Bootstrappable to $25K MRR: 15 Starter subscribers break even on infra. $300K pre-seed is acceleration capital, not survival capital."),
      spacer(),
      divider(),

      // SECTION 2: COMPANY OVERVIEW
      h1("2. Company Overview"),
      bullet("Company Name: Flowfiy"),
      bullet("Product: 5-agent Claude AI pipeline for B2B outbound sales automation"),
      bullet("Business Model: Multi-tenant SaaS, BYOK Claude API, Seat + Generation pricing"),
      bullet("Stage: Pre-seed, product built, zero paid users"),
      bullet("Founded: 2025 by Ayush Saha, Pune, India"),
      bullet("Target Market: Global -- agencies, SaaS startups, outbound sales teams"),
      bullet("V1 Channel: Gmail outreach (LinkedIn + WhatsApp in V2 roadmap)"),
      bullet("Tech Stack: Next.js 14, Supabase (PostgreSQL + RLS), BullMQ, Stripe, Railway/Vercel"),
      spacer(),
      h2("5-Agent Pipeline Architecture"),
      bullet("Agent 1 -- ICP Analyzer: Identifies and refines Ideal Customer Profile from business inputs"),
      bullet("Agent 2 -- Lead Discovery: Queries Apollo.io API for matching leads at scale"),
      bullet("Agent 3 -- Company Analyzer: Apify web scraping for deep company research per lead"),
      bullet("Agent 4 -- Qualification Agent: Scores and ranks leads against ICP criteria (Claude Haiku)"),
      bullet("Agent 5 -- Personalization Agent: Generates hyper-personalized email copy (Claude Sonnet)"),
      spacer(),
      divider(),

      // SECTION 3: MARKET OPPORTUNITY
      h1("3. Market Opportunity & Sizing"),
      marketTable,
      spacer(),
      h2("Market Validation"),
      bullet("Clay: $1.5B valuation, $50M ARR. Proves the AI enrichment market at $149-720/mo price point."),
      bullet("Apollo.io: $1.6B valuation, $100M ARR. Proves the outbound data market at $49-119/mo."),
      bullet("Instantly: $100M estimated valuation. Proves the cold email automation market at $37-97/mo."),
      bullet("Flowfiy addressable gap: AI-native + BYOK + affordable pricing for the 95% who won't pay $149+/mo for Clay."),
      spacer(),
      divider(),

      // SECTION 4: COMPETITIVE ANALYSIS
      h1("4. Competitive Analysis"),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [2000,1840,1840,1840,1840],
        rows: [
          new TableRow({ children: [th("Feature",2000),th("Flowfiy",1840),th("Clay",1840),th("Apollo",1840),th("Instantly",1840)] }),
          new TableRow({ children: [td("AI Pipeline",2000,"F0F4F8"),td("5-Agent Claude",1840,"E8F5E9",true),td("GPT-4 enrichment",1840),td("Basic scoring",1840),td("None",1840)] }),
          new TableRow({ children: [td("BYOK",2000,"F0F4F8"),td("Yes",1840,"E8F5E9",true),td("No",1840),td("No",1840),td("No",1840)] }),
          new TableRow({ children: [td("Price (entry)",2000,"F0F4F8"),td("$49/mo",1840,"E8F5E9",true),td("$149/mo",1840),td("$49/mo",1840),td("$37/mo",1840)] }),
          new TableRow({ children: [td("Gross Margin",2000,"F0F4F8"),td("~95%",1840,"E8F5E9",true),td("~55%",1840),td("~70%",1840),td("~65%",1840)] }),
          new TableRow({ children: [td("ICP + Research",2000,"F0F4F8"),td("Full pipeline",1840,"E8F5E9",true),td("Partial",1840),td("No",1840),td("No",1840)] }),
        ]
      }),
      spacer(),
      divider(),

      // SECTION 5: FINANCIAL PROJECTIONS
      h1("5. Financial Projections"),
      h2("Revenue Ramp (12 Months Post-Launch)"),
      bullet("Month 3: $2,216 MRR (35 paid users)"),
      bullet("Month 6: $7,361 MRR (105 paid users)"),
      bullet("Month 9: $17,472 MRR (243 paid users)"),
      bullet("Month 12: $33,244 MRR (449 paid users)  --  $398K ARR run-rate"),
      spacer(),
      h2("Key Assumptions"),
      bullet("Monthly churn: 3% (industry average for SMB SaaS: 3-5%)"),
      bullet("Free-to-paid conversion: 40% within 90 days of sign-up"),
      bullet("Blended ARPU: $75/month (Starter 60%, Growth 30%, Agency 10%)"),
      bullet("CAC: $60 organic (Months 1-4), $80 blended (Months 5-12)"),
      bullet("Growth rate: 30-40% MoM Months 1-6; 18-25% MoM Months 7-12"),
      spacer(),
      h2("Path to $1M ARR"),
      bullet("$1M ARR requires ~1,111 paid subscribers at $75 ARPU -- achievable by Month 18-20"),
      bullet("At $1M ARR with 95% gross margin: $950K gross profit annually"),
      bullet("Comparable: Instantly reached ~$10M ARR bootstrapped; Flowfiy has better margins"),
      spacer(),
      divider(),

      // SECTION 6: UNIT ECONOMICS
      h1("6. Unit Economics"),
      unitEconTable,
      spacer(),
      highlightBox("The BYOK Margin Advantage", "Traditional SaaS tools absorb LLM API costs and pass them on as subscription fees, limiting gross margins to 50-70%. Flowfiy's BYOK model means every dollar of Claude API cost is borne by the user -- delivering ~95% gross margin from day one. This is not a feature, it is a structural economic moat."),
      spacer(),
      divider(),

      // SECTION 7: VALUATION METHODOLOGY
      h1("7. Valuation Methodology & Funding Ask"),
      new Paragraph({ children: [new PageBreak()] }),
      h2("Pre-Seed Comparable Valuation"),
      compValTable,
      spacer(),
      h2("Flowfiy Valuation Justification"),
      bullet("Comparable pre-seed SaaS B2B valuations in India: $1.5M-$5M pre-money for product-live stage"),
      bullet("BYOK model creates near-100% gross margin -- rare at any stage, exceptional at pre-seed"),
      bullet("Clay's $1.5B at $50M ARR (30x) = early entry point in same category is highly justified"),
      bullet("$3M pre-money = 0.06x of Clay's current valuation, with same market, better economics"),
      bullet("Modest pre-money ($3M vs $5M+ for comparable US startups) reflects India-based discount"),
      spacer(),
      highlightBox("$300K Pre-Seed Funding Ask", "Seeking $300K at $3M pre-money valuation (10% equity). This is not survival capital -- Flowfiy breaks even on infrastructure at 15 Starter subscribers. This is acceleration capital to hire one engineer, fund marketing, and reach $400K ARR in 12 months."),
      spacer(),
      h2("Use of Funds Breakdown"),
      fundsTable,
      spacer(),
      divider(),

      // SECTION 8: DEAL TERMS
      h1("8. Proposed Deal Terms"),
      bullet("Instrument: SAFE (Simple Agreement for Future Equity) -- standard YC post-money SAFE"),
      bullet("Pre-money valuation cap: $3,000,000"),
      bullet("Discount: 20% on next priced round"),
      bullet("Pro-rata rights: Yes, up to initial investment amount"),
      bullet("Information rights: Quarterly financials, monthly MRR updates"),
      bullet("Minimum check size: $25,000"),
      bullet("Target close date: Within 45 days of term sheet"),
      bullet("Board seat: Observer rights only at pre-seed stage"),
      spacer(),
      divider(),

      // SECTION 9: FOUNDER BACKGROUND
      h1("9. Founder Background"),
      h2("Ayush Saha -- Founder & CEO"),
      bullet("Location: Pune, Maharashtra, India"),
      bullet("Builder: Designed and built entire Flowfiy platform solo (Next.js, Supabase, BullMQ, Stripe, multi-tenant architecture)"),
      bullet("Technical depth: Full-stack engineering -- React, TypeScript, PostgreSQL, Node.js, AI/LLM orchestration"),
      bullet("Domain expertise: Deep understanding of outbound sales automation, GTM tooling, and B2B SaaS economics"),
      bullet("Execution proof: Shipped production-grade multi-tenant SaaS with RLS, queue workers, billing, and 5-agent AI pipeline independently"),
      spacer(),
      blueBox("Founder Signal", "Building a product of this technical complexity solo -- multi-tenant architecture, encrypted secret storage, AI orchestration with queue workers, Stripe billing -- is strong evidence of both technical ability and execution velocity. The founder is the technical moat."),
      spacer(),
      divider(),

      // SECTION 10: RISKS
      h1("10. Risk Assessment"),
      riskTable,
      spacer(),
      divider(),

      // SECTION 11: MILESTONES
      h1("11. Milestones with Funding"),
      h2("30 Days Post-Close"),
      bullet("Public beta launch (Product Hunt + LinkedIn + HN)"),
      bullet("First 10 paying customers"),
      bullet("Affiliate program live"),
      spacer(),
      h2("90 Days Post-Close"),
      bullet("$2,200+ MRR (35+ paid subscribers)"),
      bullet("YouTube channel: 10+ videos published"),
      bullet("Engineer contract signed, V2 LinkedIn integration scoped"),
      spacer(),
      h2("180 Days Post-Close"),
      bullet("$7,500+ MRR (100+ paid subscribers)"),
      bullet("V2 LinkedIn outreach in beta"),
      bullet("Agency white-label program launched"),
      spacer(),
      h2("12 Months Post-Close"),
      bullet("$33,000+ MRR ($400K ARR run-rate)"),
      bullet("450+ paid subscribers"),
      bullet("Seed round preparation: target $1.5M at $10M valuation"),
      spacer(),
      divider(),

      // CLOSING PAGE
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 120 }, children: [new TextRun({ text: "The Opportunity", bold: true, size: 40, font: "Arial", color: "14213D" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Clay is a $1.5B company. Apollo is a $1.6B company.", bold: true, size: 28, font: "Arial", color: "333333" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Both charge users for the AI compute they consume.", size: 26, font: "Arial", color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Flowfiy doesn't. That's the entire thesis.", bold: true, size: 28, font: "Arial", color: "E63946" })] }),
      spacer(), spacer(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new TextRun({ text: "Ayush Saha -- Founder & CEO, Flowfiy", bold: true, size: 24, font: "Arial", color: "14213D" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "ayush@flowfiy.com  |  flowfiy.com  |  linkedin.com/in/ayushsaha", size: 22, font: "Arial", color: "555555" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Flowfiy_Due_Diligence_Valuation_Report.docx", buffer);
  console.log("SUCCESS: Flowfiy_Due_Diligence_Valuation_Report.docx created (" + buffer.length + " bytes)");
}).catch(err => { console.error("ERROR:", err.message); process.exit(1); });
