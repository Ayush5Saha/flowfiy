const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, Header, Footer, ImageRun,
  LevelFormat
} = require("C:/Users/ADMIN/AppData/Roaming/npm/node_modules/docx");

// ── Helpers ──────────────────────────────────────────────────────────────────

const VIOLET   = "6D28D9";
const INDIGO   = "3730A3";
const DARK_BG  = "1E1B4B";
const LIGHT_BG = "EDE9FE";
const WHITE    = "FFFFFF";
const GRAY_BG  = "F5F3FF";
const RED_BG   = "FEE2E2";
const AMBER_BG = "FEF3C7";
const GREEN_BG = "D1FAE5";
const BORDER_GRAY = "D1D5DB";
const TEXT_DARK  = "111827";
const TEXT_MUTED = "6B7280";

function cell(text, opts = {}) {
  const {
    bg = WHITE, bold = false, color = TEXT_DARK,
    size = 18, align = AlignmentType.LEFT, shade = true,
    colspan = 1, width = null, vAlign = VerticalAlign.CENTER,
    italic = false
  } = opts;

  const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY };
  const borders = { top: border, bottom: border, left: border, right: border };

  const cellOpts = {
    borders,
    verticalAlign: vAlign,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, color, size, font: "Inter", italics: italic })]
    })]
  };

  if (shade && bg !== WHITE) {
    cellOpts.shading = { fill: bg, type: ShadingType.CLEAR };
  }
  if (colspan > 1) cellOpts.columnSpan = colspan;
  if (width) cellOpts.width = { size: width, type: WidthType.DXA };

  return new TableCell(cellOpts);
}

function hdr(text, bg = VIOLET, color = WHITE) {
  return cell(text, { bg, color, bold: true, size: 18 });
}

function sectionTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, color: VIOLET, font: "Inter" })]
  });
}

function subTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: INDIGO, font: "Inter" })]
  });
}

function body(text, opts = {}) {
  const { bold = false, color = TEXT_DARK, size = 18, before = 60, after = 60, italic = false } = opts;
  return new Paragraph({
    spacing: { before, after },
    children: [new TextRun({ text, bold, color, size, font: "Inter", italics: italic })]
  });
}

function bullet(text, color = TEXT_DARK) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, color, size: 18, font: "Inter" })]
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BG } },
    children: []
  });
}

function flowBox(label, bg = LIGHT_BG, textColor = VIOLET, bold = true) {
  const border = { style: BorderStyle.SINGLE, size: 2, color: VIOLET };
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: bg, type: ShadingType.CLEAR },
      borders: { top: border, bottom: border, left: border, right: border },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label, bold, color: textColor, size: 20, font: "Inter" })]
      })]
    })]})],
  });
}

function arrowPara(text = "▼") {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, bold: true, color: VIOLET, size: 20, font: "Inter" })]
  });
}

function badge(label, bg, color) {
  return new Table({
    width: { size: 2200, type: WidthType.DXA },
    columnWidths: [2200],
    rows: [new TableRow({ children: [new TableCell({
      shading: { fill: bg, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: bg },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: bg },
        left: { style: BorderStyle.SINGLE, size: 1, color: bg },
        right: { style: BorderStyle.SINGLE, size: 1, color: bg },
      },
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label, bold: true, color, size: 16, font: "Inter" })]
      })]
    })]})],
  });
}

// ── Document ─────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: "•",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  styles: {
    default: {
      document: { run: { font: "Inter", size: 18, color: TEXT_DARK } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Inter", color: VIOLET },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Inter", color: INDIGO },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BG } },
          spacing: { after: 80 },
          children: [new TextRun({ text: "Flowfiy — Backend Architecture & Workflow Report", size: 16, color: TEXT_MUTED, font: "Inter" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: LIGHT_BG } },
          spacing: { before: 80 },
          children: [
            new TextRun({ text: "Page ", size: 16, color: TEXT_MUTED, font: "Inter" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: TEXT_MUTED, font: "Inter" }),
            new TextRun({ text: "  |  Confidential — Flowfiy Internal", size: 16, color: TEXT_MUTED, font: "Inter" }),
          ]
        })]
      })
    },
    children: [

      // ── COVER ───────────────────────────────────────────────────────────────
      new Paragraph({ spacing: { before: 1200, after: 0 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "FLOWFIY", bold: true, size: 64, color: VIOLET, font: "Inter" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: "Backend Architecture & Workflow Report", size: 36, color: INDIGO, font: "Inter" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: VIOLET } },
        spacing: { before: 0, after: 800 },
        children: []
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "AI-Powered Sales Outreach Platform", size: 24, color: TEXT_MUTED, font: "Inter", italics: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "Full-stack: Next.js · Supabase · BullMQ · Claude AI · Apollo · Apify · Gmail · Razorpay", size: 18, color: TEXT_MUTED, font: "Inter" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 0 },
        children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-IN", { year:"numeric", month:"long", day:"numeric" })}`, size: 18, color: TEXT_MUTED, font: "Inter" })]
      }),
      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── SECTION 1: SYSTEM ARCHITECTURE ─────────────────────────────────────
      sectionTitle("1.  System Architecture"),
      body("Flowfiy is a multi-tenant B2B sales outreach platform. The architecture separates the synchronous HTTP layer (Next.js on Vercel) from the long-running AI pipeline (BullMQ worker on Railway), connected through a Redis queue hosted on Upstash.", { before: 80, after: 120 }),

      // Architecture table
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 3780, 3780],
        rows: [
          new TableRow({ children: [hdr("Layer"), hdr("Technology"), hdr("Responsibility")] }),
          new TableRow({ children: [
            cell("Frontend", { bold: true, bg: GRAY_BG }),
            cell("Next.js 15 (App Router) — Vercel"),
            cell("UI, auth pages, dashboard, settings")
          ]}),
          new TableRow({ children: [
            cell("API Layer", { bold: true, bg: GRAY_BG }),
            cell("Next.js API Routes — Vercel Serverless"),
            cell("Auth, validation, queue dispatch, webhooks")
          ]}),
          new TableRow({ children: [
            cell("Auth", { bold: true, bg: GRAY_BG }),
            cell("Supabase Auth (JWT + Google OAuth)"),
            cell("Session management, Google login, Gmail OAuth")
          ]}),
          new TableRow({ children: [
            cell("Database", { bold: true, bg: GRAY_BG }),
            cell("PostgreSQL via Supabase + Prisma ORM"),
            cell("All persistent data: orgs, leads, campaigns, billing")
          ]}),
          new TableRow({ children: [
            cell("Queue", { bold: true, bg: GRAY_BG }),
            cell("BullMQ + Upstash Redis (ioredis)"),
            cell("Job queue for AI pipeline and email sending")
          ]}),
          new TableRow({ children: [
            cell("Worker", { bold: true, bg: GRAY_BG }),
            cell("Node.js standalone process — Railway"),
            cell("Executes lead generation + email send jobs")
          ]}),
          new TableRow({ children: [
            cell("AI Engine", { bold: true, bg: GRAY_BG }),
            cell("Anthropic Claude API (BYOK — user\'s own key)"),
            cell("ICP analysis, company research, qualification, copy")
          ]}),
          new TableRow({ children: [
            cell("Rate Limiting", { bold: true, bg: GRAY_BG }),
            cell("Upstash Redis REST (@upstash/ratelimit)"),
            cell("3-tier limits: API, generation, auth")
          ]}),
          new TableRow({ children: [
            cell("Billing", { bold: true, bg: GRAY_BG }),
            cell("Razorpay Subscriptions + Webhooks"),
            cell("INR-native recurring billing, plan management")
          ]}),
        ]
      }),

      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── SECTION 2: FULL WORKFLOW FLOWCHART ─────────────────────────────────
      sectionTitle("2.  Backend Workflow — Full Pipeline"),

      // ── 2A User Trigger ──
      subTitle("2A.  Lead Generation Trigger (HTTP Layer)"),
      body("When a user clicks \"Generate Leads\", the following pre-flight checks run synchronously before any AI or external API is called:", { before: 60, after: 100 }),

      flowBox("USER clicks  +Generate Leads  in dashboard", DARK_BG, WHITE),
      arrowPara("▼"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [300, 4530, 4530],
        rows: [
          new TableRow({ children: [
            hdr("#"), hdr("Check"), hdr("Failure Response")
          ]}),
          new TableRow({ children: [
            cell("1", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Supabase JWT session valid?"),
            cell("401 Unauthorized")
          ]}),
          new TableRow({ children: [
            cell("2", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Rate limit: max 5 triggers / minute / user"),
            cell("429 Too Many Requests")
          ]}),
          new TableRow({ children: [
            cell("3", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Zod schema valid (organizationId UUID, listName 2-100 chars, leadsPerRun 5-50)"),
            cell("400 Bad Request")
          ]}),
          new TableRow({ children: [
            cell("4", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("User is member of the organization?"),
            cell("403 Forbidden")
          ]}),
          new TableRow({ children: [
            cell("5", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Generation quota remaining > 0?"),
            cell("402 Quota Exceeded")
          ]}),
          new TableRow({ children: [
            cell("6", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Claude API key connected & CONNECTED status?"),
            cell("422 Unprocessable Entity")
          ]}),
          new TableRow({ children: [
            cell("7", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Apollo API key connected & CONNECTED status?"),
            cell("422 Unprocessable Entity")
          ]}),
          new TableRow({ children: [
            cell("8", { bg: GRAY_BG, align: AlignmentType.CENTER }),
            cell("Business profile (ICP) configured?"),
            cell("422 Unprocessable Entity")
          ]}),
        ]
      }),

      arrowPara("▼  ALL CHECKS PASS"),
      flowBox("CREATE LeadList in DB  →  status: QUEUED", GRAY_BG, INDIGO),
      arrowPara("▼"),
      flowBox("ENQUEUE BullMQ job  →  returns 201 to client immediately", GREEN_BG, "166534"),
      arrowPara("▼  (async — worker picks up from Redis queue)"),

      new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }),

      // ── 2B Worker Pipeline ──
      subTitle("2B.  AI Pipeline Worker (Background Process — Railway)"),
      body("The BullMQ worker processes jobs with concurrency: 3 and exponential backoff retry (3 attempts, starting at 2s). Each job runs the full 4-agent Claude pipeline.", { before: 60, after: 100 }),

      // Step 1
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: VIOLET, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "STEP 1  —  AGENT 1: ICP ANALYZER", bold: true, color: WHITE, size: 22, font: "Inter" })]
          })]
        })]})],
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 3480, 3480],
        rows: [
          new TableRow({ children: [ hdr("Property"), hdr("Value"), hdr("Notes") ] }),
          new TableRow({ children: [ cell("Model", {bg: GRAY_BG}), cell("claude-haiku-4-5"), cell("Fast & cheap — classification task") ] }),
          new TableRow({ children: [ cell("Max tokens", {bg: GRAY_BG}), cell("1,024"), cell("~400 tokens output typical") ] }),
          new TableRow({ children: [ cell("Input", {bg: GRAY_BG}), cell("Full business profile (ICP desc, industries, geographies, pain points, positioning)"), cell("From BusinessProfile table") ] }),
          new TableRow({ children: [ cell("Output", {bg: GRAY_BG}), cell("apolloSearchFilters {jobTitles, industries, companySizes}, qualificationCriteria, buyerPersonas, outreachAngles"), cell("JSON parsed from response") ] }),
          new TableRow({ children: [ cell("Saved to", {bg: GRAY_BG}), cell("BusinessProfile.icpAnalysisCache (JSON)"), cell("Cached — reused for all leads in this run") ] }),
        ]
      }),
      arrowPara("▼"),

      // Step 2
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: VIOLET, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "STEP 2  —  LEAD DISCOVERY", bold: true, color: WHITE, size: 22, font: "Inter" })] })]
        })]})],
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [ hdr("Mode: apollo  (normal)"), hdr("Mode: import  (CSV upload)") ] }),
          new TableRow({ children: [
            cell("Calls Apollo.io /mixed_people/search with jobTitles, companySizes, geographies from ICP analysis. Returns up to 50 contacts.", { bg: GRAY_BG }),
            cell("Reads leads already inserted into the DB from the CSV upload. Skips Apollo entirely.", { bg: GRAY_BG })
          ]}),
          new TableRow({ children: [
            cell("Creates Lead records in DB (status: RESEARCHING)"),
            cell("Updates existing Lead records (status: RESEARCHING)")
          ]}),
        ]
      }),
      arrowPara("▼"),

      // Step 3
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: VIOLET, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "STEP 3  —  PER-LEAD PROCESSING  (batches of 5, parallel within batch)", bold: true, color: WHITE, size: 22, font: "Inter" })] })]
        })]})],
      }),

      body("For each lead in the batch, the following sub-pipeline runs in parallel:", { before: 80, after: 80 }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 8960],
        rows: [
          new TableRow({ children: [ hdr("Sub-step"), hdr("Description") ] }),
          new TableRow({ children: [
            cell("3a", { bg: LIGHT_BG, align: AlignmentType.CENTER, bold: true }),
            cell("[APIFY — optional]  If Apify integration is connected AND lead has a company website, scrape the site using Apify\'s website-content-crawler actor (cheerio, 3 pages max, 30s timeout). On failure → silently continue with empty website content.")
          ]}),
          new TableRow({ children: [
            cell("3b", { bg: LIGHT_BG, align: AlignmentType.CENTER, bold: true }),
            cell("[AGENT 2: COMPANY ANALYZER — claude-sonnet-4-6, 1024 tokens]  Input: company name, website URL, industry, company size, scraped website text (up to 8,000 chars), ICP summary. Output: brandMaturity, marketingQuality, acquisitionGaps, growthBottlenecks, techStack, recentSignals, fitAssessment, bestOutreachAngle, confidence (0.0–1.0).")
          ]}),
          new TableRow({ children: [
            cell("3c", { bg: LIGHT_BG, align: AlignmentType.CENTER, bold: true }),
            cell("[AGENT 3: QUALIFICATION — claude-haiku-4-5, 512 tokens]  Input: lead data, company analysis from 3b, ICP summary, qualificationCriteria from Step 1. Output: score (0–100), qualified (bool), primaryReason, bestAngle, painPointMatch, personalizationHooks[].")
          ]}),
          new TableRow({ children: [
            cell("3d", { bg: LIGHT_BG, align: AlignmentType.CENTER, bold: true }),
            cell("SAVE LeadResearch record to DB — stores companyAnalysis (JSON), opportunityAngle, painPointMatch, personalizationNotes, researchMetadata (confidence score).")
          ]}),
          new TableRow({ children: [
            cell("3e", { bg: GREEN_BG, align: AlignmentType.CENTER, bold: true }),
            cell("IF qualified == true:\n[AGENT 4: PERSONALIZATION — claude-sonnet-4-6, 1500 tokens]  Input: lead info, business profile (service, positioning, tone), bestAngle, painPointMatch, personalizationHooks, Calendly link (if connected). Output: subjectLine, emailBody, followUp1, followUp2.\nSAVE OutreachCopy record to DB.")
          ]}),
          new TableRow({ children: [
            cell("3f", { bg: GRAY_BG, align: AlignmentType.CENTER, bold: true }),
            cell("UPDATE Lead record: status → QUALIFIED or DISQUALIFIED, qualificationScore (0–100).\nOn any error for this lead → status → DISQUALIFIED, processing continues for remaining leads.")
          ]}),
        ]
      }),
      arrowPara("▼"),

      // Step 4
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: VIOLET, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "STEP 4  —  FINALIZE", bold: true, color: WHITE, size: 22, font: "Inter" })] })]
        })]})],
      }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({ children: [ hdr("Action"), hdr("Data written") ] }),
          new TableRow({ children: [
            cell("Increment generation count"),
            cell("Organization.generationCount += totalLeads processed")
          ]}),
          new TableRow({ children: [
            cell("Create UsageEvent"),
            cell("eventType: lead_generation, metadata: {amount}")
          ]}),
          new TableRow({ children: [
            cell("Finalize LeadList"),
            cell("status: READY, jobStatus: complete, totalLeads, qualifiedLeads")
          ]}),
        ]
      }),
      flowBox("PIPELINE COMPLETE — LeadList status: READY ✓", GREEN_BG, "166534"),

      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── 2C Email Send Pipeline ──
      subTitle("2C.  Email Send Pipeline"),
      body("When a user approves outreach and launches a campaign, email jobs are enqueued to a separate BullMQ queue (concurrency: 10, rate-limited to 50 emails/hour to protect Gmail sender reputation).", { before: 60, after: 100 }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [400, 8960],
        rows: [
          new TableRow({ children: [ hdr("Step"), hdr("Description") ] }),
          new TableRow({ children: [
            cell("1", { bg: GRAY_BG, align: AlignmentType.CENTER, bold: true }),
            cell("Load CampaignLead → Lead → OutreachCopy → Campaign from DB. Validates lead has email, outreach copy exists.")
          ]}),
          new TableRow({ children: [
            cell("2", { bg: GRAY_BG, align: AlignmentType.CENTER, bold: true }),
            cell("Fetch Gmail integration from DB, verify status = CONNECTED. Decrypt refresh token using AES-256-GCM.")
          ]}),
          new TableRow({ children: [
            cell("3", { bg: GRAY_BG, align: AlignmentType.CENTER, bold: true }),
            cell("Construct RFC 2822 MIME message (To, From, Subject, Content-Type). Base64url-encode. Send via Gmail API users.messages.send (OAuth2 with auto-refreshed access token).")
          ]}),
          new TableRow({ children: [
            cell("4", { bg: GREEN_BG, align: AlignmentType.CENTER, bold: true }),
            cell("Update CampaignLead: status → SENT, sentAt, gmailMessageId, gmailThreadId. Increment Campaign.sentCount.")
          ]}),
        ]
      }),

      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── SECTION 3: API ROUTES ───────────────────────────────────────────────
      sectionTitle("3.  API Routes — Complete Reference"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 700, 1400, 4460],
        rows: [
          new TableRow({ children: [ hdr("Endpoint"), hdr("Method"), hdr("Status"), hdr("Description") ] }),
          new TableRow({ children: [ cell("/api/leads/generate", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("8-check pre-flight → create LeadList → enqueue AI pipeline") ] }),
          new TableRow({ children: [ cell("/api/leads/import", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("CSV import → bulk create leads → enqueue in import mode (max 500)") ] }),
          new TableRow({ children: [ cell("/api/leads/[listId]", {bg: GRAY_BG}), cell("GET"), cell("✅ Working", {color:"166534",bold:true}), cell("Fetch lead list with all leads and research data") ] }),
          new TableRow({ children: [ cell("/api/leads/chat", {bg: RED_BG}), cell("POST"), cell("🔴 Bug", {color:"991B1B",bold:true}), cell("Streaming lead research chat — BROKEN: wrong model name (see §5)") ] }),
          new TableRow({ children: [ cell("/api/outreach/regenerate", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("Re-run Personalization agent, create new versioned OutreachCopy") ] }),
          new TableRow({ children: [ cell("/api/integrations", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("Save/upsert integration — encrypts credentials before storage") ] }),
          new TableRow({ children: [ cell("/api/integrations", {bg: GRAY_BG}), cell("GET"), cell("✅ Working", {color:"166534",bold:true}), cell("List integrations — returns status only, never raw credentials") ] }),
          new TableRow({ children: [ cell("/api/integrations", {bg: GRAY_BG}), cell("DELETE"), cell("✅ Working", {color:"166534",bold:true}), cell("Disconnect integration (sets DISCONNECTED, preserves record)") ] }),
          new TableRow({ children: [ cell("/api/integrations/validate", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("Live validation: makes test API call to Claude/Apollo/Apify/Calendly") ] }),
          new TableRow({ children: [ cell("/api/integrations/gmail/connect", {bg: GRAY_BG}), cell("GET"), cell("✅ Working", {color:"166534",bold:true}), cell("Initiates Gmail OAuth2 flow with offline access + consent screen") ] }),
          new TableRow({ children: [ cell("/api/integrations/gmail/callback", {bg: GRAY_BG}), cell("GET"), cell("✅ Working", {color:"166534",bold:true}), cell("Exchanges OAuth code → refresh token → stores encrypted") ] }),
          new TableRow({ children: [ cell("/api/business-profile", {bg: GRAY_BG}), cell("POST/GET"), cell("✅ Working", {color:"166534",bold:true}), cell("Save/read ICP configuration for the organization") ] }),
          new TableRow({ children: [ cell("/api/organizations", {bg: GRAY_BG}), cell("POST/GET"), cell("✅ Working", {color:"166534",bold:true}), cell("Create / fetch organization (multi-tenant)") ] }),
          new TableRow({ children: [ cell("/api/billing/create-checkout", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("Create Razorpay subscription + customer. Returns key + subId for frontend SDK. Has 503 guard if keys missing.") ] }),
          new TableRow({ children: [ cell("/api/billing/portal", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("Razorpay billing portal redirect for plan management") ] }),
          new TableRow({ children: [ cell("/api/billing/webhook", {bg: GRAY_BG}), cell("POST"), cell("✅ Working", {color:"166534",bold:true}), cell("HMAC SHA256 verified. Handles: activated, charged, updated, halted, cancelled, completed, payment.failed") ] }),
        ]
      }),

      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── SECTION 4: CLAUDE AI ────────────────────────────────────────────────
      sectionTitle("4.  Claude AI — Agent Architecture"),

      body("The platform uses Claude exclusively via direct messages.create() calls — structured prompt in, JSON out. There is NO tool use and NO MCP in the current implementation. Claude acts as the analytical brain; data gathering (Apollo, Apify) is done in Node.js code before being passed into Claude as context.", { before: 60, after: 120 }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 1800, 900, 1200, 3660],
        rows: [
          new TableRow({ children: [ hdr("Agent"), hdr("Model"), hdr("Max Tokens"), hdr("Est. Cost/Call"), hdr("Role") ] }),
          new TableRow({ children: [
            cell("ICP Analyzer", {bg: GRAY_BG, bold: true}),
            cell("claude-haiku-4-5"),
            cell("1,024", {align: AlignmentType.CENTER}),
            cell("~$0.0002", {align: AlignmentType.CENTER}),
            cell("Converts business profile → Apollo search filters, qualification criteria, buyer personas")
          ]}),
          new TableRow({ children: [
            cell("Company Analyzer", {bg: GRAY_BG, bold: true}),
            cell("claude-sonnet-4-6"),
            cell("1,024", {align: AlignmentType.CENTER}),
            cell("~$0.007", {align: AlignmentType.CENTER}),
            cell("Reads company + website content → fit assessment, growth signals, outreach angle, confidence score")
          ]}),
          new TableRow({ children: [
            cell("Qualification", {bg: GRAY_BG, bold: true}),
            cell("claude-haiku-4-5"),
            cell("512", {align: AlignmentType.CENTER}),
            cell("~$0.0003", {align: AlignmentType.CENTER}),
            cell("Scores lead 0–100, qualified/disqualified decision, personalization hooks")
          ]}),
          new TableRow({ children: [
            cell("Personalization", {bg: GRAY_BG, bold: true}),
            cell("claude-sonnet-4-6"),
            cell("1,500", {align: AlignmentType.CENTER}),
            cell("~$0.006", {align: AlignmentType.CENTER}),
            cell("Writes subject line, email body, follow-up 1, follow-up 2 (tailored to lead + angle)")
          ]}),
          new TableRow({ children: [
            cell("Lead Chat", {bg: RED_BG, bold: true}),
            cell("claude-haiku-4-5 (⚠ see §5)"),
            cell("1,024", {align: AlignmentType.CENTER}),
            cell("~$0.001/msg", {align: AlignmentType.CENTER}),
            cell("Streamed conversational Q&A with full lead + research + outreach context injected as system prompt")
          ]}),
        ]
      }),

      body("Cost estimate: 25 leads/run, 60% qualification rate → ~$0.28 in Claude API costs per generation run (billed directly to user\'s Anthropic account — Flowfiy does not charge for Claude usage).", { before: 100, after: 60, italic: true, color: TEXT_MUTED }),

      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── SECTION 5: MCP ──────────────────────────────────────────────────────
      sectionTitle("5.  MCP (Model Context Protocol) — Current Status"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: RED_BG, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "DC2626" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "DC2626" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "DC2626" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "DC2626" },
          },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: "⚠  MCP IS NOT IMPLEMENTED", bold: true, color: "991B1B", size: 26, font: "Inter" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "Claude does NOT use MCP in this codebase. It uses plain messages.create() calls only.", color: "991B1B", size: 18, font: "Inter" })] }),
          ]
        })]})],
      }),

      body(""), // spacer

      body("What MCP Is:", { bold: true, before: 100, after: 40 }),
      body("MCP (Model Context Protocol) is Anthropic\'s standard for giving Claude real-time tools it can call autonomously during a conversation — similar to function calling but with a standardized server protocol. With MCP, Claude would decide when to call a tool (like search Apollo, or scrape a website) instead of your code pre-fetching data before every Claude call.", { before: 0, after: 80 }),

      body("How Claude Is Actually Used Here:", { bold: true, before: 60, after: 40 }),
      body("The system follows a deterministic, code-orchestrated pipeline. Claude receives pre-gathered data as context in a prompt, returns a JSON object, and the worker code moves to the next step. Claude never calls external APIs — it just processes what it is given.", { before: 0, after: 80 }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 480, 5760],
        rows: [
          new TableRow({ children: [ hdr("What happens (actual)"), hdr(""), hdr("What MCP would look like") ] }),
          new TableRow({ children: [
            cell("Worker code calls Apollo API → gets leads", {bg: GRAY_BG}),
            cell("vs", {align: AlignmentType.CENTER, bold: true, color: TEXT_MUTED}),
            cell("Claude autonomously calls an apollo_search MCP tool when it decides to")
          ]}),
          new TableRow({ children: [
            cell("Worker code calls Apify → scrapes website → passes text to Claude", {bg: GRAY_BG}),
            cell("vs", {align: AlignmentType.CENTER, bold: true, color: TEXT_MUTED}),
            cell("Claude autonomously calls a scrape_website MCP tool mid-reasoning")
          ]}),
          new TableRow({ children: [
            cell("Worker enforces: step 1 → step 2 → step 3 → step 4 (always in order)", {bg: GRAY_BG}),
            cell("vs", {align: AlignmentType.CENTER, bold: true, color: TEXT_MUTED}),
            cell("Claude decides the order of tool calls itself during a single long agentic run")
          ]}),
        ]
      }),

      body("Why NOT using MCP is the right decision for this product:", { bold: true, before: 120, after: 60 }),

      bullet("Determinism: The current pipeline always executes the same 4 steps in the same order. MCP would introduce non-determinism — Claude might call tools in unexpected sequences."),
      bullet("Cost control: Each step uses the cheapest model appropriate (Haiku for classification, Sonnet for generation). An MCP agent would likely use one model for everything."),
      bullet("Error isolation: If Company Analysis fails for one lead, that lead is marked DISQUALIFIED and processing continues. An agentic MCP run would be harder to recover mid-stream."),
      bullet("Latency: Pre-fetching data (Apollo search, Apify scrape) and passing it to Claude in one prompt is faster than Claude calling external tools with round-trips."),
      bullet("Auditability: Every step writes structured data to the DB. An MCP agent\'s reasoning is opaque."),

      body("Verdict: The current architecture is correct for a production pipeline. MCP would only add value if you wanted Claude to autonomously decide which leads to research deeper, call live web search during a conversation, or handle open-ended research tasks where the steps aren\'t known in advance.", { before: 100, after: 60, italic: true, color: TEXT_MUTED }),

      new Paragraph({ pageBreakBefore: true, children: [] }),

      // ── SECTION 6: BUGS ─────────────────────────────────────────────────────
      sectionTitle("6.  Bugs & Issues Found"),

      // Bug 1
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: RED_BG, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 3, color: "DC2626" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 6, color: "DC2626" }, right: { style: BorderStyle.NONE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "🔴  BUG 1 — Wrong Model Name in Chat Route  (BREAKS LEAD CHAT FOR ALL USERS)", bold: true, color: "991B1B", size: 20, font: "Inter" })] }),
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "File: src/app/api/leads/chat/route.ts  |  Line: 104", color: "991B1B", size: 17, font: "Inter", italics: true })] }),
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: 'Bad:    model: "claude-haiku-4-5-20251001"   ← not a valid Anthropic model ID', color: "991B1B", size: 17, font: "Courier New" })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: 'Fix:    model: "claude-haiku-4-5"', color: "166534", size: 17, font: "Courier New" })] }),
          ]
        })]})],
      }),

      new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),

      // Bug 2
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: RED_BG, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 3, color: "DC2626" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 6, color: "DC2626" }, right: { style: BorderStyle.NONE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "🔴  BUG 2 — Apollo Industry Filter Silently Discarded  (INDUSTRY TARGETING BROKEN)", bold: true, color: "991B1B", size: 20, font: "Inter" })] }),
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "File: src/integrations/apollo.ts  |  Line: 38", color: "991B1B", size: 17, font: "Inter", italics: true })] }),
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "organization_industry_tag_ids: []  ← hardcoded empty — industries from ICP analysis are NEVER sent to Apollo.", color: "991B1B", size: 17, font: "Courier New" })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Fix: Map ICP industry strings to Apollo tag IDs, or add a person_industry_tag_name free-text filter.", color: "166534", size: 17, font: "Inter" })] }),
          ]
        })]})],
      }),

      new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),

      // Issue 3
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: AMBER_BG, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 3, color: "D97706" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 6, color: "D97706" }, right: { style: BorderStyle.NONE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "🟡  ISSUE 3 — Generation Count Race Condition", bold: true, color: "92400E", size: 20, font: "Inter" })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Quota checked at enqueue time, incremented after worker finishes. Multiple concurrent job triggers can all pass the quota check before any job completes, allowing over-generation. Fix: reserve quota atomically (Redis INCR) at enqueue time.", color: "92400E", size: 17, font: "Inter" })] }),
          ]
        })]})],
      }),

      new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),

      // Issue 4
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: AMBER_BG, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 3, color: "D97706" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 6, color: "D97706" }, right: { style: BorderStyle.NONE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "🟡  ISSUE 4 — Worker Not Auto-Deployed on Vercel", bold: true, color: "92400E", size: 20, font: "Inter" })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "src/workers/index.ts is a standalone Node.js process — it does NOT run on Vercel. If not separately deployed on Railway with all environment variables, all queued jobs will pile up in Redis silently and never execute. Users will see lead lists stuck at QUEUED forever.", color: "92400E", size: 17, font: "Inter" })] }),
          ]
        })]})],
      }),

      new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }),

      // Issue 5
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          shading: { fill: AMBER_BG, type: ShadingType.CLEAR },
          borders: { top: { style: BorderStyle.SINGLE, size: 3, color: "D97706" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 6, color: "D97706" }, right: { style: BorderStyle.NONE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "🟡  ISSUE 5 — Razorpay Webhook Not Idempotent", bold: true, color: "92400E", size: 20, font: "Inter" })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun({ text: "Razorpay can retry webhooks if no 200 is received quickly. subscription.activated could fire twice, creating duplicate audit logs and redundant DB writes. Fix: store Razorpay event IDs in DB and skip if already processed.", color: "92400E", size: 17, font: "Inter" })] }),
          ]
        })]})],
      }),

      new Paragraph({ spacing: { before: 200, after: 0 }, children: [] }),
      divider(),

      // ── FOOTER NOTE ─────────────────────────────────────────────────────────
      body("End of Report", { bold: true, color: TEXT_MUTED, before: 120, after: 40 }),
      body("Confidential — Flowfiy Internal Use Only", { italic: true, color: TEXT_MUTED, size: 16 }),
    ]
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = "E:/CodeX Developemt/AI_Sales_outbound_system/Flowfiy_Backend_Workflow.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("DONE: " + outPath);
}).catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
