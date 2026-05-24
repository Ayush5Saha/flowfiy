const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, ExternalHyperlink,
  PageBreak
} = require("docx");
const fs = require("fs");

// ─── Colour palette ────────────────────────────────────────────────────────
const NAVY       = "0D1B2A";
const ACCENT     = "2563EB";   // brand blue
const ACCENT_LT  = "DBEAFE";   // light blue tint
const GREEN      = "166534";
const GREEN_LT   = "DCFCE7";
const RED_LT     = "FEE2E2";
const RED_D      = "991B1B";
const AMBER_LT   = "FEF9C3";
const AMBER_D    = "92400E";
const GRAY_BG    = "F8FAFC";
const GRAY_LT    = "E2E8F0";
const WHITE      = "FFFFFF";

// ─── Helpers ───────────────────────────────────────────────────────────────
const border1 = (color = "CCCCCC") => ({
  style: BorderStyle.SINGLE, size: 4, color
});
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

const cellBorders = (color = "D1D5DB") => ({
  top: border1(color), bottom: border1(color),
  left: border1(color), right: border1(color)
});
const noBorders = () => ({
  top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder()
});

const shading = (hex) => ({ fill: hex, type: ShadingType.CLEAR, color: "auto" });

const sp = (before = 0, after = 0) => ({ spacing: { before, after } });

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, color: WHITE, size: 36 })],
    shading: shading(NAVY),
    spacing: { before: 320, after: 120 },
    indent: { left: 240, right: 240 },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 28 })],
    spacing: { before: 280, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT_LT } },
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, color: NAVY, size: 24 })],
    spacing: { before: 200, after: 60 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: "1E293B", ...opts })],
    spacing: { before: 60, after: 60 },
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22, color: "1E293B", bold })],
    spacing: { before: 40, after: 40 },
  });
}

function subBullet(text) {
  return new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    children: [new TextRun({ text, size: 20, color: "475569" })],
    spacing: { before: 20, after: 20 },
  });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun("")], spacing: { before: 40, after: 40 } }));
}

function tagCell(label, bg, textColor) {
  return new TableCell({
    borders: noBorders(),
    shading: shading(bg),
    margins: { top: 60, bottom: 60, left: 180, right: 180 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: label, bold: true, size: 18, color: textColor })],
    })],
  });
}

function gapCell(w) {
  return new TableCell({
    borders: noBorders(),
    width: { size: w, type: WidthType.DXA },
    children: [new Paragraph("")],
  });
}

// ─── Section divider ───────────────────────────────────────────────────────
function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GRAY_LT } },
    spacing: { before: 40, after: 40 },
    children: [],
  });
}

// ─── Scorecard row ────────────────────────────────────────────────────────
function scorecardRow(label, value, color) {
  return new TableRow({
    children: [
      new TableCell({
        borders: cellBorders("E2E8F0"),
        shading: shading(GRAY_BG),
        width: { size: 3200, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({
          children: [new TextRun({ text: label, bold: true, size: 20, color: NAVY })],
        })],
      }),
      new TableCell({
        borders: cellBorders("E2E8F0"),
        width: { size: 6160, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        shading: shading(color),
        children: [new Paragraph({
          children: [new TextRun({ text: value, size: 20, color: "1E293B" })],
        })],
      }),
    ],
  });
}

// ─── 2-column info card ───────────────────────────────────────────────────
function infoCard(leftLabel, leftVal, rightLabel, rightVal) {
  const cell = (label, val) => new TableCell({
    borders: cellBorders("E2E8F0"),
    width: { size: 4680, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 200, right: 200 },
    shading: shading(GRAY_BG),
    children: [
      new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: "64748B" })] }),
      new Paragraph({ children: [new TextRun({ text: val, bold: true, size: 24, color: NAVY })] }),
    ],
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [new TableRow({ children: [cell(leftLabel, leftVal), cell(rightLabel, rightVal)] })],
  });
}

// ─── Pain/gain row ────────────────────────────────────────────────────────
function twoColRow(left, right, leftBg, rightBg) {
  const mkCell = (lines, bg) => new TableCell({
    borders: cellBorders("D1D5DB"),
    width: { size: 4680, type: WidthType.DXA },
    shading: shading(bg),
    margins: { top: 100, bottom: 100, left: 200, right: 200 },
    verticalAlign: VerticalAlign.TOP,
    children: lines.map(l =>
      new Paragraph({ children: [new TextRun({ text: l, size: 20, color: "1E293B" })], spacing: { before: 40, after: 40 } })
    ),
  });
  return new TableRow({ children: [mkCell(left, leftBg), mkCell(right, rightBg)] });
}

// ─────────────────────────────────────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 360 } } },
        }],
      },
      {
        reference: "subbullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "◦",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 960, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22, color: "1E293B" } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { font: "Calibri", size: 36, bold: true, color: WHITE },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { font: "Calibri", size: 28, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal",
        run: { font: "Calibri", size: 24, bold: true, color: NAVY },
        paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "FLOWFIY  |  Ideal Customer Profile (ICP)", bold: true, size: 18, color: "64748B" }),
                new TextRun({ text: "\t", size: 18 }),
                new TextRun({ text: "flowfiy.com", size: 18, color: ACCENT }),
              ],
              tabStops: [{ type: "right", position: 9360 }],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Confidential  —  Flowfiy  |  Page ", size: 16, color: "94A3B8" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "94A3B8" }),
                new TextRun({ text: " of ", size: 16, color: "94A3B8" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "94A3B8" }),
              ],
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
            }),
          ],
        }),
      },

      children: [
        // ══════════════════════════════════════════════
        // COVER BLOCK
        // ══════════════════════════════════════════════
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [
            new TableRow({
              children: [new TableCell({
                borders: noBorders(),
                shading: shading(NAVY),
                margins: { top: 440, bottom: 440, left: 440, right: 440 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "FLOWFIY", bold: true, size: 56, color: WHITE, font: "Calibri" })],
                    spacing: { before: 0, after: 80 },
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "Ideal Customer Profile (ICP)", size: 36, color: "93C5FD", font: "Calibri" })],
                    spacing: { before: 0, after: 120 },
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "Who buys Flowfiy — and why", size: 22, color: "CBD5E1", font: "Calibri" })],
                    spacing: { before: 0, after: 0 },
                  }),
                ],
              })],
            }),
          ],
        }),

        ...spacer(1),

        // Quick-stats bar
        infoCard("COMPANY SIZE", "5 – 200 employees", "MONTHLY BUDGET", "$49 – $299 / mo"),

        ...spacer(1),

        // ══════════════════════════════════════════════
        // 1. WHO IS THE ICP?
        // ══════════════════════════════════════════════
        heading1("1.  Who Is the Ideal Customer?"),

        body("Flowfiy is built for B2B companies that rely on outbound sales but are stuck managing a fragmented, expensive, and manual tool stack. They need one AI-powered platform that does the full job — from ICP analysis to personalised outreach — without a $1,400/month bill."),

        ...spacer(1),

        heading2("1.1  Company Profile"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 6560],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(ACCENT),
                  shading: shading(ACCENT),
                  width: { size: 2800, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Attribute", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(ACCENT),
                  shading: shading(ACCENT),
                  width: { size: 6560, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Criteria", bold: true, size: 20, color: WHITE })] })],
                }),
              ],
            }),
            scorecardRow("Business Type", "B2B agency, SaaS, consulting firm, service business, or sales-led startup", ACCENT_LT),
            scorecardRow("Company Size", "5 – 200 employees (sweet spot: 10 – 80)", GRAY_BG),
            scorecardRow("Revenue Stage", "Post-product, generating revenue, needs scalable pipeline", ACCENT_LT),
            scorecardRow("Geography", "India, UAE, Southeast Asia, UK, USA — any English-speaking market", GRAY_BG),
            scorecardRow("Tech Sophistication", "Comfortable with SaaS tools; founder or sales lead is technically literate", ACCENT_LT),
            scorecardRow("Current Stack", "Uses (or has tried) Clay, Apollo, Instantly, Lemlist, or does outreach manually", GRAY_BG),
            scorecardRow("Anthropic API Key", "Has one or is willing to create one (BYOK model)", ACCENT_LT),
          ],
        }),

        ...spacer(1),

        heading2("1.2  Decision-Maker Profile"),

        body("Target one of these roles — in priority order:"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3000, 6360],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(ACCENT), shading: shading(ACCENT),
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Role", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(ACCENT), shading: shading(ACCENT),
                  width: { size: 6360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Why They Buy", bold: true, size: 20, color: WHITE })] })],
                }),
              ],
            }),
            ...[
              ["Founder / CEO", "Doing BD themselves; wants to get out of manual outreach and build a system", ACCENT_LT],
              ["Head of Sales / VP Sales", "Responsible for pipeline; wants AI-augmented reps, not replacement", GRAY_BG],
              ["Growth Lead / Head of Growth", "Runs demand gen; wants outbound as a new acquisition channel", ACCENT_LT],
              ["RevOps / Sales Ops", "Manages the stack; wants consolidation and automation", GRAY_BG],
              ["SDR / BDR Manager", "Wants to give their team leverage without adding headcount", ACCENT_LT],
            ].map(([role, why, bg]) => new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  width: { size: 3000, type: WidthType.DXA },
                  shading: shading(bg),
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: role, bold: true, size: 20, color: NAVY })] })],
                }),
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  width: { size: 6360, type: WidthType.DXA },
                  shading: shading(bg),
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: why, size: 20, color: "1E293B" })] })],
                }),
              ],
            })),
          ],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 2. PAIN POINTS (WHY THEY BUY)
        // ══════════════════════════════════════════════
        heading1("2.  Pain Points — Why They Buy"),

        body("The ICP is stuck in one or more of these pain states:"),

        ...spacer(1),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(RED_D), shading: shading(RED_D),
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 200, right: 200 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u{1F525}  The Pain (Before Flowfiy)", bold: true, size: 22, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(GREEN), shading: shading(GREEN),
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 200, right: 200 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✅  The Gain (After Flowfiy)", bold: true, size: 22, color: WHITE })] })],
                }),
              ],
            }),
            twoColRow(
              ["•  Spending $600–$1,400/mo on Clay + Apollo + Instantly", "•  Three logins, three billing cycles, constant context-switching"],
              ["•  One platform. One bill. $49–$299/mo.", "•  5× cheaper than the stack it replaces"],
              RED_LT, GREEN_LT
            ),
            twoColRow(
              ["•  Manual lead research eating 2–3 hours per day", "•  SDRs spending more time prospecting than selling"],
              ["•  5-agent pipeline runs in minutes", "•  ICP → leads → scored → personalised — fully automated"],
              RED_LT, GREEN_LT
            ),
            twoColRow(
              ["•  Generic, copy-paste outreach with <1% reply rates", "•  No personalisation at scale without a copywriter"],
              ["•  Personalisation Agent writes context-aware emails per lead", "•  Based on real company intel, not templates"],
              RED_LT, GREEN_LT
            ),
            twoColRow(
              ["•  Founder doing all BD personally — no system, no leverage", "•  Revenue tied to founder’s calendar"],
              ["•  Automated outbound runs 24/7 without founder involvement", "•  Pipeline builds while the founder sleeps"],
              RED_LT, GREEN_LT
            ),
            twoColRow(
              ["•  Inconsistent lead flow — feast or famine cycles", "•  Referral-only acquisition with no predictability"],
              ["•  Consistent, repeatable pipeline from day one", "•  Outbound becomes a reliable acquisition channel"],
              RED_LT, GREEN_LT
            ),
            twoColRow(
              ["•  AI SDR tools (Artisan, 11x) cost $2K–$5K/mo", "•  Full SDR replacement backlash — buyers don’t want a robot"],
              ["•  Flowfiy augments your team, doesn’t replace it", "•  Founder-friendly pricing: starts at $49"],
              RED_LT, GREEN_LT
            ),
          ],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 3. QUALIFICATION CRITERIA
        // ══════════════════════════════════════════════
        heading1("3.  Qualification Criteria"),

        ...spacer(1),

        // Qualified vs Disqualified side by side
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(GREEN), shading: shading(GREEN),
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 200, right: 200 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✓  QUALIFY — All Must Be True", bold: true, size: 22, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(RED_D), shading: shading(RED_D),
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 200, right: 200 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✗  DISQUALIFY — Any One Fails Them", bold: true, size: 22, color: WHITE })] })],
                }),
              ],
            }),
            twoColRow(
              [
                "•  B2B business model (sells to other businesses)",
                "•  5–200 employees",
                "•  Has (or needs) an outbound sales motion",
                "•  Currently spending on outreach tools OR doing it manually",
                "•  Has a decision-maker who owns pipeline / growth",
                "•  Can create an Anthropic API key (BYOK)",
                "•  Budget: $49–$299/mo available",
              ],
              [
                "•  Pure B2C company (no B2B sales)",
                "•  Enterprise (500+ employees, full sales team)",
                "•  Inbound-only or product-led, no outbound motion",
                "•  No budget or tool-averse culture",
                "•  Sole trader / freelancer (too small)",
                "•  Wants a fully managed service (not self-serve)",
                "•  Non-English outreach market (v1 limitation)",
              ],
              GREEN_LT, RED_LT
            ),
          ],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 4. ICP SEGMENTS (TIERS)
        // ══════════════════════════════════════════════
        heading1("4.  ICP Segments — Three Tiers"),

        body("Not all ICP companies are equal. Use this tier model to prioritise outreach and product positioning:"),

        ...spacer(1),

        // Tier 1
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: cellBorders(ACCENT),
            shading: shading(ACCENT_LT),
            margins: { top: 120, bottom: 120, left: 240, right: 240 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "★  TIER 1 — Perfect Fit (Close Fast)", bold: true, size: 26, color: NAVY })] }),
              new Paragraph({ children: [new TextRun({ text: "", size: 10 })] }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "B2B agency or consulting firm, 10–80 employees", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Founder or head of sales actively doing outreach manually", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Currently paying for Clay, Apollo, Instantly, or Lemlist", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Referral-heavy — wants to add a proactive pipeline channel", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Growth $119 or Agency $299 plan buyer", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
            ],
          })]})],
        }),

        ...spacer(1),

        // Tier 2
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: cellBorders("D97706"),
            shading: shading(AMBER_LT),
            margins: { top: 120, bottom: 120, left: 240, right: 240 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "▲  TIER 2 — Good Fit (Nurture to Convert)", bold: true, size: 26, color: NAVY })] }),
              new Paragraph({ children: [new TextRun({ text: "", size: 10 })] }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "SaaS startup or service business, 5–20 employees, pre-Series A", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Has an SDR or outbound motion but it’s inconsistent", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Aware of Clay/Apollo but hasn’t committed yet", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Starter $49 plan entry point; likely upsells to Growth", size: 21, color: "1E293B" })], spacing: { before: 30, after: 30 } }),
            ],
          })]})],
        }),

        ...spacer(1),

        // Tier 3
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: cellBorders("94A3B8"),
            shading: shading(GRAY_BG),
            margins: { top: 120, bottom: 120, left: 240, right: 240 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "●  TIER 3 — Exploratory (Qualify First)", bold: true, size: 26, color: "64748B" })] }),
              new Paragraph({ children: [new TextRun({ text: "", size: 10 })] }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Solo founder or very early-stage, just starting outbound", size: 21, color: "475569" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Mid-market company (80–200 employees) testing AI tooling", size: 21, color: "475569" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Free plan users — convert with product experience", size: 21, color: "475569" })], spacing: { before: 30, after: 30 } }),
              new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Investigate before investing outreach effort", size: 21, color: "475569" })], spacing: { before: 30, after: 30 } }),
            ],
          })]})],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 5. BUYING TRIGGERS
        // ══════════════════════════════════════════════
        heading1("5.  Buying Triggers"),

        body("Reach out when you see one or more of these signals — they indicate the prospect is actively feeling the pain:"),

        ...spacer(1),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [600, 4080, 600, 4080],
          rows: [
            ...[
              ["📈", "Hiring an SDR or BDR right now", "🔧", "Just signed up for Clay / Apollo / Instantly"],
              ["🚀", "Posted about scaling or hitting growth goals", "💸", "Complaining about outreach tool costs on LinkedIn"],
              ["🔍", "New website or rebrand recently launched", "⚡", "Founder posting about doing BD manually"],
              ["🎯", "Opened a new market or launched a new service", "⏱️", "Posted about not having enough time for sales"],
            ].map(([e1, t1, e2, t2]) => new TableRow({
              children: [
                new TableCell({
                  borders: noBorders(), width: { size: 600, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 100, right: 60 },
                  shading: shading(ACCENT_LT),
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: e1, size: 24 })] })],
                }),
                new TableCell({
                  borders: cellBorders("E2E8F0"), width: { size: 4080, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: t1, size: 20, color: "1E293B" })] })],
                }),
                new TableCell({
                  borders: noBorders(), width: { size: 600, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 100, right: 60 },
                  shading: shading(ACCENT_LT),
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: e2, size: 24 })] })],
                }),
                new TableCell({
                  borders: cellBorders("E2E8F0"), width: { size: 4080, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: t2, size: 20, color: "1E293B" })] })],
                }),
              ],
            })),
          ],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 6. MESSAGING GUIDE
        // ══════════════════════════════════════════════
        heading1("6.  Messaging Guide by Persona"),

        body("Tailor the hook based on who you are talking to. Same product — different angle:"),

        ...spacer(1),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2400, 3480, 3480],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(ACCENT), shading: shading(ACCENT),
                  width: { size: 2400, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Persona", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(ACCENT), shading: shading(ACCENT),
                  width: { size: 3480, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Core Message", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(ACCENT), shading: shading(ACCENT),
                  width: { size: 3480, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Proof Point / Hook", bold: true, size: 20, color: WHITE })] })],
                }),
              ],
            }),
            ...[
              ["Founder / CEO", "Stop doing BD manually. Build a system that runs without you.", "\"Replace 3 hrs of daily prospecting with a 5-agent AI pipeline.\""],
              ["Head of Sales", "Give your team AI leverage — more pipeline, same headcount.", "\"Your reps close deals. Flowfiy fills their calendar.\""],
              ["Growth Lead", "Add outbound as a predictable acquisition channel.", "\"Outbound → pipeline on autopilot. BYOK = 95% margin.\""],
              ["RevOps / Sales Ops", "Replace Clay + Apollo + Instantly with one platform.", "\"Cut $1,100/mo from your stack. One login. Full pipeline.\""],
              ["SDR Manager", "Give each rep an AI co-pilot that researches and personalises.", "\"5 agents per prospect. Personalisation Agent writes each email.\""],
            ].map(([persona, msg, proof], i) => new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  shading: shading(i % 2 === 0 ? ACCENT_LT : GRAY_BG),
                  width: { size: 2400, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: persona, bold: true, size: 20, color: NAVY })] })],
                }),
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  shading: shading(i % 2 === 0 ? ACCENT_LT : GRAY_BG),
                  width: { size: 3480, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: msg, size: 20, color: "1E293B" })] })],
                }),
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  shading: shading(i % 2 === 0 ? ACCENT_LT : GRAY_BG),
                  width: { size: 3480, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 140, right: 140 },
                  children: [new Paragraph({ children: [new TextRun({ text: proof, size: 20, color: "475569" })] })],
                }),
              ],
            })),
          ],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 7. ANTI-ICP (DO NOT TARGET)
        // ══════════════════════════════════════════════
        heading1("7.  Anti-ICP — Do Not Target"),

        body("Targeting these segments wastes outreach budget and distorts conversion metrics:"),

        ...spacer(1),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3000, 6360],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(RED_D), shading: shading(RED_D),
                  width: { size: 3000, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Segment", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(RED_D), shading: shading(RED_D),
                  width: { size: 6360, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Why They Fail", bold: true, size: 20, color: WHITE })] })],
                }),
              ],
            }),
            ...[
              ["Pure B2C companies", "No B2B outbound motion; wrong use case entirely"],
              ["Enterprise (500+ employees)", "Need compliance, SSO, MSA — different sales cycle and pricing"],
              ["AI agencies", "Competitor overlap; they build their own tools; poor fit"],
              ["Inbound-only / PLG companies", "No outbound motion to automate; no pain point for Flowfiy"],
              ["Non-technical founders (tool-averse)", "BYOK model requires comfort with API keys; high churn risk"],
              ["Freelancers / solo traders", "Too small; unit economics don’t work at $49/mo"],
              ["Full-service SDR replacement seekers", "Artisan/11x is their fit; Flowfiy augments, doesn’t replace"],
            ].map(([seg, why], i) => new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders("FECACA"),
                  width: { size: 3000, type: WidthType.DXA },
                  shading: shading(i % 2 === 0 ? RED_LT : "FFF5F5"),
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: seg, bold: true, size: 20, color: RED_D })] })],
                }),
                new TableCell({
                  borders: cellBorders("FECACA"),
                  width: { size: 6360, type: WidthType.DXA },
                  shading: shading(i % 2 === 0 ? RED_LT : "FFF5F5"),
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: why, size: 20, color: "1E293B" })] })],
                }),
              ],
            })),
          ],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 8. ICP SCORING
        // ══════════════════════════════════════════════
        heading1("8.  ICP Scoring Cheat Sheet"),

        body("Score every prospect before outreach. 8+ = priority. Below 5 = skip."),

        ...spacer(1),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [5560, 1900, 1900],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders(NAVY), shading: shading(NAVY),
                  width: { size: 5560, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: "Signal", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(NAVY), shading: shading(NAVY),
                  width: { size: 1900, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Points", bold: true, size: 20, color: WHITE })] })],
                }),
                new TableCell({
                  borders: cellBorders(NAVY), shading: shading(NAVY),
                  width: { size: 1900, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Direction", bold: true, size: 20, color: WHITE })] })],
                }),
              ],
            }),
            ...[
              ["Uses Clay, Apollo, or Instantly today", "+3", "↑"],
              ["Founder is the one doing BD manually", "+3", "↑"],
              ["Multiple outbound gaps confirmed", "+2", "↑"],
              ["B2B agency or consulting firm", "+2", "↑"],
              ["Active hiring for sales roles", "+2", "↑"],
              ["Recent growth signals (launch, new market)", "+1", "↑"],
              ["Decision-maker reachable on LinkedIn / email", "+1", "↑"],
              ["Has existing Anthropic API key", "+1", "↑"],
              ["No outbound gaps found (strong inbound system)", "-3", "↓"],
              ["Looks dormant (no activity in 6+ months)", "-2", "↓"],
              ["B2C or not client-acquisition dependent", "Disqualify", "✕"],
            ].map(([signal, pts, dir], i) => new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  width: { size: 5560, type: WidthType.DXA },
                  shading: shading(i % 2 === 0 ? GRAY_BG : WHITE),
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [new Paragraph({ children: [new TextRun({ text: signal, size: 20, color: "1E293B" })] })],
                }),
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  width: { size: 1900, type: WidthType.DXA },
                  shading: shading(pts.startsWith("+") ? GREEN_LT : pts === "Disqualify" ? RED_LT : RED_LT),
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pts, bold: true, size: 20, color: pts.startsWith("+") ? GREEN : RED_D })] })],
                }),
                new TableCell({
                  borders: cellBorders("D1D5DB"),
                  width: { size: 1900, type: WidthType.DXA },
                  shading: shading(i % 2 === 0 ? GRAY_BG : WHITE),
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dir, bold: true, size: 22, color: pts.startsWith("+") ? GREEN : RED_D })] })],
                }),
              ],
            })),
          ],
        }),

        ...spacer(1),

        // Score legend
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [new TableRow({
            children: [
              new TableCell({
                borders: cellBorders(GREEN), shading: shading(GREEN_LT),
                width: { size: 3120, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 200, right: 200 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Score 8–10", bold: true, size: 22, color: GREEN })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Priority — outreach immediately", size: 19, color: "1E293B" })] })],
              }),
              new TableCell({
                borders: cellBorders("D97706"), shading: shading(AMBER_LT),
                width: { size: 3120, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 200, right: 200 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Score 5–7", bold: true, size: 22, color: AMBER_D })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Queue — nurture sequence", size: 19, color: "1E293B" })] })],
              }),
              new TableCell({
                borders: cellBorders(RED_D), shading: shading(RED_LT),
                width: { size: 3120, type: WidthType.DXA },
                margins: { top: 100, bottom: 100, left: 200, right: 200 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Score < 5", bold: true, size: 22, color: RED_D })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Skip — not worth the effort", size: 19, color: "1E293B" })] })],
              }),
            ],
          })],
        }),

        ...spacer(2),

        // ══════════════════════════════════════════════
        // 9. QUICK REFERENCE CARD
        // ══════════════════════════════════════════════
        heading1("9.  Quick Reference Card"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: cellBorders(ACCENT),
            shading: shading(NAVY),
            margins: { top: 200, bottom: 200, left: 360, right: 360 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FLOWFIY  —  ICP in One Sentence", bold: true, size: 30, color: "93C5FD" })], spacing: { after: 120 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: "A B2B founder or sales leader at a 5–200-person company who is spending too much time or money on outbound, and needs one AI-powered platform to replace their fragmented tool stack and build a predictable pipeline.",
                  size: 24, color: WHITE, italics: true,
                })],
              }),
            ],
          })]})],
        }),

        ...spacer(1),

        body("flowfiy.com  •  Raising $150K seed  •  BYOK model  •  38 features in production", { color: "94A3B8", size: 18, italics: true }),

      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("E:\\CodeX Developemt\\AI_Sales_outbound_system\\Flowfiy_ICP.docx", buffer);
  console.log("ICP document created: Flowfiy_ICP.docx");
});
