import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Rocket } from "lucide-react";
import { getBlogCards } from "@/lib/blog";

const SETUP_GUIDE_SLUG = "how-to-set-up-flowfiy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog - AI Sales Outreach Tips & B2B Lead Generation Guides India | Flowfiy",
  description:
    "Practical guides on AI-powered B2B sales outreach in India - cold email personalization, lead generation automation, AI SDR tools, and condition-based lead targeting for your sales pipeline.",
  keywords: [
    "AI sales blog India",
    "cold email tips India",
    "B2B lead generation guide India",
    "AI SDR India",
    "outbound sales automation India",
    "condition-based targeting India",
    "AI outreach guide India",
    "B2B sales automation blog",
  ],
  openGraph: {
    title: "Flowfiy Blog - AI Sales Outreach Tips & B2B Lead Generation Guides India",
    description:
      "Practical guides on AI-powered B2B outreach, cold email, and lead generation automation in India. Managed AI for sales.",
    url: "/blog",
  },
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const allPosts = await getBlogCards();
  const setupGuide = allPosts.find((post) => post.slug === SETUP_GUIDE_SLUG) ?? null;
  // Pin the setup guide as a dedicated "Start here" card; keep it out of the
  // chronological grid so it isn't duplicated / buried among other posts.
  const posts = allPosts.filter((post) => post.slug !== SETUP_GUIDE_SLUG);
  const [featured, ...rest] = posts;
  const categories = ["All", ...Array.from(new Set(posts.map((post) => post.category)))];

  return (
    <div>
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-4 block">Blog</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            AI sales, explained clearly.
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl">
            Practical guides on outbound automation, cold email, lead generation, and managed AI for B2B sales.
          </p>
        </div>
      </section>

      <section className="border-b border-white/5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto py-4 scrollbar-none">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                i === 0
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {setupGuide && (
        <section className="pt-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-6">Start here</p>
            <Link href={`/blog/${setupGuide.slug}`} className="group block">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/10 to-zinc-900/40 p-6 sm:p-7 hover:border-violet-500/45 transition-all">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                  <Rocket className="w-6 h-6 text-violet-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">New to Flowfiy?</span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> {setupGuide.readTime}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-violet-300 transition-colors leading-snug">
                    {setupGuide.title}
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl">{setupGuide.excerpt}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:gap-3 transition-all shrink-0">
                  Read guide <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      <section className="py-16 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-6">Featured</p>
          {featured ? (
            <Link href={`/blog/${featured.slug}`} className="group block">
              <div className="bg-gradient-to-br from-violet-950/50 to-zinc-900/50 border border-violet-500/20 rounded-2xl p-8 sm:p-10 hover:border-violet-500/40 transition-all">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    {featured.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.readTime}
                  </span>
                  <span className="text-xs text-zinc-600">{featured.date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 group-hover:text-violet-300 transition-colors leading-snug">
                  {featured.title}
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6 max-w-2xl">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:gap-3 transition-all">
                  Read article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ) : (
            <div className="bg-zinc-900/40 border border-white/6 rounded-2xl p-8 text-zinc-400">
              No published articles yet.
            </div>
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-6">
              {rest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <article className="h-full bg-zinc-900/40 border border-white/6 rounded-2xl p-7 hover:border-violet-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-white/8">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-3 group-hover:text-violet-300 transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-sm text-zinc-400 leading-relaxed mb-5">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-600">{post.date}</span>
                      <span className="text-xs font-medium text-violet-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Get AI sales insights weekly</h3>
          <p className="text-zinc-400 text-sm mb-6">No fluff. Practical tactics for outbound teams using AI.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25"
          >
            Get started - get weekly tips <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
