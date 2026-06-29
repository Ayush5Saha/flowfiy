"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronDown, ArrowLeft, Check, Sparkles, AlertCircle } from "lucide-react";
import { ICP_QUESTIONS, type IcpQuestion } from "@/lib/icp";
import { FEATURES } from "@/lib/feature-flags";

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

// ── Website-import → onboarding prefill ─────────────────────────────────────────
// /api/business-profile/analyze-website returns the legacy ProfileDraft shape. Map the
// parts we can confidently onto the structured onboarding fields. A site reveals what a
// company DOES (business details) more reliably than the user's targeting *choices*, so
// the ICP answers below are best-effort defaults the user reviews on the next steps.
type DraftLite = {
  companyName?: string;
  serviceOffered?: string;
  painPointsSolved?: string;
  offerPositioning?: string;
  outreachTone?: string;
  targetIndustries?: string[];
  targetGeographies?: string[];
  companySizeRange?: string | null;
};

const GEO_TO_ICP: Record<string, string> = {
  "united states": "United States", "united kingdom": "United Kingdom", canada: "Canada",
  australia: "Australia", india: "India", singapore: "Singapore", uae: "UAE",
  germany: "Germany", france: "France", global: "Worldwide", worldwide: "Worldwide",
};
const SIZE_TO_ICP: Record<string, string> = {
  "1-10": "2-10 Employees", "11-50": "11-50 Employees", "51-200": "51-200 Employees",
  "201-500": "201-1000 Employees", "500+": "1000+ Employees",
};
const INDUSTRY_TO_ICP: Record<string, string> = {
  saas: "SaaS", "e-commerce": "E-commerce", ecommerce: "E-commerce",
  "marketing agency": "Marketing", marketing: "Marketing",
  fintech: "Finance", finance: "Finance",
  healthtech: "Healthcare", healthcare: "Healthcare",
  "it services": "IT Services", "artificial intelligence": "Artificial Intelligence", ai: "Artificial Intelligence",
  "real estate": "Real Estate", legal: "Legal", education: "Education",
  manufacturing: "Manufacturing", retail: "Retail",
};

function mapDraftToOnboarding(draft: DraftLite): {
  companyName?: string;
  outreachTone?: string;
  businessDetails?: string;
  answers: AnswerMap;
} {
  const answers: AnswerMap = {};
  const inds = [...new Set(
    (draft.targetIndustries ?? [])
      .map((i) => INDUSTRY_TO_ICP[i.trim().toLowerCase()])
      .filter((x): x is string => Boolean(x))
  )];
  if (inds.length) answers.industries = inds;
  const geos = [...new Set(
    (draft.targetGeographies ?? [])
      .map((g) => GEO_TO_ICP[g.trim().toLowerCase()])
      .filter((x): x is string => Boolean(x))
  )];
  if (geos.length) answers.countries = geos;
  const size = draft.companySizeRange ? SIZE_TO_ICP[draft.companySizeRange] : undefined;
  if (size) answers.companySize = size;

  const businessDetails = [
    draft.serviceOffered?.trim(),
    draft.painPointsSolved?.trim() ? `Who we help / problems we solve: ${draft.painPointsSolved.trim()}` : "",
    draft.offerPositioning?.trim() ? `What makes us different: ${draft.offerPositioning.trim()}` : "",
  ].filter(Boolean).join("\n\n");

  const tone = ["professional", "conversational", "direct"].includes(draft.outreachTone ?? "")
    ? draft.outreachTone
    : undefined;

  return {
    companyName: draft.companyName?.trim() || undefined,
    outreachTone: tone,
    businessDetails: businessDetails || undefined,
    answers,
  };
}

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Fixed viewport coords for the portalled menu (see below).
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number; up: boolean } | null>(null);

  // Position the menu under (or above, when there's no room) the trigger, kept in
  // sync with scroll/resize. It's rendered in a portal on <body> so the wizard
  // card's `overflow-hidden` (needed for the progress bar + slide animation) can't
  // clip the last options — the bug where "Other" got cut off at the card edge.
  useEffect(() => {
    if (!open) { setPos(null); return; }
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 8;
      const below = window.innerHeight - r.bottom - gap;
      const above = r.top - gap;
      const up = below < 220 && above > below;
      const maxHeight = Math.max(160, Math.min(288, up ? above : below));
      setPos(up
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + gap, maxHeight, up }
        : { left: r.left, width: r.width, top: r.bottom + gap, maxHeight, up });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Close on click outside BOTH the trigger and the (portalled) menu.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
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
    <div className="relative">
      <button
        ref={triggerRef}
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

      {open && pos && createPortal(
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: pos.up ? 6 : -6, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: EASE }}
          style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          className="z-50 overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl shadow-black/40"
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
        </motion.div>,
        document.body
      )}
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

  // Website autofill (company step)
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [imported, setImported] = useState(false);

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

  async function autofillFromWebsite(): Promise<void> {
    if (!orgId || !website.trim() || importing) return;
    setImporting(true); setImportError("");
    try {
      const res = await fetch("/api/business-profile/analyze-website", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, url: website.trim() }),
      });
      const data = (await res.json()) as {
        draft?: DraftLite;
        icp?: Record<string, string | string[]>;
        analyzedUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setImportError(typeof data.error === "string" ? data.error : "We couldn't read that site. Continue and fill it in manually.");
        return;
      }
      const m = mapDraftToOnboarding(data.draft ?? {});
      const finalCompany = companyName.trim() || (m.companyName ?? "");
      const finalDetails = m.businessDetails ?? businessDetails;
      if (m.companyName && !companyName.trim()) setCompanyName(m.companyName);
      if (m.outreachTone) setOutreachTone(m.outreachTone);
      if (m.businessDetails) setBusinessDetails(m.businessDetails);
      // The server-inferred ICP (validated against the question options) fills every
      // ICP step; the draft-derived guesses are a fallback the ICP overrides.
      const mergedAnswers = { ...m.answers, ...(data.icp ?? {}) };
      if (Object.keys(mergedAnswers).length) setAnswers((p) => ({ ...p, ...mergedAnswers }));
      if (data.analyzedUrl) setWebsite(data.analyzedUrl);
      setImported(true);
      // Everything's pre-filled — jump to the final step so they review + finish.
      // (Only when the two hard-required fields are present, so Finish won't 400.)
      if (finalCompany && finalDetails.trim().length >= 10) {
        setDir(1);
        setIndex(STEPS.length - 1);
      }
    } catch {
      setImportError("Something went wrong reading that site. Continue and fill it in manually.");
    } finally {
      setImporting(false);
    }
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
                      value={website}
                      onChange={(e) => { setWebsite(e.target.value); if (imported) setImported(false); }}
                      onKeyDown={(e) => {
                        // Enter triggers autofill (and must not bubble to the wizard's
                        // root handler, which would advance the step).
                        if (e.key === "Enter" && website.trim() && !importing) {
                          e.preventDefault(); e.stopPropagation(); autofillFromWebsite();
                        }
                      }}
                      placeholder="https://yourcompany.com  (optional)"
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  {FEATURES.websiteImport && (
                    <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3.5">
                      {imported ? (
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          <span>Imported from your site — we&apos;ve pre-filled the next steps. Hit <span className="font-medium">Continue</span> to review and tweak each one.</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2.5">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">Autofill from your website</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">We&apos;ll read your site and pre-fill your business details and ICP. You review every step.</p>
                            </div>
                          </div>
                          <button
                            type="button" onClick={autofillFromWebsite} disabled={!website.trim() || importing}
                            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                          >
                            {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Reading your site…</> : <><Sparkles className="h-4 w-4" /> Autofill from website</>}
                          </button>
                          <p className="mt-2 text-center text-[11px] text-muted-foreground">
                            {website.trim() ? "Prefer to type it yourself? Just hit Continue." : "Enter your website to autofill — or hit Continue to fill it in yourself."}
                          </p>
                        </>
                      )}
                      {importError && (
                        <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" /><span>{importError}</span>
                        </p>
                      )}
                    </div>
                  )}
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
                  {imported && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Imported from your website — we pre-filled every step, including your ICP. Review this, go <span className="font-medium">Back</span> to fine-tune any answer, or finish.</span>
                    </div>
                  )}
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
