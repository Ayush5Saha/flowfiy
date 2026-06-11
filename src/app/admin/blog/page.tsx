import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import AdminBlogManager, { type AdminBlogPost } from "@/components/admin/AdminBlogManager";

export default async function AdminBlogPage() {
  await requireAdmin();

  const posts = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  const serializedPosts: AdminBlogPost[] = posts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    content: post.content,
    status: post.status,
    authorName: post.authorName,
    readTime: post.readTime,
    isFeatured: post.isFeatured,
    seoTitle: post.seoTitle,
    metaDescription: post.metaDescription,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#09090f] text-white p-6 lg:p-8">
      <AdminBlogManager posts={serializedPosts} />
    </div>
  );
}
