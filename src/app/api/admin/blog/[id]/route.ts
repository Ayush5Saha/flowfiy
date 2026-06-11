import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { slugifyBlogTitle } from "@/lib/blog";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
  status: z.enum(["DRAFT", "PUBLISHED"]),
  authorName: z.string().trim().min(2).max(80),
  readTime: z.string().trim().min(3).max(30),
  isFeatured: z.boolean(),
  seoTitle: z.string().trim().max(180).optional().nullable(),
  metaDescription: z.string().trim().max(300).optional().nullable(),
});

function normalizeSlug(title: string, slug?: string) {
  const normalized = slugifyBlogTitle(slug || title);
  return normalized || slugifyBlogTitle(title);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = blogPostSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid blog post", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  const data = parsed.data;
  const slug = normalizeSlug(data.title, data.slug);
  const publishedAt =
    data.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt;

  try {
    if (data.isFeatured && data.status === "PUBLISHED") {
      await prisma.blogPost.updateMany({
        where: { isFeatured: true, id: { not: id } },
        data: { isFeatured: false },
      });
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        slug,
        isFeatured: data.status === "PUBLISHED" ? data.isFeatured : false,
        publishedAt,
        seoTitle: data.seoTitle || null,
        metaDescription: data.metaDescription || null,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Update blog post failed", error);
    return NextResponse.json(
      { error: "Update failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete blog post failed", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
