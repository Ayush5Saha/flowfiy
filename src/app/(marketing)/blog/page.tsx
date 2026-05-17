import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — AI Sales Outreach Tips, Guides & Insights | Flowfiy",
  description:
    "Practical guides on AI-powered B2B sales outreach, cold email personalization, lead generation automation, and using Claude AI for your sales pipeline.",
  keywords: ["AI sales blog", "cold email tips", "B2B lead generation guide", "AI SDR", "outbound sales automation", "Claude AI sales"],
  openGraph: {
    title: "Flowfiy Blog — AI Sales Outreach Tips & Guides",
    description: "Practical guides on AI-powered B2B outreach, cold email, lead generation automation, and Claude AI for sales.",
    url: "/blog",
  },
  alternates: { canonical: "/blog" },
};

const posts = [
  {
    slug: "how-ai-agents-replace-sdrs",
    title: "How 5 AI Agents Are Replacing the Entire SDR Stack in 2026",
    excerpt: "Manual SDR work costs $80k–$120k per rep per year. AI agents do the same work in seconds — at near-zero marginal cost. Here's how the transition actually works.",
    category: "AI & Automation",
    readTime: "8 min read",
    date: "May 10, 2026",
    featured: true,
  },
  {
    slug: "cold-email-personalization-2026",
    title: "Why Personalization Depth Beats Volume: Cold Email in 2026",
    excerpt: "The era of spray-and-pray is over. We analyzed 50,000 cold emails and found one signal that predicts reply rate better than anything else: research depth per lead.",
    category: "Cold Email",
    readTime: "6 min read",
    date: "May 5, 2026",
    featured: false,
  },
  {
    slug: "byok-ai-pricing-explained",
    title: "BYOK AI Pricing: Why We Don't Charge Per Lead Generation",
    excerpt: "Most AI sales tools charge $0.50–$2.00 per lead. We charge $0. Here's the math behind BYOK (Bring Your Own Key) and why it's the only honest model for AI SaaS.",
    category: "Product",
    readTime: "5 min read",
    date: "Apr 28, 2026",
    featured: false,
  },
];

const categories = ["All", "AI & Automation", "Cold Email", "Lead Generation", "Product"];

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-violet-600/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-4 block">Blog</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            AI sales, explained clearly.
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl">
            Practical guides on outbound automation, cold email, lead generation, and using Claude AI for B2B sales.
          </p>
        </div>
      </section>

      {/* Category filter */}
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

      {/* Featured post */}
      <section className="py-16 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-6">Featured</p>
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
        </div>
      </section>

      {/* Post grid */}
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

      {/* Newsletter CTA */}
      <section className="py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Get AI sales insights weekly</h3>
          <p className="text-zinc-400 text-sm mb-6">No fluff. Practical tactics for outbound teams using AI.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
            Start for free — get weekly tips <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
