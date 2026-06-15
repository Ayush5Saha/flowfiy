// Pure, dependency-free markdown → HTML renderer for blog content.
// Lives in its own module (no Prisma import) so it can be shared by server
// pages AND client components like the admin editor's live preview.

export function slugifyBlogTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Inline formatting: code, links, bold, italic. Runs on already-escaped text.
function renderInline(value: string) {
  let s = escapeHtml(value);

  // Inline code `code`
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links [text](url) — allow only http(s) and site-internal paths
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, url: string) => {
    const safe = /^(https?:\/\/|\/)/.test(url) ? url : "#";
    const external = /^https?:\/\//.test(safe);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${safe}"${attrs}>${text}</a>`;
  });

  // Bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic _text_
  s = s.replace(/_(.+?)_/g, "<em>$1</em>");

  return s;
}

/**
 * Convert a markdown string into the HTML consumed by `.blog-content`.
 * Supports: # / ## / ### headings, unordered (-, *) and ordered (1.) lists,
 * blockquotes (>), horizontal rules (---), and inline code/links/bold/italic.
 */
export function markdownToHtml(markdown: string) {
  const lines = (markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];
  let quote: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${paragraph.map(renderInline).join("<br />")}</p>`);
    paragraph = [];
  }
  function flushUl() {
    if (ul.length === 0) return;
    html.push(`<ul>${ul.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    ul = [];
  }
  function flushOl() {
    if (ol.length === 0) return;
    html.push(`<ol>${ol.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
    ol = [];
  }
  function flushQuote() {
    if (quote.length === 0) return;
    html.push(`<blockquote>${quote.map(renderInline).join("<br />")}</blockquote>`);
    quote = [];
  }
  function flushAll() {
    flushParagraph();
    flushUl();
    flushOl();
    flushQuote();
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushAll();
      html.push("<hr />");
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushAll();
      html.push(`<h3>${renderInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flushAll();
      html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flushAll();
      html.push(`<h1>${renderInline(line.slice(2))}</h1>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushParagraph();
      flushUl();
      flushOl();
      quote.push(line.slice(2));
      continue;
    }

    // Ordered list: "1. item"
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushUl();
      flushQuote();
      ol.push(orderedMatch[1]);
      continue;
    }

    // Unordered list: "- item" or "* item"
    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushOl();
      flushQuote();
      ul.push(unorderedMatch[1]);
      continue;
    }

    // Paragraph text
    flushUl();
    flushOl();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();
  return html.join("");
}
