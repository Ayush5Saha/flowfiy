"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronDown, ArrowLeft, Check, Sparkles } from "lucide-react";
import { ICP_QUESTIONS, type IcpQuestion } from "@/lib/icp";

const EASE = [0.22, 1, 0.36, 1] as const;
type AnswerMap = Record<string, string | string[]>;

// ── Step model ────────────────────────────────────────────────────────────────
type Step =
  | { kind: "workspace" }
  | { kind: "company" }
  | { kind: "question"; q: IcpQuestion }
  | { kind: "tone" }
  | { kind: "details" };

const STEPS: Step[] = [
  { kind: "workspace" },
  { kind: "company" },
  ...ICP_QUESTIONS.map((q) => ({ kind: "question", q }) as Step),
  { kind: "tone" },
  { kind: "details" },
];

const TONES = [
  { value: "professional", label: "Professional", hint: "Polished and credible" },
  { value: "conversational", label: "Conversational", hint: "Warm and human" },
  { value: "direct", label: "Direct", hint: "Short and punchy" },
];

// ── Dropdown (single + multi) ───────────────────────────────────────────────────
function Dropdown({
  options, value, multi, onChange, placeholder,
}: {
  options: string[];
  value: string | string[] | undefined;
  multi: boolean;
  onChange: (v: string | string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = multi ? (Array.isArray(value) ? value : []) : value ? [value as string] : [];
  const isOn = (o: string) => selected.includes(o);
  function pick(o: string) {
    if (multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
    } else {
      onChange(value === o ? "" : o);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-secondary px-4 py-3.5 text-left text-sm transition-colors ${
          open ? "border-primary ring-1 ring-primary/40" : selected.length ? "border-primary/40" : "border-border hover:border-primary/40"
        }`}
      >
        <span className="min-w-0 flex-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : multi ? (
            <span className="flex flex-wrap gap-1.5">
              {selected.map((s) => (
                <span key={s} className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">{s}</span>
              ))}
            </span>
          ) : (
            <span className="font-medium text-foreground">{selected[0]}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: EASE }}
            className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl shadow-black/40"
          >
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isOn(o) ? "bg-primary/15 text-primary" : "text-foreground hover:bg-secondary"
                }`}
              >
                <span>{o}</span>
                {isOn(o) && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
            {multi && (
              <p className="px-3 py-2 text-[11px] text-muted-foreground">Pick all that apply, then continue.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OnboardingWizard({ userId }: { userId: string }) {
  void userId;
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [outreachTone, setOutreachTone] = useState("professional");
  const [answers, setAnswers] = useState<AnswerMap>({});

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const progress = (index / (STEPS.length - 1)) * 100;

  function valid(s: Step): boolean {
    switch (s.kind) {
      case "workspace": return workspaceName.trim().length > 0;
      case "company": return companyName.trim().length > 0;
      case "question": {
        if (!s.q.required) return true;
        const v = answers[s.q.key];
        return !!v && (Array.isArray(v) ? v.length > 0 : true);
      }
      case "tone": return true;
      case "details": return businessDetails.trim().length >= 10;
    }
  }

  async function createOrg(): Promise<boolean> {
    setLoading(true); setError("");
    const res = await fetch("/api/organizations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workspaceName }),
    });
    const data = (await res.json()) as { organization?: { id: string }; error?: string };
    setLoading(false);
    if (!res.ok) { setError(typeof data.error === "string" ? data.error : "Failed to create workspace"); return false; }
    setOrgId(data.organization!.id);
    return true;
  }

  async function submit(): Promise<void> {
    if (!orgId) return;
    setLoading(true); setError("");
    const icp: AnswerMap = {};
    for (const q of ICP_QUESTIONS) {
      const v = answers[q.key];
      if (v && (Array.isArray(v) ? v.length > 0 : true)) icp[q.key] = v;
    }
    const res = await fetch("/api/business-profile", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, companyName, website: website || undefined, businessDetails, outreachTone, icp }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(typeof data.error === "string" ? data.error : "Failed to save profile");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  async function next() {
    if (!valid(step) || loading) return;
    if (step.kind === "workspace" && !orgId) {
      const ok = await createOrg();
      if (!ok) return;
    }
    if (isLast) { await submit(); return; }
    setDir(1); setIndex((i) => i + 1);
  }
  function back() {
    if (index === 0) return;
    setDir(-1); setIndex((i) => i - 1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && step.kind !== "details") { e.preventDefault(); next(); }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" onKeyDown={onKeyDown}>
      {/* Progress bar */}
      <div className="relative h-1.5 w-full bg-secondary">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-500"
          animate={{ width: `${Math.max(progress, 4)}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>

      <div className="px-6 pb-6 pt-5 sm:px-8">
        {/* Header row */}
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Step {index + 1} of {STEPS.length}
          </span>
          <span className="text-[11px] font-medium text-violet-400">{Math.round(progress)}% complete</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* Animated card body — one screen at a time */}
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: dir * 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -36 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              {step.kind === "workspace" && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight">Name your workspace</h2>
                  <p className="text-sm text-muted-foreground">Usually your company or agency name. You can change it later.</p>
                  <input
                    autoFocus value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Agency"
                    className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              )}

              {step.kind === "company" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight">Your company</h2>
                  <p className="text-sm text-muted-foreground">The brand your outreach goes out as.</p>
                  <div className="space-y-3">
                    <input
                      autoFocus value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company name"
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <input
                      value={website} onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourcompany.com  (optional)"
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {step.kind === "question" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-violet-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-violet-400">
                      Q{ICP_QUESTIONS.indexOf(step.q) + 1}
                    </span>
                    {step.q.required && <span className="text-[11px] text-muted-foreground">Required</span>}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{step.q.title}</h2>
                  <p className="text-sm text-muted-foreground">{step.q.multi ? "Select all that apply" : "Select one"}</p>
                  <Dropdown
                    options={step.q.options}
                    value={answers[step.q.key]}
                    multi={step.q.multi}
                    placeholder={step.q.multi ? "Choose options…" : "Choose one…"}
                    onChange={(v) => setAnswers((p) => ({ ...p, [step.q.key]: v }))}
                  />
                </div>
              )}

              {step.kind === "tone" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight">Outreach tone</h2>
                  <p className="text-sm text-muted-foreground">How should your emails sound?</p>
                  <div className="space-y-2.5">
                    {TONES.map((t) => (
                      <button
                        key={t.value} type="button" onClick={() => setOutreachTone(t.value)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
                          outreachTone === t.value ? "border-primary bg-primary/10" : "border-border bg-secondary hover:border-primary/40"
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-medium">{t.label}</span>
                          <span className="block text-xs text-muted-foreground">{t.hint}</span>
                        </span>
                        {outreachTone === t.value && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step.kind === "details" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span className="text-[11px] font-medium text-violet-400">Last step — this powers your emails</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Tell us about your business</h2>
                  <p className="text-sm text-muted-foreground">
                    In your own words: what you do, who you help, your offer, what makes you different. The AI references this when writing every email.
                  </p>
                  <textarea
                    autoFocus value={businessDetails} onChange={(e) => setBusinessDetails(e.target.value)} rows={6}
                    placeholder="e.g. We help D2C brands scale into offline retail across India without building a traditional distributor network — we connect them directly with vetted retailers and handle logistics. Brands go live in stores within 30 days."
                    className="w-full resize-none rounded-xl border border-border bg-secondary px-4 py-3.5 text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <p className="text-right text-[11px] text-muted-foreground">{businessDetails.trim().length} chars</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav */}
        <div className="mt-6 flex items-center gap-3">
          {index > 0 && (
            <button
              type="button" onClick={back}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          <motion.button
            type="button" onClick={next} disabled={!valid(step) || loading}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 blur-md transition-opacity group-hover:opacity-60" />
            <span className="relative z-10 inline-flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLast ? "Finish & find leads" : "Continue"}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
