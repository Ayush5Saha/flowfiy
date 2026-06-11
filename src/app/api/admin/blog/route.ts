import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { slugifyBlogTitle } from "@/lib/blog";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : false;
}

const blogPostSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().min(20).max(500),
  category: z.string().trim().min(2).max(80),
  content: z.string().trim().min(20),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  authorName: z.string().trim().min(2).max(80).default("Flowfiy"),
  readTime: z.string().trim().min(3).max(30).default("5 min read"),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().trim().max(180).optional().nullable(),
  metaDescription: z.string().trim().max(300).optional().nullable(),
});

function normalizeSlug(title: string, slug?: string) {
  const normalized = slugifyBlogTitle(slug || title);
  return normalized || slugifyBlogTitle(title);
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = blogPostSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid blog post", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const slug = normalizeSlug(data.title, data.slug);
  const publishedAt = data.status === "PUBLISHED" ? new Date() : null;

  try {
    if (data.isFeatured && data.status === "PUBLISHED") {
      await prisma.blogPost.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const post = await prisma.blogPost.create({
      data: {
        ...data,
        slug,
        publishedAt,
        seoTitle: data.seoTitle || null,
        metaDescription: data.metaDescription || null,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create blog post failed", error);
    return NextResponse.json(
      { error: "Create failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
