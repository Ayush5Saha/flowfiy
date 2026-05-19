const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak, Header, Footer, LevelFormat
} = require("C:/Users/ADMIN/AppData/Roaming/npm/node_modules/docx");

const bd = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bds = { top: bd, bottom: bd, left: bd, right: bd };
const hbd = { style: BorderStyle.SINGLE, size: 1, color: "1E3A5F" };
const hbds = { top: hbd, bottom: hbd, left: hbd, right: hbd };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1E3A5F" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "2E6DA4" })] });
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

function th(text, w) {
  return new TableCell({ borders: hbds, width: { size: w, type: WidthType.DXA },
    shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
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

const compTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2000,1840,1840,1840,1840],
  rows: [
    new TableRow({ children: [th("Feature",2000),th("Flowfiy",1840),th("Clay",1840),th("Apollo",1840),th("Instantly",1840)] }),
    new TableRow({ children: [td("AI Research Pipeline",2000,"F0F4F8"),td("5-Agent Claude",1840,"E8F5E9",true),td("GPT-4 (1 agent)",1840),td("Basic AI scoring",1840),td("None",1840)] }),
    new TableRow({ children: [td("BYOK Model",2000,"F0F4F8"),td("Yes (~0 COGS)",1840,"E8F5E9",true),td("No (absorbs cost)",1840),td("No",1840),td("No",1840)] }),
    new TableRow({ children: [td("Starting Price",2000,"F0F4F8"),td("$49/mo",1840,"E8F5E9",true),td("$149/mo",1840),td("$49/mo",1840),td("$37/mo",1840)] }),
    new TableRow({ children: [td("Gross Margin",2000,"F0F4F8"),td("~95%+",1840,"E8F5E9",true),td("~50-60%",1840),td("~70%",1840),td("~65%",1840)] }),
    new TableRow({ children: [td("ICP Analysis Agent",2000,"F0F4F8"),td("Dedicated Agent",1840,"E8F5E9",true),td("Manual + templates",1840),td("Limited",1840),td("None",1840)] }),
    new TableRow({ children: [td("Deep Company Research",2000,"F0F4F8"),td("Yes (Apify scraping)",1840,"E8F5E9",true),td("Partial",1840),td("No",1840),td("No",1840)] }),
    new TableRow({ children: [td("Multi-tenant / Agency",2000,"F0F4F8"),td("Yes (built-in RLS)",1840,"E8F5E9",true),td("Yes",1840),td("Limited",1840),td("No",1840)] }),
  ]
});

const rvRows = [
  ["Month 1","5","2","0","30","$345","$0","$345","$4.1K"],
  ["Month 2","12","5","1","60","$1,186","$17","$1,169","$14K"],
  ["Month 3","22","9","2","100","$2,274","$58","$2,216","$26.6K"],
  ["Month 4","35","14","3","150","$3,689","$111","$3,578","$42.9K"],
  ["Month 5","50","20","5","200","$5,395","$179","$5,216","$62.6K"],
  ["Month 6","70","28","7","280","$7,622","$261","$7,361","$88.3K"],
  ["Month 7","95","38","10","370","$10,475","$368","$10,107","$121.3K"],
  ["Month 8","125","50","14","470","$13,961","$505","$13,456","$161.5K"],
  ["Month 9","160","65","18","590","$18,145","$673","$17,472","$209.7K"],
  ["Month 10","200","80","23","720","$22,870","$874","$21,996","$263.9K"],
  ["Month 11","245","98","29","880","$28,373","$1,100","$27,273","$327.3K"],
  ["Month 12","295","118","36","1050","$34,608","$1,364","$33,244","$398.9K"],
];
const cw = [1560,1040,1040,1040,1040,1040,1040,1040,520];
const revenueTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: cw,
  rows: [
    new TableRow({ children: ["Month","Starter","Growth","Agency","Free","New MRR","Churn","Net MRR","ARR"].map((h,i)=>th(h,cw[i])) }),
    ...rvRows.map((row,ri)=>new TableRow({ children: row.map((c,ci)=>td(c,cw[ci],ri%2===0?"F7F9FC":null,ci===7,true)) }))
  ]
});

const budgetTable = new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [3360,1800,1800,2400],
  rows: [
    new TableRow({ children: [th("Category",3360),th("Month 1-3",1800),th("Month 4-9",1800),th("Month 10-12",2400)] }),
    new TableRow({ children: [td("Content & SEO (blog, LinkedIn, YouTube)",3360,"F0F4F8"),td("$200/mo",1800),td("$500/mo",1800),td("$800/mo",2400)] }),
    new TableRow({ children: [td("Paid Ads (Google + LinkedIn)",3360),td("$0",1800),td("$500/mo",1800),td("$1,500/mo",2400)] }),
    new TableRow({ children: [td("Community & Partnerships",3360,"F0F4F8"),td("$100/mo",1800),td("$300/mo",1800),td("$500/mo",2400)] }),
    new TableRow({ children: [td("Affiliate Program (20% recurring)",3360),td("$0",1800),td("$400/mo",1800),td("$1,200/mo",2400)] }),
    new TableRow({ children: [td("Influencer & Cold Outreach Tools",3360,"F0F4F8"),td("$0",1800),td("$200/mo",1800),td("$400/mo",2400)] }),
    new TableRow({ children: [td("Total Monthly Marketing Spend",3360,null,true),td("~$300/mo",1800,null,true),td("~$1,900/mo",1800,null,true),td("~$4,400/mo",2400,null,true)] }),
  ]
});

const doc = new Document({
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: "2E6DA4" }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1E3A5F", space: 4 } }, children: [new TextRun({ text: "Flowfiy -- Confidential & Proprietary", size: 18, font: "Arial", color: "666666" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18, font: "Arial", color: "999999" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "999999" }), new TextRun({ text: " | Flowfiy Marketing & Growth Plan 2025-2026", size: 18, font: "Arial", color: "999999" })] })] }) },
    children: [
      spacer(), spacer(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 120 }, children: [new TextRun({ text: "FLOWFIY", bold: true, size: 64, font: "Arial", color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Marketing & Growth Plan 2025-2026", bold: true, size: 36, font: "Arial", color: "2E6DA4" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Go-to-Market Strategy, Channel Playbook & 12-Month Revenue Model", size: 24, font: "Arial", color: "555555" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, children: [new TextRun({ text: "The AI Outbound Platform That Doesn't Tax Your API", bold: true, size: 28, font: "Arial", color: "1E7A3A" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 480 }, children: [new TextRun({ text: "Prepared by: Ayush Saha, Founder  |  May 2026  |  Pre-Seed Stage", size: 20, font: "Arial", color: "777777" })] }),
      new Paragraph({ children: [new PageBreak()] }),

      h1("1. Executive Summary"),
      para("Flowfiy is a Claude-powered AI outbound sales operating system built for the global B2B market. Agencies, consultants, SaaS founders, and SDR teams use Flowfiy to research leads, qualify prospects, and generate hyper-personalized email copy -- all through a 5-agent AI pipeline orchestrated on their own Anthropic API key (BYOK)."),
      spacer(),
      para("Unlike competitors that absorb API costs, Flowfiy's BYOK model achieves ~95% gross margin from day one. With infrastructure costs under $50/month and a $49-$249/month pricing ladder, Flowfiy reaches profitability with fewer than 20 paying subscribers."),
      spacer(),
      h2("Key 12-Month Targets"),
      bullet("Month 3: $2,200 MRR, 35+ paid subscribers"),
      bullet("Month 6: $7,400 MRR, 105+ paid subscribers"),
      bullet("Month 9: $17,500 MRR, 245+ paid subscribers"),
      bullet("Month 12: $33,000+ MRR, 450+ paid subscribers -- $400K ARR run-rate"),
      bullet("CAC target: <$80 blended | LTV:CAC ratio: >15:1"),
      spacer(),

      h1("2. Ideal Customer Profile (ICP)"),
      h2("Segment A -- Outbound Agencies & Lead Gen Agencies"),
      bullet("Size: 1-20 person agencies running outbound for clients"),
      bullet("Pain: High cost of SDR headcount + Clay/Apollo subscriptions per client seat"),
      bullet("Job title: Founder, Head of Growth, Agency Owner"),
      bullet("Geography: US, UK, India, APAC"),
      bullet("Willingness to pay: $99-$249/month (Growth/Agency tier)"),
      spacer(),
      h2("Segment B -- Founder-Led Sales (SaaS / Service Startups)"),
      bullet("Size: Seed-Series A startups, 2-50 employees"),
      bullet("Pain: No sales team yet; founder does outbound manually"),
      bullet("Job title: CEO/Founder, Head of Sales"),
      bullet("Geography: Global (English-speaking markets primary)"),
      bullet("Willingness to pay: $49-$99/month (Starter/Growth tier)"),
      spacer(),
      h2("Segment C -- Individual SDRs & RevOps Professionals"),
      bullet("Pain: Quota pressure + repetitive manual research and personalization"),
      bullet("Job title: SDR, BDR, Account Executive, RevOps Manager"),
      bullet("Geography: US, India, UK"),
      bullet("Willingness to pay: $49/month (Starter tier)"),
      spacer(),

      h1("3. Competitive Positioning"),
      para("Flowfiy occupies the white space between cheap-but-dumb (Instantly, Smartlead) and powerful-but-expensive (Clay). Positioning: Clay-level intelligence at Apollo-level pricing -- powered by your own Claude key."),
      spacer(),
      compTable,
      spacer(),

      h1("4. Go-to-Market Strategy"),
      h2("Phase 1: Foundation (Month 1-2) -- First 25 Paying Customers"),
      bullet("Direct founder outreach: 200 personalized cold DMs/week on LinkedIn to agency owners and founders"),
      bullet("Free tier as PLG funnel: 50 lifetime generations drives organic sign-up; upgrade triggered at limit"),
      bullet("Product Hunt launch: Coordinate upvotes, Ship It post, and demo video on launch day"),
      bullet("Reddit seeding: Case studies in r/sales, r/Entrepreneur, r/SaaS, r/LeadGeneration"),
      bullet("AppSumo listing: Lifetime deal to generate early adopter reviews and initial MRR"),
      spacer(),
      h2("Phase 2: Traction (Month 3-6) -- $5K-$10K MRR"),
      bullet("LinkedIn content flywheel: 3 posts/week (founder story, product demos, outbound tips)"),
      bullet("YouTube: 2 videos/week -- Outbound with AI series targeting SDR and agency keywords"),
      bullet("Affiliate program: 20% recurring commission to power users and agency owners"),
      bullet("SEO blog: 4 articles/month targeting clay alternative, ai outbound tool, cold email software"),
      spacer(),
      h2("Phase 3: Scale (Month 7-12) -- $15K-$35K MRR"),
      bullet("Paid acquisition: Google Ads + LinkedIn Ads targeting agency decision-makers"),
      bullet("Agency white-label program: Custom domain + branding; $499/mo add-on"),
      bullet("Eat own dog food: Use Flowfiy pipeline to prospect for new Flowfiy customers"),
      bullet("V2 features: LinkedIn + WhatsApp outreach drives upsell to Agency tier"),
      bullet("PR: TechCrunch, HN Show HN, TLDR Newsletter, The Hustle"),
      spacer(),

      h1("5. Content & Distribution Strategy"),
      h2("Content Pillars"),
      bullet("Education: How-to outbound, SDR tips, cold email teardowns"),
      bullet("Social Proof: Customer wins, before/after reply rates, case studies"),
      bullet("Transparency: Build-in-public metrics (MRR, churn, feature releases)"),
      bullet("Thought Leadership: AI+Sales future, BYOK SaaS economics, GTM strategy"),
      spacer(),
      h2("Channel Targets"),
      bullet("LinkedIn: 3 posts/week. Target: 10,000 followers by Month 12."),
      bullet("YouTube: 2 videos/week. Target: 1,000 subscribers by Month 6."),
      bullet("Email Newsletter: Weekly Flowfiy Insights for nurture sequence."),
      bullet("SEO Blog: 4 articles/month. Keywords: clay alternative, ai cold email, BYOK sales automation."),
      spacer(),

      h1("6. Pricing & Packaging"),
      bullet("Free: $0 -- 50 lifetime generations, 1 seat. PLG hook."),
      bullet("Starter: $49/month -- 500 generations/month, 1 seat."),
      bullet("Growth: $99/month -- 2,000 generations/month, 5 seats."),
      bullet("Agency: $249/month -- Unlimited generations, 20 seats."),
      spacer(),
      para("Break-even: 15 Starter subscribers covers all infra. ~95% gross margin from day one.", { bold: true }),
      spacer(),

      h1("7. 12-Month Revenue Model"),
      para("Assumptions: 3% monthly churn, 40% free-to-paid conversion within 90 days, organic growth Months 1-4, paid acquisition from Month 5."),
      spacer(),
      revenueTable,
      spacer(),

      h1("8. Unit Economics"),
      bullet("ARPU (blended): ~$75/month (Starter 60%, Growth 30%, Agency 10%)"),
      bullet("Gross Margin: ~95% (BYOK eliminates Claude cost; ~$0.002 infra per generation)"),
      bullet("Blended CAC target: <$80"),
      bullet("LTV (24-month, 3% churn): ~$2,500"),
      bullet("LTV:CAC ratio: >15:1 blended, >25:1 organic"),
      bullet("Payback period: <2 months"),
      bullet("Break-even: 15 Starter subscribers ($735/mo > $50 infra)"),
      spacer(),

      h1("9. Key Metrics & OKRs"),
      h2("Growth KPIs by Quarter"),
      bullet("Q1: 25+ paid subscribers, $2,200+ MRR, <5% monthly churn"),
      bullet("Q2: 100+ paid subscribers, $7,500+ MRR, NPS > 40"),
      bullet("Q3: 245+ paid subscribers, $17,500+ MRR, CAC < $80"),
      bullet("Q4: 450+ paid subscribers, $33,000+ MRR, $400K ARR run-rate"),
      spacer(),
      h2("Marketing KPIs"),
      bullet("LinkedIn followers: 500 (M3) | 2,000 (M6) | 5,000 (M9) | 10,000 (M12)"),
      bullet("Organic traffic: 500/mo (M3) | 2,000/mo (M6) | 5,000/mo (M9)"),
      bullet("Email list: 500 (M3) | 2,000 (M6) | 5,000 (M9)"),
      spacer(),

      h1("10. Marketing Budget Allocation"),
      budgetTable,
      spacer(),
      para("Total 12-month marketing spend: ~$28,000. Organic channels dominate Months 1-6; paid spend activates after PMF confirmation (NPS > 40, <5% churn)."),
      spacer(),

      h1("11. Risk Factors & Mitigation"),
      bullet("Anthropic API pricing changes: Add OpenAI/Gemini support as fallback in V2."),
      bullet("Clay adds BYOK: Compete on price ($49 vs $149 floor) and ease of onboarding."),
      bullet("Low free-to-paid conversion: In-app upgrade prompts at 80% usage + email nurture."),
      bullet("Gmail deliverability issues: Built-in warm-up guidance + Instantly integration."),
      bullet("Churn > 5%/month: Onboarding automation + first 10 leads in 10 minutes benchmark."),
      spacer(),

      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 120 }, children: [new TextRun({ text: "Ready to Disrupt the $4.8B Outbound Sales Market", bold: true, size: 32, font: "Arial", color: "1E3A5F" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 480 }, children: [new TextRun({ text: "Flowfiy  |  ayush@flowfiy.com  |  flowfiy.com", size: 22, font: "Arial", color: "555555" })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Flowfiy_Marketing_Growth_Plan.docx", buffer);
  console.log("SUCCESS: Flowfiy_Marketing_Growth_Plan.docx created (" + buffer.length + " bytes)");
}).catch(err => { console.error("ERROR:", err.message); process.exit(1); });
