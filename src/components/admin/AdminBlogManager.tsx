"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  FilePlus2,
  Loader2,
  Pencil,
  Save,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";

export type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  authorName: string;
  readTime: string;
  isFeatured: boolean;
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  content: string;
  authorName: string;
  readTime: string;
  isFeatured: boolean;
  seoTitle: string;
  metaDescription: string;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  category: "AI & Automation",
  content: "",
  authorName: "Flowfiy",
  readTime: "5 min read",
  isFeatured: false,
  seoTitle: "",
  metaDescription: "",
};

function fromPost(post: AdminBlogPost): FormState {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    content: post.content,
    authorName: post.authorName,
    readTime: post.readTime,
    isFeatured: post.isFeatured,
    seoTitle: post.seoTitle ?? "",
    metaDescription: post.metaDescription ?? "",
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function inputClassName(extra = "") {
  return `w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 ${extra}`;
}

export default function AdminBlogManager({ posts }: { posts: AdminBlogPost[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(posts[0]?.id ?? null);
  const [form, setForm] = useState<FormState>(() => (posts[0] ? fromPost(posts[0]) : emptyForm));
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId]
  );

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return posts;
    return posts.filter((post) =>
      [post.title, post.slug, post.category, post.status].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [posts, query]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startNewPost() {
    setSelectedId(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
  }

  function selectPost(post: AdminBlogPost) {
    setSelectedId(post.id);
    setForm(fromPost(post));
    setError(null);
    setSuccess(null);
  }

  async function savePost(status: "DRAFT" | "PUBLISHED") {
    setError(null);
    setSuccess(null);

    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      status,
      seoTitle: form.seoTitle || null,
      metaDescription: form.metaDescription || null,
    };

    const response = await fetch(form.id ? `/api/admin/blog/${form.id}` : "/api/admin/blog", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || "Unable to save blog post.");
      return;
    }

    setSuccess(status === "PUBLISHED" ? "Post published." : "Draft saved.");
    setSelectedId(body.post?.id ?? form.id ?? null);
    setForm(body.post ? fromPost({
      ...body.post,
      publishedAt: body.post.publishedAt,
      createdAt: body.post.createdAt,
      updatedAt: body.post.updatedAt,
    }) : form);
    startTransition(() => router.refresh());
  }

  async function deletePost() {
    if (!form.id) return;
    const confirmed = window.confirm(`Delete "${form.title}"?`);
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/blog/${form.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Unable to delete blog post.");
      return;
    }

    setSuccess("Post deleted.");
    setSelectedId(null);
    setForm(emptyForm);
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm transition">
              &larr; Admin
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Blog Publishing</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {posts.length} post{posts.length !== 1 ? "s" : ""} in the admin library
          </p>
        </div>
        <button
          type="button"
          onClick={startNewPost}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
        >
          <FilePlus2 className="h-4 w-4" />
          New post
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="border-b border-zinc-800 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search posts"
                className={inputClassName("pl-9")}
              />
            </div>
          </div>

          <div className="max-h-[720px] overflow-y-auto divide-y divide-zinc-800">
            {filteredPosts.length === 0 ? (
              <div className="p-6 text-sm text-zinc-500">No posts found.</div>
            ) : (
              filteredPosts.map((post) => {
                const active = post.id === selectedId;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => selectPost(post)}
                    className={`w-full text-left p-4 transition ${
                      active ? "bg-amber-500/10" : "hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          post.status === "PUBLISHED"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {post.status === "PUBLISHED" ? "Published" : "Draft"}
                      </span>
                      {post.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-white">{post.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{post.category} - {formatDate(post.publishedAt)}</p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                {form.id ? "Edit post" : "Create post"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {form.title || "Untitled blog post"}
              </h2>
            </div>
            {selectedPost?.status === "PUBLISHED" && (
              <Link
                href={`/blog/${selectedPost.slug}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-300"
              >
                <Eye className="h-4 w-4" />
                View
              </Link>
            )}
          </div>

          <div className="p-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">Title</span>
                <input
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      slug: current.id || current.slug ? current.slug : slugify(title),
                    }));
                  }}
                  className={inputClassName()}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => updateField("slug", slugify(event.target.value))}
                  className={inputClassName()}
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">Category</span>
                <input
                  value={form.category}
                  onChange={(event) => updateField("category", event.target.value)}
                  className={inputClassName()}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">Read time</span>
                <input
                  value={form.readTime}
                  onChange={(event) => updateField("readTime", event.target.value)}
                  className={inputClassName()}
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">Author</span>
                <input
                  value={form.authorName}
                  onChange={(event) => updateField("authorName", event.target.value)}
                  className={inputClassName()}
                />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-xs font-medium text-zinc-500">Excerpt</span>
              <textarea
                value={form.excerpt}
                onChange={(event) => updateField("excerpt", event.target.value)}
                rows={3}
                className={inputClassName("resize-y")}
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-xs font-medium text-zinc-500">Body</span>
              <textarea
                value={form.content}
                onChange={(event) => updateField("content", event.target.value)}
                rows={18}
                className={inputClassName("resize-y font-mono leading-6")}
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">SEO title</span>
                <input
                  value={form.seoTitle}
                  onChange={(event) => updateField("seoTitle", event.target.value)}
                  className={inputClassName()}
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium text-zinc-500">Meta description</span>
                <input
                  value={form.metaDescription}
                  onChange={(event) => updateField("metaDescription", event.target.value)}
                  className={inputClassName()}
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => updateField("isFeatured", event.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-amber-500"
              />
              Feature this post
            </label>

            {(error || success) && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  error
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {error || success}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={deletePost}
                disabled={!form.id || isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => savePost("DRAFT")}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => savePost("PUBLISHED")}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {form.id ? "Update published" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
