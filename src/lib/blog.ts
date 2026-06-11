import { prisma } from "@/lib/prisma";

export type BlogPostCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  featured: boolean;
};

export type PublishedBlogPost = BlogPostCard & {
  authorName: string;
  content: string;
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export const staticBlogPosts: BlogPostCard[] = [
  {
    slug: "how-ai-agents-replace-sdrs",
    title: "How 5 AI Agents Are Replacing the Entire SDR Stack in 2026",
    excerpt:
      "Manual SDR work costs $80k-$120k per rep per year. AI agents do the same work in seconds - at near-zero marginal cost. Here's how the transition actually works.",
    category: "AI & Automation",
    readTime: "8 min read",
    date: "May 10, 2026",
    featured: true,
  },
  {
    slug: "cold-email-personalization-2026",
    title: "Why Personalization Depth Beats Volume: Cold Email in 2026",
    excerpt:
      "The era of spray-and-pray is over. We analyzed 50,000 cold emails and found one signal that predicts reply rate better than anything else: research depth per lead.",
    category: "Cold Email",
    readTime: "6 min read",
    date: "May 5, 2026",
    featured: false,
  },
  {
    slug: "byok-ai-pricing-explained",
    title: "BYOK AI Pricing: Why We Don't Charge Per Lead Generation",
    excerpt:
      "Most AI sales tools charge $0.50-$2.00 per lead. We charge $0. Here's the math behind BYOK (Bring Your Own Key) and why it's the only honest model for AI SaaS.",
    category: "Product",
    readTime: "5 min read",
    date: "Apr 28, 2026",
    featured: false,
  },
];

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatPostDate(date: Date | null) {
  return date ? dateFormatter.format(date) : "Draft";
}

function mapPublishedPost(post: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  isFeatured: boolean;
  authorName: string;
  content: string;
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
}): PublishedBlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    readTime: post.readTime,
    date: formatPostDate(post.publishedAt ?? post.updatedAt),
    featured: post.isFeatured,
    authorName: post.authorName,
    content: post.content,
    seoTitle: post.seoTitle,
    metaDescription: post.metaDescription,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  };
}

export async function getPublishedBlogPosts(): Promise<PublishedBlogPost[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return posts.map(mapPublishedPost);
  } catch (error) {
    console.error("Failed to load published blog posts", error);
    return [];
  }
}

export async function getBlogCards(): Promise<BlogPostCard[]> {
  const publishedPosts = await getPublishedBlogPosts();
  const publishedSlugs = new Set(publishedPosts.map((post) => post.slug));

  return [
    ...publishedPosts,
    ...staticBlogPosts.filter((post) => !publishedSlugs.has(post.slug)),
  ];
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<PublishedBlogPost | null> {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
    });

    return post ? mapPublishedPost(post) : null;
  } catch (error) {
    console.error(`Failed to load blog post ${slug}`, error);
    return null;
  }
}

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

function renderInline(value: string) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${paragraph.map(renderInline).join("<br />")}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      html.push(`<h3>${renderInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      html.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      html.push(`<h2>${renderInline(line.slice(2))}</h2>`);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return html.join("");
}
