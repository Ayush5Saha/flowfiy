/* Minimal, dependency-light .docx reader/updater (pure JS via adm-zip).
 * Python/pandoc aren't available in this environment, so this fills in for
 * reading docx text and appending a well-formed "update" section.
 *
 *   node scripts/docx-tool.js read <file.docx>
 *   node scripts/docx-tool.js append <file.docx> <section.json>
 *
 * section.json shape:
 *   { "title": "Heading text",
 *     "blocks": [ {"h":"Sub-heading"} | {"p":"Paragraph text"} | {"b":"Bullet text"} ] }
 *
 * Append reuses the document's OWN Heading1/Heading2/Normal style ids and the
 * first bullet numbering id it can find, so added content matches the doc.
 */
"use strict";
const AdmZip = require("adm-zip");
const fs = require("fs");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/'/g, "&#x2019;") // straight apostrophe → smart
   .replace(/"/g, "&quot;");

function readDocXml(file) {
  const zip = new AdmZip(file);
  const entry = zip.getEntry("word/document.xml");
  if (!entry) throw new Error("no word/document.xml in " + file);
  return { zip, xml: zip.readAsText(entry) };
}

function toText(xml) {
  // paragraphs → lines; pull <w:t> runs, drop the rest.
  return xml
    .split(/<\/w:p>/)
    .map((p) => {
      const runs = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]);
      return runs.join("")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#x2019;/g, "’").replace(/&#x2018;/g, "‘")
        .replace(/&#x201C;/g, "“").replace(/&#x201D;/g, "”");
    })
    .filter((l) => l.trim().length)
    .join("\n");
}

function discoverStyles(xml) {
  const has = (id) => new RegExp(`w:val="${id}"`).test(xml);
  // Prefer real heading styles if the doc uses them.
  const h1 =
    (has("Heading1") && "Heading1") || (has("Heading2") && "Heading2") || null;
  const h2 =
    (has("Heading2") && "Heading2") || (has("Heading3") && "Heading3") || h1;
  // first bullet list numId, if any
  const numMatch = xml.match(/<w:numId w:val="(\d+)"\/>/);
  const numId = numMatch ? numMatch[1] : null;
  return { h1, h2, numId };
}

function para({ text, styleId, bold, sizeHalfPt, numId }) {
  const pPr = [];
  if (styleId) pPr.push(`<w:pStyle w:val="${styleId}"/>`);
  if (numId) pPr.push(`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr>`);
  if (!styleId) pPr.push(`<w:spacing w:before="120" w:after="60"/>`);
  const rPr = [];
  if (bold) rPr.push("<w:b/>");
  if (sizeHalfPt) rPr.push(`<w:sz w:val="${sizeHalfPt}"/><w:szCs w:val="${sizeHalfPt}"/>`);
  const rPrXml = rPr.length ? `<w:rPr>${rPr.join("")}</w:rPr>` : "";
  const pPrXml = pPr.length ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${pPrXml}<w:r>${rPrXml}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function buildSection(sec, st) {
  const out = [];
  // section title — use the doc's H1 style, else a bold 16pt fallback
  out.push(para({ text: sec.title, styleId: st.h1, bold: !st.h1, sizeHalfPt: st.h1 ? null : 32 }));
  for (const blk of sec.blocks) {
    if (blk.h != null) out.push(para({ text: blk.h, styleId: st.h2, bold: !st.h2, sizeHalfPt: st.h2 ? null : 26 }));
    else if (blk.b != null) out.push(para({ text: blk.b, styleId: null, numId: st.numId, bold: false }));
    else if (blk.p != null) out.push(para({ text: blk.p }));
  }
  return out.join("");
}

const [, , cmd, file, secPath] = process.argv;
if (cmd === "read") {
  const { xml } = readDocXml(file);
  console.log(toText(xml));
} else if (cmd === "append") {
  const sec = JSON.parse(fs.readFileSync(secPath, "utf8"));
  const { zip, xml } = readDocXml(file);
  const st = discoverStyles(xml);
  const block = buildSection(sec, st);
  let newXml;
  let at = -1;
  if (sec.beforeMarker) {
    // Insert immediately before the paragraph that contains the marker text.
    const mi = xml.indexOf(sec.beforeMarker);
    if (mi !== -1) {
      const starts = [...xml.matchAll(/<w:p[ >]/g)].map((m) => m.index).filter((i) => i < mi);
      if (starts.length) at = starts[starts.length - 1];
    }
  }
  if (at === -1) {
    // Fallback: before the final body <w:sectPr> (must stay last), else before </w:body>.
    const lastSect = xml.lastIndexOf("<w:sectPr");
    if (lastSect !== -1 && lastSect > xml.lastIndexOf("</w:p>")) at = lastSect;
  }
  if (at !== -1) newXml = xml.slice(0, at) + block + xml.slice(at);
  else newXml = xml.replace("</w:body>", block + "</w:body>");
  if (newXml === xml) throw new Error("insertion point not found");
  zip.updateFile("word/document.xml", Buffer.from(newXml, "utf8"));
  zip.writeZip(file);
  console.log(`appended "${sec.title}" → ${file}  (styles: h1=${st.h1} h2=${st.h2} bulletNumId=${st.numId})`);
} else {
  console.error("usage: docx-tool.js read|append <file.docx> [section.json]");
  process.exit(1);
}
