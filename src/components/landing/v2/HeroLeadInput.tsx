"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { EASE } from "./motion";

const EXAMPLES = [
  "Coffee shops in Mumbai with no website",
  "SaaS founders in the US, 11–50 staff",
  "Dentists in Texas with bad reviews",
];

const INTENT_KEY = "flowfiy_intent";

type IntentStatus =
  | "unauthenticated"
  | "no_org"
  | "subscription_required"
  | "insufficient_credits"
  | "ready";

/**
 * Public "describe your leads" bar. On submit we stash what the visitor typed
 * (so the composer can prefill it) and ask /api/lead-intent where to route:
 * sign in → onboarding → subscribe → top up → run.
 */
export function HeroLeadInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [leadCount, setLeadCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const clampCount = (n: number) => Math.max(5, Math.min(Math.round(n || 0), 500));

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const rawQuery = query.trim();
    if (rawQuery.length < 3 || loading) return;
    setLoading(true);
    setHint(null);

    // Carry the intent across sign-in / onboarding so the composer prefills it.
    try {
      localStorage.setItem(INTENT_KEY, JSON.stringify({ rawQuery, leadCount, ts: Date.now() }));
    } catch { /* ignore quota / privacy mode */ }

    let status: IntentStatus = "unauthenticated";
    try {
      const res = await fetch("/api/lead-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawQuery, leadCount }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.status) status = data.status as IntentStatus;
    } catch {
      // Network/edge failure — treat as logged-out and let them sign in.
      status = "unauthenticated";
    }

    switch (status) {
      case "unauthenticated":
        router.push("/signup?next=/leads");
        break;
      case "no_org":
        router.push("/onboarding");
        break;
      case "subscription_required":
        setHint("You've used your 100 free leads — subscribe to keep generating.");
        router.push("/billing");
        break;
      case "insufficient_credits":
        setHint("Top up credits to run your search — no subscription needed for your first 100 leads.");
        router.push("/billing#buy-credits");
        break;
      case "ready":
      default:
        router.push("/leads");
        break;
    }
  }

  return (
    <motion.div
      className="w-full max-w-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
    >
      <form
        onSubmit={submit}
        className="group flex flex-col gap-2 rounded-2xl border border-white/15 bg-[#0a0a14]/70 p-2 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.9)] ring-1 ring-black/40 backdrop-blur-xl transition-colors focus-within:border-violet-400/50 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:pr-2"
      >
        <div className="flex flex-1 items-center gap-2.5 px-3 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the leads you want…"
            aria-label="Describe the leads you want"
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none sm:text-[15px]"
          />
        </div>

        {/* Lead-count field */}
        <div className="flex items-center gap-2 border-white/10 px-3 sm:border-l">
          <label htmlFor="hero-lead-count" className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
            Leads
          </label>
          <input
            id="hero-lead-count"
            type="number"
            min={5}
            max={500}
            step={5}
            value={leadCount}
            onChange={(e) => setLeadCount(clampCount(Number(e.target.value)))}
            aria-label="How many leads"
            className="w-16 rounded-lg bg-white/[0.06] px-2 py-1.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-violet-400/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || query.trim().length < 3}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:rounded-full"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Find leads <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      {/* Example chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQuery(ex)}
            className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-white/25 hover:text-zinc-300"
          >
            {ex}
          </button>
        ))}
      </div>

      {hint && <p className="mt-3 text-center text-xs text-violet-300">{hint}</p>}
    </motion.div>
  );
}
