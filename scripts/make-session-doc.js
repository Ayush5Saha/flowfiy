/* Generates a concise one-page Flowfiy work-session summary .docx. */
"use strict";
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat,
  AlignmentType, BorderStyle,
} = require("docx");

const IND = "6D28D9"; // Flowfiy violet

const H = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const P = (t) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun(t)] });
const B = (runs) =>
  new Paragraph({
    numbering: { reference: "b", level: 0 },
    spacing: { after: 40 },
    children: Array.isArray(runs) ? runs : [new TextRun(runs)],
  });
const lead = (label, rest) => [new TextRun({ text: label + " ", bold: true }), new TextRun(rest)];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 21 } } }, // ~10.5pt
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal",
        run: { size: 40, bold: true, font: "Arial", color: "111111" },
        paragraph: { spacing: { after: 40 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: IND },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{
      reference: "b",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 460, hanging: 260 } } } }],
    }],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children: [
      new Paragraph({ style: "Title", children: [new TextRun("Flowfiy — Work Session Summary")] }),
      new Paragraph({
        spacing: { after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: IND, space: 4 } },
        children: [new TextRun({ text: "13 June 2026  ·  context recap (concise)", color: "666666", size: 18 })],
      }),

      H("1. Dev environment (after PC reformat)"),
      B(lead("Installed portably (no admin):", "Node.js 24, npm 11, GitHub CLI — under %LOCALAPPDATA%\\Programs, added to PATH.")),
      B(lead("GitHub auth:", "gh web-login as Ayush5Saha; git push working again (repo Ayush5Saha/flowfiy).")),
      B(lead("Verified:", "deps reinstalled, Prisma generated, type-check clean, dev server boots.")),

      H("2. Launch video (motion graphics)"),
      B(lead("Built:", "a code-rendered 72s / 1080p60 launch film — 11 animated scenes + synthesized soundtrack.")),
      B(lead("Output:", "launch-video/flowfiy-launch.mp4 (H.264, ~17 MB). Render pipeline: canvas frames → ffmpeg.")),

      H("3. Onboarding — two-path ICP capture"),
      B(lead("Added:", "users define their business profile / ICP either manually or by importing from their website.")),
      B(lead("Website import:", "SSRF-guarded scraper → Claude Haiku profile-extractor → draft that prefills the form (never auto-saves).")),
      B(lead("Status:", "feature-flagged OFF (“Coming soon”) until the Anthropic API key is funded — unlock = one boolean in src/lib/feature-flags.ts.")),

      H("4. Blog — interconnected posts"),
      B(lead("Shipped & pushed:", "markdownToHtml renders [text](/blog/slug) as internal links; batch publisher for cross-linked SEO posts.")),

      H("5. Landing page v2 (LIVE)"),
      B(lead("Rebuilt the homepage", "as an awwwards-grade motion-graphics page — now live at /.")),
      B(lead("Tech:", "raw WebGL shader hero (cursor-reactive), Lenis smooth-scroll, custom cursor, framer-motion system.")),
      B(lead("Sections:", "pinned scroll story, horizontal scroll-snap features, proof stats, 24/7 interlude, pricing (geo/INR kept), testimonials, CTA.")),

      H("6. Repo / git"),
      B(lead("Fixed", "a corrupt 3.4 GB git pack (stray render frames); .git restored to 37 MB, all history intact; added .gitignore for launch-video/.")),
      B(lead("Branches:", "feat/landing-v2-revamp backup; landing merged + live on master.")),

      H("7. Docs updated"),
      B(lead("Appended", "a “June 2026” update section to Backend_Workflow_v2, Architecture_v2, and Tech_Stack_v3.")),
      B(lead("Pending:", "Feature_List_updated and others were open in Word (locked) — close Word to update them.")),

      H("8. Explored, not done"),
      B(lead("Meta Ads:", "discussed connecting via Marketing API; user chose not to connect. No account linked.")),

      new Paragraph({
        spacing: { before: 240 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
        children: [new TextRun({ text: "Open items: top up Anthropic credits (unlocks website-import + AI pipeline); optionally update locked docs and the User Guide.", italics: true, size: 18, color: "666666" })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Flowfiy_Session_Summary.docx", buf);
  console.log("wrote Flowfiy_Session_Summary.docx (" + buf.length + " bytes)");
});
