import { prisma } from "@/lib/prisma";
import { markdownToHtml, slugifyBlogTitle } from "@/lib/blog-markdown";

// Re-exported for existing importers (e.g. the blog post page + admin editor).
export { markdownToHtml, slugifyBlogTitle };

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
    slug: "how-to-set-up-flowfiy",
    title: "How to Set Up Flowfiy: The Complete 4-Step Setup Guide",
    excerpt:
      "From sign-up to your first AI-personalized outreach in minutes. Subscribe, set your business profile, describe the leads you want in plain English, then review and send from Gmail — no API keys, every step explained.",
    category: "Guides",
    readTime: "7 min read",
    date: "Jun 15, 2026",
    featured: false,
  },
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
    title: "Why We Removed API Keys: Simple Credit Pricing",
    excerpt:
      "We used to ask you to bring your own API keys. Now the AI and every data source are fully managed and you pay one simple price: $50/month for 400 credits. Here's why we made the switch.",
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

