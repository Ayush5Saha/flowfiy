"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Loader2, ArrowRight, Filter, Database, Globe, Wand2,
  Play, Pencil, Coins, AlertCircle,
} from "lucide-react";
import type { ResolvedPlan, ClarifyQuestion, Predicate } from "@/ai/criteria/types";
import { CreditBalancePill } from "./CreditBalancePill";

type Phase = "input" | "clarifying" | "planned" | "submitting";

const EXAMPLES = [
  "Coffee shops in Mumbai that don't have a website",
  "SaaS founders in the US, 11–50 employees",
  "Dentists in Texas with bad Google reviews",
  "E-commerce brands with a slow or outdated website",
];

function evaluatorMeta(ev: Predicate["evaluator"]) {
  if (ev === "source") return { icon: Filter, label: "search filter" };
  if (ev === "attribute") return { icon: Database, label: "from listing data" };
  if (ev === "judge") return { icon: Wand2, label: "AI judges" };
  return { icon: Globe, label: "live site check" };
}

export function LeadRequestComposer() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [rawQuery, setRawQuery] = useState("");
  const [leadCount, setLeadCount] = useState(100);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [plan, setPlan] = useState<ResolvedPlan | null>(null);
  const [estimate, setEstimate] = useState(0);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<{ message: string; href?: string; hrefLabel?: string } | null>(null);

  function reset(keepQuery = true) {
    setPhase("input");
    setQuestions([]);
    setAnswers({});
    setPlan(null);
    setError(null);
    if (!keepQuery) setRawQuery("");
  }

  // Pick up an intent carried over from the landing input (sign in → onboarding → here).
  useEffect(() => {
    try {
      const stored = localStorage.getItem("flowfiy_intent");
      if (!stored) return;
      localStorage.removeItem("flowfiy_intent");
      const intent = JSON.parse(stored) as { rawQuery?: string; leadCount?: number };
      if (intent.rawQuery) setRawQuery(intent.rawQuery);
      if (typeof intent.leadCount === "number") {
        setLeadCount(Math.max(5, Math.min(Math.round(intent.leadCount), 500)));
      }
    } catch { /* ignore malformed intent */ }
  }, []);

  async function submitQuery(e?: React.FormEvent) {
    e?.preventDefault();
    if (rawQuery.trim().length < 3) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch("/api/lead-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawQuery: rawQuery.trim(), leadCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({
          message: data.error ?? "Something went wrong.",
          href: data.missingProfile ? "/settings" : undefined,
          hrefLabel: data.missingProfile ? "Set up your business profile →" : undefined,
        });
        setPhase("input");
        return;
      }
      setRequestId(data.id);
      if (data.status === "needs_clarification") {
        setQuestions(data.questions);
        setPhase("clarifying");
      } else {
        setPlan(data.plan);
        setEstimate(data.estimate);
        setBalance(data.balance);
        setPhase("planned");
      }
    } catch {
      setError({ message: "Network error. Please try again." });
      setPhase("input");
    }
  }

  async function submitAnswers() {
    if (!requestId) return;
    const payload = questions.map((q) => {
      const a = answers[q.id];
      return { id: q.id, question: q.question, answer: Array.isArray(a) ? a.join(", ") : (a ?? "") };
    });
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/lead-requests/${requestId}/clarify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) { setError({ message: data.error ?? "Something went wrong." }); setPhase("clarifying"); return; }
      if (data.status === "needs_clarification") {
        setQuestions(data.questions);
        setAnswers({});
        setPhase("clarifying");
      } else {
        setPlan(data.plan);
        setEstimate(data.estimate);
        setBalance(data.balance);
        setPhase("planned");
      }
    } catch {
      setError({ message: "Network error. Please try again." });
      setPhase("clarifying");
    }
  }

  async function confirmRun() {
    if (!requestId) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/lead-requests/${requestId}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setError({
            message: `Not enough credits — this run needs ${data.needed}, you have ${data.balance}.`,
            href: "/billing",
            hrefLabel: "Buy credits →",
          });
        } else if (res.status === 403) {
          setError({
            message: data.error ?? "You've used your 100 free leads — subscribe to keep generating.",
            href: "/billing",
            hrefLabel: "Subscribe →",
          });
        } else {
          setError({ message: data.error ?? "Couldn't start the run." });
        }
        setPhase("planned");
        return;
      }
      router.push(`/leads/${data.leadListId}`);
    } catch {
      setError({ message: "Network error. Please try again." });
      setPhase("planned");
    }
  }

  const answeredAll = questions.every((q) => !q.required || (answers[q.id] && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length : true)));
  const balanceAfter = balance - estimate;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Describe the leads you want</h2>
        </div>
        <CreditBalancePill />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p>{error.message}</p>
            {error.href && (
              <Link href={error.href} className="underline underline-offset-2 font-medium">{error.hrefLabel}</Link>
            )}
          </div>
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────── */}
      {(phase === "input" || (phase === "submitting" && !plan && questions.length === 0)) && (
        <form onSubmit={submitQuery}>
          <textarea
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            rows={3}
            placeholder="e.g. Find owners of coffee shops in Mumbai that don't have a website"
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setRawQuery(ex)}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <label htmlFor="lead-count" className="text-xs text-muted-foreground">How many leads?</label>
              <input
                id="lead-count"
                type="number"
                min={5}
                max={500}
                step={5}
                value={leadCount}
                onChange={(e) => setLeadCount(Math.max(5, Math.min(Math.round(Number(e.target.value) || 0), 500)))}
                className="w-20 px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-muted-foreground">max 500</span>
            </div>
            <button
              type="submit"
              disabled={phase === "submitting" || rawQuery.trim().length < 3}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {phase === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Nothing is charged until you review the plan and click Run.</p>
        </form>
      )}

      {/* ── Clarifying ────────────────────────────────────── */}
      {phase === "clarifying" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">A couple of quick questions to get this right:</p>
          {questions.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium mb-1">{q.question}{q.required && <span className="text-destructive"> *</span>}</p>
              {q.why && <p className="text-xs text-muted-foreground mb-2">{q.why}</p>}
              {(q.type === "single_select" || q.type === "multi_select") && (
                <div className="flex flex-wrap gap-2">
                  {(q.options ?? []).map((opt) => {
                    const cur = answers[q.id];
                    const selected = q.type === "multi_select" ? Array.isArray(cur) && cur.includes(opt) : cur === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => {
                            if (q.type === "multi_select") {
                              const arr = Array.isArray(prev[q.id]) ? [...(prev[q.id] as string[])] : [];
                              return { ...prev, [q.id]: arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt] };
                            }
                            return { ...prev, [q.id]: opt };
                          })
                        }
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === "text" && (
                <input
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              )}
              {q.type === "number" && (
                <input
                  type="number"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                  className="w-32 px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              )}
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button onClick={() => reset(true)} className="text-sm text-muted-foreground hover:text-foreground">Back</button>
            <button
              onClick={submitAnswers}
              disabled={!answeredAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Plan card ─────────────────────────────────────── */}
      {(phase === "planned" || (phase === "submitting" && plan)) && plan && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">{plan.humanSummary}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Up to {plan.maxResults} results · {plan.leadType === "LOCAL" ? "local businesses" : "B2B contacts"}
            </p>
          </div>

          {plan.criteria.length > 0 && (
            <div className="space-y-1.5">
              {plan.criteria.map((c, i) => {
                const { icon: Icon, label } = evaluatorMeta(c.evaluator);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{c.why || c.field}</span>
                    <span className="text-muted-foreground">· {label}</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] ${c.hard ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                      {c.hard ? "required" : "preferred"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/60 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Estimated cost</p>
              <p className="text-xl font-semibold flex items-center gap-1.5"><Coins className="w-4 h-4 text-primary" />{estimate} credits</p>
            </div>
            <div className="bg-secondary/60 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Balance after</p>
              <p className={`text-xl font-semibold ${balanceAfter < 0 ? "text-destructive" : "text-green-400"}`}>
                {balanceAfter < 0 ? `Short ${Math.abs(balanceAfter)}` : `${balanceAfter} left`}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Coins className="w-3 h-3" /> Credits are held now and reconciled to actual cost — you only pay for qualified leads.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={confirmRun}
              disabled={phase === "submitting" || balanceAfter < 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {phase === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Run · reserve {estimate}</>}
            </button>
            <button onClick={() => reset(true)} className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            {balanceAfter < 0 && (
              <Link href="/billing" className="ml-auto text-sm text-primary underline underline-offset-2">Buy credits →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
