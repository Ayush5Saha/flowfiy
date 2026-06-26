// Generates "Flowfiy — Use of Funds & Runway" .docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, Header, Footer, PageNumber, LevelFormat,
} = require("docx");

// ---- palette ----
const NAVY = "0B2545";      // headings
const BLUE = "1B5FA8";      // accent
const LIGHTBLUE = "DCE8F5"; // table header fill
const ZEBRA = "F2F6FB";     // alt rows
const GREY = "5A6473";      // muted text
const RULE = "C9D4E2";      // borders / cell borders

const CONTENT_W = 9026; // A4, 1" margins

// ---- helpers ----
const border = { style: BorderStyle.SINGLE, size: 1, color: RULE };
const cellBorders = { top: border, bottom: border, left: border, right: border };

function t(text, opts = {}) { return new TextRun({ text, font: "Arial", ...opts }); }

function cell(children, { w, fill, align = AlignmentType.LEFT, bold = false, color, size } = {}) {
  const paras = (Array.isArray(children) ? children : [children]).map((c) =>
    typeof c === "string"
      ? new Paragraph({ alignment: align, children: [t(c, { bold, color, size })] })
      : c
  );
  return new TableCell({
    borders: cellBorders,
    width: { size: w, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 70, bottom: 70, left: 130, right: 130 },
    verticalAlign: VerticalAlign.CENTER,
    children: paras,
  });
}

function headerRow(labels, widths) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) =>
      cell(l, { w: widths[i], fill: LIGHTBLUE, bold: true, color: NAVY, align: i === 0 ? AlignmentType.LEFT : AlignmentType.LEFT })
    ),
  });
}

function dataRow(cells, widths, { aligns = [], zebra = false, bold = [] } = {}) {
  return new TableRow({
    children: cells.map((c, i) =>
      cell(c, {
        w: widths[i],
        fill: zebra ? ZEBRA : undefined,
        align: aligns[i] || AlignmentType.LEFT,
        bold: bold[i] || false,
      })
    ),
  });
}

function makeTable(widths, header, rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow(header, widths), ...rows],
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(text)] });
}
function body(runs, opts = {}) {
  return new Paragraph({ spacing: { after: 120, line: 276 }, ...opts,
    children: Array.isArray(runs) ? runs : [t(runs)] });
}
function spacer(h = 80) { return new Paragraph({ spacing: { after: h }, children: [t("")] }); }
function bullet(runs) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
    children: Array.isArray(runs) ? runs : [t(runs)] });
}

// ---- build content ----
const children = [];

// Title block
children.push(new Paragraph({
  spacing: { after: 40 },
  children: [t("Flowfiy", { bold: true, size: 52, color: NAVY })],
}));
children.push(new Paragraph({
  spacing: { after: 40 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 6 } },
  children: [t("Use of Funds & Runway", { size: 30, color: BLUE, bold: true })],
}));
children.push(new Paragraph({
  spacing: { after: 240 },
  children: [
    t("Pre-Seed Ask: ", { size: 22, color: GREY }),
    t("₹50,00,000", { size: 22, bold: true, color: NAVY }),
    t("   •   ~16-month runway floor   •   Made in Pune", { size: 22, color: GREY }),
  ],
}));

// Headline summary
children.push(h2("The short answer"));
children.push(body([
  t("The "),
  t("₹50 lakh buys a ~16-month runway floor", { bold: true }),
  t(", deliberately weighted toward customer acquisition. Swanth (CTO) owns engineering in-house, so the raise funds "),
  t("no separate engineering salary", { bold: true }),
  t(" — instead it builds a focused "),
  t("three-person growth team — a Content Head, an SDR, and a Meta Ads Specialist", { bold: true }),
  t(" — around the two founders, plus the media budget to put that team to work. Because Flowfiy is already live, charging customers, and running at ~60% net margin, every new subscription extends this runway — so 16 months is the floor, not the ceiling."),
]));
children.push(body([
  t("Hires are phased, not all on day one. ", { bold: true, color: BLUE }),
  t("The SDR and Content Head start in month 1; the Meta Ads Specialist begins as a freelancer running small test budgets and only converts to full-time in month 4, once a paid channel proves a CAC below our payback target. We spend on proof before we spend on scale."),
]));

// Allocation at a glance
children.push(h2("Allocation at a glance"));
{
  const widths = [3400, 1700, 1100, 2826];
  const rows = [
    dataRow(["Team — 2 founders + 3 GTM hires", "₹26L", "52%", "Growth-weighted team, modest founder pay"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.LEFT] }),
    dataRow(["Paid acquisition & ad spend", "₹14L", "28%", "Meta / Google media + creative"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.LEFT] }),
    dataRow(["AI, data & infrastructure", "₹6L", "12%", "COGS + platform reliability"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.LEFT] }),
    dataRow(["Compliance, tools & buffer", "₹4L", "8%", "Legal, SaaS, contingency"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.LEFT] }),
    new TableRow({ children: [
      cell("Total", { w: widths[0], fill: NAVY, bold: true, color: "FFFFFF" }),
      cell("₹50L", { w: widths[1], fill: NAVY, bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
      cell("100%", { w: widths[2], fill: NAVY, bold: true, color: "FFFFFF", align: AlignmentType.CENTER }),
      cell("~16 months", { w: widths[3], fill: NAVY, bold: true, color: "FFFFFF" }),
    ]}),
  ];
  children.push(makeTable(widths, ["Bucket", "Amount", "Share", "Purpose"], rows));
}
children.push(spacer(160));

// ---------- Bucket 1 ----------
children.push(h1("Bucket 1 — Team · ₹26L (52%)"));
{
  const widths = [3200, 1900, 1900, 2026];
  const rows = [
    dataRow(["Founders (2 × ₹30K)", "₹60K/mo", "Mo 1–16", "₹9.6L"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.RIGHT] }),
    dataRow(["Content Head (script · shoot · edit · post)", "₹45K/mo", "Mo 1–16", "₹7.2L"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.RIGHT] }),
    dataRow(["SDR (base + commission)", "₹30K/mo", "Mo 1–16", "₹4.8L"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.RIGHT] }),
    dataRow(["Meta Ads Specialist (freelance → full-time)", "₹35K/mo", "Mo 4–16", "₹4.4L"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.CENTER, AlignmentType.RIGHT] }),
    new TableRow({ children: [
      cell("Subtotal", { w: widths[0], fill: LIGHTBLUE, bold: true, color: NAVY }),
      cell("", { w: widths[1], fill: LIGHTBLUE }),
      cell("", { w: widths[2], fill: LIGHTBLUE }),
      cell("≈ ₹26L", { w: widths[3], fill: LIGHTBLUE, bold: true, color: NAVY, align: AlignmentType.RIGHT }),
    ]}),
  ];
  children.push(makeTable(widths, ["Role", "Salary", "Period", "Total"], rows));
}
children.push(body([ t("Who does what. ", { bold: true }),
  t("Swanth (CTO) leads product and engineering — so the round funds no engineering salary. Ayush (CEO) owns sales, marketing and customer acquisition, and is the closer on every demo. The three hires multiply that GTM motion: the Content Head runs the founder-led content engine (scripts, shoots with Ayush, edits and posts across social), the SDR keeps Ayush's demo calendar full, and the Meta Ads Specialist runs paid.") ]));
children.push(body([ t("Why these roles are phased. ", { bold: true }),
  t("SDR and Content Head start in month 1 — both produce pipeline and brand immediately at low cost. The Meta Ads Specialist runs as a paid freelancer for months 1–3 (funded from the ad-creative line) and only joins full-time in month 4, once a paid channel shows a CAC inside our payback target. The most expensive, most uncertain lever stays on a leash until it is proven.") ]));
children.push(body([ t("Why an investor likes it. ", { bold: true }),
  t("Founders at ₹30K each is well below market — a pure commitment signal. Engineering is covered by the CTO at no salary cost, so nearly half the raise (48%) goes to acquisition and infrastructure rather than headcount, and every hire is a growth role, not overhead.") ]));
children.push(spacer(120));

// ---------- Bucket 2 ----------
children.push(h1("Bucket 2 — Paid Acquisition & Ad Spend · ₹14L (28%)"));
children.push(body([ t("The growth engine. ", { bold: true, color: BLUE }),
  t("This is the media budget itself — distinct from the Meta Ads Specialist's salary in Bucket 1. A specialist with no spend behind them is toothless, so the ad money is budgeted as its own line.") ]));
{
  const widths = [3000, 1700, 4326];
  const rows = [
    dataRow(["Meta / Google ad spend", "₹10L", "Test budgets in Mo 1–3, scaled spend once CAC is proven"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Ad creative & freelance specialist", "₹2.5L", "Mo 1–3 freelance Meta management + video, design, landing pages"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Affiliate / referral seed", "₹1.5L", "Tracking platform + early commissions to referrers"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    new TableRow({ children: [
      cell("Subtotal", { w: widths[0], fill: LIGHTBLUE, bold: true, color: NAVY }),
      cell("₹14L", { w: widths[1], fill: LIGHTBLUE, bold: true, color: NAVY, align: AlignmentType.RIGHT }),
      cell("", { w: widths[2], fill: LIGHTBLUE }),
    ]}),
  ];
  children.push(makeTable(widths, ["Line item", "Total", "Covers"], rows));
}
children.push(body([ t("Paid + organic compound each other. ", { bold: true }),
  t("The Content Head's founder-led videos double as paid ad creative, so the same content engine feeds both channels — organic reach and lower-cost, higher-converting paid. This is why the content and ads hires are deliberately paired.") ]));
children.push(body([ t("Channel fit. ", { bold: true }),
  t("Meta / Instagram is the lead channel for SMB and local-business buyers (the segment Flowfiy already wins). If demand testing shows the buyer skews mid-market B2B, this same budget shifts to LinkedIn — the spend is channel-agnostic; only the targeting changes.") ]));
children.push(body([ t("Why an investor likes it. ", { bold: true }),
  t("Every rupee here is measurable on CAC and LTV, and it is fuel on a fire that already works — the self-serve flywheel converts at zero spend today, and a small affiliate seed turns happy users into a compounding referral base.") ]));
children.push(spacer(120));

// ---------- Bucket 3 ----------
children.push(h1("Bucket 3 — AI, Data & Infrastructure · ₹6L (12%)"));
{
  const widths = [4500, 1700, 2826];
  const rows = [
    dataRow(["LLM API credits (Anthropic / Gemini)", "₹2.5L", "Planner, research, qualification, writing"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Data & scraping (Maps, B2B data)", "₹1.5L", "Lead discovery sources"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Email deliverability & sending", "₹1L", "Domains, warmup, inbox health"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Hosting / DB / infra", "₹1L", "24/7 pipeline reliability"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    new TableRow({ children: [
      cell("Subtotal", { w: widths[0], fill: LIGHTBLUE, bold: true, color: NAVY }),
      cell("₹6L", { w: widths[1], fill: LIGHTBLUE, bold: true, color: NAVY, align: AlignmentType.RIGHT }),
      cell("", { w: widths[2], fill: LIGHTBLUE }),
    ]}),
  ];
  children.push(makeTable(widths, ["Line item", "Total", "Covers"], rows));
}
children.push(body([ t("Why it is the smallest bucket. ", { bold: true }),
  t("This is cost of goods sold. At a ~3.2× markup and ~60% net margin, paying customers cover most incremental cost, so ₹6L is a buffer that stretches well past 16 months as revenue ramps. Funding paid acquisition harder here carries little real risk.") ]));
children.push(spacer(120));

// ---------- Bucket 4 ----------
children.push(h1("Bucket 4 — Compliance, Tools & Buffer · ₹4L (8%)"));
{
  const widths = [4500, 1700, 2826];
  const rows = [
    dataRow(["Legal & compliance", "₹1L", "Incorporation, CA, GST, contracts, IP"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["SaaS tool stack", "₹1L", "Analytics, CRM, design, support, dev tools"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Payment & transaction fees", "₹0.5L", "Gateway / processing on subscriptions"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Contingency buffer", "₹1.5L", "~3% of the raise — the unplanned"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    new TableRow({ children: [
      cell("Subtotal", { w: widths[0], fill: LIGHTBLUE, bold: true, color: NAVY }),
      cell("₹4L", { w: widths[1], fill: LIGHTBLUE, bold: true, color: NAVY, align: AlignmentType.RIGHT }),
      cell("", { w: widths[2], fill: LIGHTBLUE }),
    ]}),
  ];
  children.push(makeTable(widths, ["Line item", "Total", "Covers"], rows));
}
children.push(spacer(160));

// ---------- Burn ramp ----------
children.push(h1("How It Ties Together — Burn Ramp"));
children.push(body("Spend is phased: light while we validate channels, heavier once paid and affiliate are scaling (and increasingly offset by revenue)."));
{
  const widths = [2000, 1800, 2200, 3026];
  const rows = [
    dataRow(["Build", "Mo 1–3", "~₹2.3L / mo", "Founders + Content Head + SDR; freelance Meta tests, light spend"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Scale", "Mo 4–9", "~₹3.2L / mo", "+ Meta Specialist full-time; paid scaling once CAC proven"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    dataRow(["Push", "Mo 10–16", "~₹3.6L / mo", "Full team, heaviest paid + affiliate (offset by revenue)"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.RIGHT, AlignmentType.LEFT] }),
    new TableRow({ children: [
      cell("Total", { w: widths[0], fill: NAVY, bold: true, color: "FFFFFF" }),
      cell("16 months", { w: widths[1], fill: NAVY, bold: true, color: "FFFFFF", align: AlignmentType.CENTER }),
      cell("≈ ₹50L", { w: widths[2], fill: NAVY, bold: true, color: "FFFFFF", align: AlignmentType.RIGHT }),
      cell("Extends as revenue ramps at ~60% margin", { w: widths[3], fill: NAVY, bold: true, color: "FFFFFF" }),
    ]}),
  ];
  children.push(makeTable(widths, ["Phase", "Months", "Monthly burn", "What's running"], rows));
}
children.push(spacer(160));

// ---------- Two scenarios ----------
children.push(h1("Runway Under Two Scenarios"));
children.push(body([
  t("On pure cash — assuming zero revenue — the ₹50L lasts about 16 months. In reality revenue offsets burn, so the question that matters is "),
  t("how soon revenue starts carrying the cost.", { bold: true }),
  t(" We stress-test the plan against an optimistic and a conservative breakeven, and the phased hiring above is what protects the downside."),
]));
{
  const widths = [2200, 1600, 1900, 3326];
  const rows = [
    dataRow(["Plan case", "Month 4", "16-mo floor, extends", "Revenue covers COGS + part of burn from Mo 4; later months are increasingly self-funded, so the raise becomes growth fuel rather than life support — effective runway 18+ months"], widths,
      { aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.LEFT] }),
    dataRow(["Conservative", "Month 8–10", "~16 mo, pull levers Mo 6", "Higher pre-revenue burn; trigger the levers below (delay Meta full-time hire, trim paid ₹2–3L, hold founder pay) to stretch toward ~18 months and give revenue time to ramp"], widths,
      { zebra: true, aligns: [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.CENTER, AlignmentType.LEFT] }),
  ];
  children.push(makeTable(widths, ["Scenario", "Breakeven", "Net runway", "What it means"], rows));
}
children.push(body([ t("Why the downside is survivable. ", { bold: true }),
  t("Most of the burn that scales — paid spend and the Meta full-time hire — is discretionary and gated on proof. If revenue is slow, we simply do not flip those on, and burn stays near the ₹2.3L build-phase level. The fixed cost (two founders + Content Head + SDR) is only ~₹1.7L/mo, which the existing customer base increasingly covers on its own.") ]));
children.push(spacer(160));

// ---------- Milestones ----------
children.push(h1("What This Round Buys (Milestones to Next Raise)"));
children.push(body("By the end of the runway, the round should have produced the evidence needed to raise a seed at a materially higher valuation:"));
children.push(bullet("Both founders full-time, with a three-person GTM team (Content Head, SDR, Meta Ads Specialist) in place"));
children.push(bullet("A growing base of paying customers and predictable monthly recurring revenue"));
children.push(bullet("First 10,000 SMEs reached, with a measurable free → paid conversion rate"));
children.push(bullet("Unit economics proven at scale — CAC payback, ~60% margin held, retention curve"));
children.push(bullet("Three repeatable, measurable growth channels live: paid (Meta/Google), founder-led organic content, and SDR-driven outbound"));
children.push(spacer(120));

// ---------- Levers ----------
children.push(h1("Levers (If the Plan Needs to Flex)"));
children.push(bullet([ t("Want a longer runway? ", { bold: true }), t("Keep the Meta Specialist freelance past month 4 and trim paid by ₹2L — pushes effective runway toward ~18 months.") ]));
children.push(bullet([ t("Want faster growth? ", { bold: true }), t("Move ₹2L from buffer / COGS into ad spend once CAC is proven — shorter runway, more top-of-funnel.") ]));
children.push(bullet([ t("Founder pay is the single dial: ", { bold: true }), t("every ₹10K/mo per founder moves the total ~₹3.2L over 16 months.") ]));

// ---- doc ----
const doc = new Document({
  creator: "Flowfiy",
  title: "Flowfiy — Use of Funds & Runway",
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { run: { color: BLUE }, paragraph: { indent: { left: 460, hanging: 260 } } } },
      ]},
    ],
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 21, color: "1F2733" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 260, after: 130 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } },
    ],
  },
  sections: [{
    properties: { page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    }},
    footers: { default: new Footer({ children: [ new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } },
      children: [
        t("Flowfiy  ·  Confidential  ·  flowfiy.com  ·  investor@flowfiy.com        Page ", { size: 16, color: GREY }),
        new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GREY }),
      ],
    })]})},
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const outs = [
    "F:/CodeX Developemt/AI_Sales_outbound_system/Flowfiy_Use_of_Funds.docx",
    "C:/Users/admin/Downloads/Flowfiy_Use_of_Funds.docx",
  ];
  for (const out of outs) {
    fs.writeFileSync(out, buf);
    console.log("WROTE " + out + " (" + buf.length + " bytes)");
  }
});
