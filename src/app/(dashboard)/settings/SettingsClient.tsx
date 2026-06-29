"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Globe, Sparkles, X, AlertCircle } from "lucide-react";
import { FEATURES } from "@/lib/feature-flags";

const INDUSTRIES = [
  "SaaS", "E-commerce", "Marketing Agency", "Consulting", "Fintech",
  "HealthTech", "Real Estate", "Legal", "Education", "Manufacturing",
  "Retail", "Media & Content", "HR & Recruiting", "Logistics", "Other",
];

const GEOGRAPHIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Singapore", "UAE", "Global",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

type Tab = "workspace" | "business" | "account";

/** Field state the website-import flow can fill. Mirrors the legacy BusinessProfile columns. */
type ProfileValues = {
  companyName: string;
  serviceOffered: string;
  icpDescription: string;
  painPointsSolved: string;
  offerPositioning: string;
  targetIndustries: string[];
  targetGeographies: string[];
  companySizeRange: string;
  outreachTone: string;
  website: string;
};

type FieldKind = "text" | "textarea" | "industries" | "geos" | "size";

/** Order + metadata for the fields the "missing info" dialog can ask about. */
const DIALOG_FIELDS: { key: keyof ProfileValues; label: string; kind: FieldKind; placeholder?: string }[] = [
  { key: "companyName", label: "Company name", kind: "text", placeholder: "Your company" },
  { key: "serviceOffered", label: "Service you offer", kind: "textarea", placeholder: "e.g. We build AI-powered marketing funnels for B2B SaaS companies" },
  { key: "icpDescription", label: "Describe your ideal customer", kind: "textarea", placeholder: "e.g. B2B SaaS founders with 10-50 employees struggling with lead generation" },
  { key: "painPointsSolved", label: "Pain points you solve", kind: "textarea", placeholder: "e.g. Poor lead quality, inconsistent pipeline, time wasted on manual prospecting" },
  { key: "offerPositioning", label: "Your offer positioning", kind: "textarea", placeholder: "e.g. We guarantee 20 qualified discovery calls in 90 days or we work for free" },
  { key: "targetIndustries", label: "Target industries", kind: "industries" },
  { key: "targetGeographies", label: "Target geographies", kind: "geos" },
  { key: "companySizeRange", label: "Target company size", kind: "size" },
];

interface Props {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    memberCount: number;
  };
  businessProfile: {
    companyName: string;
    website: string;
    serviceOffered: string;
    icpDescription: string;
    targetIndustries: string[];
    targetGeographies: string[];
    companySizeRange: string;
    painPointsSolved: string;
    offerPositioning: string;
    outreachTone: string;
  } | null;
  user: {
    email: string;
    role: string;
  };
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <Check className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saved ? "Saved" : "Save changes"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground";
const textareaCls = `${inputCls} resize-none`;

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

/* ─── Reusable chip + size pickers (shared by the form and the import dialog) ── */
function ChipGroup({
  options, selected, onToggle,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
            selected.includes(o)
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border hover:border-primary/50"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function SizeGroup({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 mt-1">
      {COMPANY_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
            value === size
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border hover:border-primary/50"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}

/* ─── Website import card ─────────────────────────────────────────────────────
 * Sits at the top of the Business Profile tab. The user pastes their site URL;
 * we scrape it and let Gemini draft the whole profile, then prefill the form. */
function WebsiteImportCard({
  url, setUrl, loading, error, note, onAnalyze,
}: {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  error: string;
  note: string;
  onAnalyze: () => void;
}) {
  return (
    <section className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">Autofill from your website</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Paste your URL — we&apos;ll read your site and draft everything below. Anything we can&apos;t find, we&apos;ll ask you for. Nothing saves until you review.
          </p>

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); if (url.trim() && !loading) onAnalyze(); }
                }}
                placeholder="https://yourcompany.com"
                disabled={loading}
                className="w-full pl-9 pr-3 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!url.trim() || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Reading your site…" : "Autofill"}
            </button>
          </div>

          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {!error && note && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-emerald-400">
              <Check className="w-3.5 h-3.5 mt-px shrink-0" />
              <span>{note}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Missing-info dialog ─────────────────────────────────────────────────────
 * After import, fields the scraper/LLM couldn't determine are collected here so
 * the user can complete them in one place. Applying merges them into the form. */
function MissingInfoDialog({
  missing, defaults, onApply, onClose,
}: {
  missing: (keyof ProfileValues)[];
  defaults: ProfileValues;
  onApply: (vals: Partial<ProfileValues>) => void;
  onClose: () => void;
}) {
  // Mounted only while open (see parent), so initializing once from the current
  // form values is correct — no re-seed effect that could wipe in-progress edits.
  const [vals, setVals] = useState<Partial<ProfileValues>>(() => {
    const init: Partial<ProfileValues> = {};
    for (const key of missing) {
      if (key === "targetIndustries" || key === "targetGeographies") {
        init[key] = Array.isArray(defaults[key]) ? [...(defaults[key] as string[])] : [];
      } else {
        init[key] = (defaults[key] as string) ?? "";
      }
    }
    return init;
  });

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fields = DIALOG_FIELDS.filter((f) => missing.includes(f.key));

  function setText(key: keyof ProfileValues, v: string) {
    setVals((p) => ({ ...p, [key]: v }));
  }
  function toggleChip(key: "targetIndustries" | "targetGeographies", v: string) {
    setVals((p) => ({ ...p, [key]: toggleArr((p[key] as string[]) ?? [], v) }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Complete your business profile"
        className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl shadow-black/40"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">A few details we couldn&apos;t find</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              We read your site but couldn&apos;t confirm these. Fill them in so your outreach lands right.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.kind === "text" && (
                <input
                  value={(vals[f.key] as string) ?? ""}
                  onChange={(e) => setText(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={inputCls}
                />
              )}
              {f.kind === "textarea" && (
                <textarea
                  value={(vals[f.key] as string) ?? ""}
                  onChange={(e) => setText(f.key, e.target.value)}
                  rows={2}
                  placeholder={f.placeholder}
                  className={textareaCls}
                />
              )}
              {f.kind === "industries" && (
                <ChipGroup options={INDUSTRIES} selected={(vals.targetIndustries as string[]) ?? []} onToggle={(v) => toggleChip("targetIndustries", v)} />
              )}
              {f.kind === "geos" && (
                <ChipGroup options={GEOGRAPHIES} selected={(vals.targetGeographies as string[]) ?? []} onToggle={(v) => toggleChip("targetGeographies", v)} />
              )}
              {f.kind === "size" && (
                <SizeGroup value={(vals.companySizeRange as string) ?? ""} onChange={(v) => setText("companySizeRange", v)} />
              )}
            </Field>
          ))}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => { onApply(vals); onClose(); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add to profile
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsClient({ organization, businessProfile, user }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("workspace");

  // Workspace form
  const [orgName, setOrgName] = useState(organization.name);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Business profile form
  const bp = businessProfile;
  const [companyName, setCompanyName] = useState(bp?.companyName ?? "");
  const [website, setWebsite] = useState(bp?.website ?? "");
  const [serviceOffered, setServiceOffered] = useState(bp?.serviceOffered ?? "");
  const [icpDescription, setIcpDescription] = useState(bp?.icpDescription ?? "");
  const [targetIndustries, setTargetIndustries] = useState<string[]>(bp?.targetIndustries ?? []);
  const [targetGeographies, setTargetGeographies] = useState<string[]>(bp?.targetGeographies ?? []);
  const [companySizeRange, setCompanySizeRange] = useState(bp?.companySizeRange ?? "");
  const [painPointsSolved, setPainPointsSolved] = useState(bp?.painPointsSolved ?? "");
  const [offerPositioning, setOfferPositioning] = useState(bp?.offerPositioning ?? "");
  const [outreachTone, setOutreachTone] = useState(bp?.outreachTone ?? "professional");
  const [bpLoading, setBpLoading] = useState(false);
  const [bpSaved, setBpSaved] = useState(false);
  const [bpError, setBpError] = useState("");

  // Website import
  const [importUrl, setImportUrl] = useState(bp?.website ?? "");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importNote, setImportNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<(keyof ProfileValues)[]>([]);

  /** Merge a partial set of field values into the business profile form. */
  function applyFields(p: Partial<ProfileValues>) {
    if (p.companyName !== undefined) setCompanyName(p.companyName);
    if (p.website !== undefined) setWebsite(p.website);
    if (p.serviceOffered !== undefined) setServiceOffered(p.serviceOffered);
    if (p.icpDescription !== undefined) setIcpDescription(p.icpDescription);
    if (p.painPointsSolved !== undefined) setPainPointsSolved(p.painPointsSolved);
    if (p.offerPositioning !== undefined) setOfferPositioning(p.offerPositioning);
    if (p.targetIndustries !== undefined) setTargetIndustries(p.targetIndustries);
    if (p.targetGeographies !== undefined) setTargetGeographies(p.targetGeographies);
    if (p.companySizeRange !== undefined) setCompanySizeRange(p.companySizeRange);
    if (p.outreachTone !== undefined) setOutreachTone(p.outreachTone);
  }

  async function handleAnalyzeWebsite() {
    const u = importUrl.trim();
    if (!u || importing) return;
    setImporting(true);
    setImportError("");
    setImportNote("");
    try {
      const res = await fetch("/api/business-profile/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id, url: u }),
      });
      const data = await res.json() as {
        draft?: Record<string, unknown>;
        confidence?: number;
        analyzedUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setImportError(typeof data.error === "string" ? data.error : "We couldn't read that website. Try again or fill the form in manually.");
        return;
      }

      const draft = data.draft ?? {};
      const str = (k: string) => { const v = draft[k]; return typeof v === "string" ? v.trim() : ""; };
      const list = (k: string) => {
        const v = draft[k];
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()) : [];
      };
      // The extractor defaults geographies to ["Global"] when it can't tell —
      // treat that as "not found" so we ask rather than silently committing it.
      const geos = list("targetGeographies");
      const geosKnown = geos.length > 0 && !(geos.length === 1 && geos[0] === "Global");

      // Apply everything the AI actually found.
      const found: Partial<ProfileValues> = { website: data.analyzedUrl || u };
      if (str("companyName")) found.companyName = str("companyName");
      if (str("serviceOffered")) found.serviceOffered = str("serviceOffered");
      if (str("icpDescription")) found.icpDescription = str("icpDescription");
      if (str("painPointsSolved")) found.painPointsSolved = str("painPointsSolved");
      if (str("offerPositioning")) found.offerPositioning = str("offerPositioning");
      if (list("targetIndustries").length) found.targetIndustries = list("targetIndustries");
      if (geosKnown) found.targetGeographies = geos;
      if (str("companySizeRange")) found.companySizeRange = str("companySizeRange");
      if (str("outreachTone")) found.outreachTone = str("outreachTone");
      applyFields(found);

      // Determine which fields the AI couldn't fill → ask the user for those.
      const missing: (keyof ProfileValues)[] = [];
      if (!str("companyName") && !companyName.trim()) missing.push("companyName");
      if (!str("serviceOffered")) missing.push("serviceOffered");
      if (!str("icpDescription")) missing.push("icpDescription");
      if (!str("painPointsSolved")) missing.push("painPointsSolved");
      if (!str("offerPositioning")) missing.push("offerPositioning");
      if (!list("targetIndustries").length) missing.push("targetIndustries");
      if (!geosKnown) missing.push("targetGeographies");
      if (!str("companySizeRange")) missing.push("companySizeRange");

      const lowConfidence = typeof data.confidence === "number" && data.confidence < 0.4;
      if (missing.length) {
        setMissingFields(missing);
        setDialogOpen(true);
        setImportNote("We filled in what we could — just a few details left to complete.");
      } else if (lowConfidence) {
        setImportNote("Imported — but we weren't very confident. Please double-check the details before saving.");
      } else {
        setImportNote("Imported from your website. Review the details below, then save.");
      }
    } catch {
      setImportError("Something went wrong reading that website. Try again or fill the form in manually.");
    } finally {
      setImporting(false);
    }
  }

  async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setOrgLoading(true);
    setOrgError("");
    setOrgSaved(false);

    const res = await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: organization.id, name: orgName }),
    });

    setOrgLoading(false);
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setOrgError(typeof data.error === "string" ? data.error : "Failed to update workspace");
      return;
    }

    setOrgSaved(true);
    router.refresh();
    setTimeout(() => setOrgSaved(false), 3000);
  }

  async function handleSaveBusinessProfile(e: React.FormEvent) {
    e.preventDefault();
    setBpLoading(true);
    setBpError("");
    setBpSaved(false);

    const res = await fetch("/api/business-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: organization.id,
        companyName,
        website: website || undefined,
        serviceOffered,
        icpDescription,
        targetIndustries,
        targetGeographies,
        companySizeRange: companySizeRange || undefined,
        painPointsSolved,
        offerPositioning,
        outreachTone,
      }),
    });

    setBpLoading(false);
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setBpError(typeof data.error === "string" ? data.error : "Failed to save profile");
      return;
    }

    setBpSaved(true);
    router.refresh();
    setTimeout(() => setBpSaved(false), 3000);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "workspace", label: "Workspace" },
    { id: "business", label: "Business Profile" },
    { id: "account", label: "Your Account" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Workspace tab */}
      {tab === "workspace" && (
        <form onSubmit={handleSaveWorkspace} className="space-y-6">
          {orgError && (
            <div className="rounded-lg bg-secondary/40 px-4 py-3 text-destructive text-sm">
              {orgError}
            </div>
          )}

          <section className="border-t border-border pt-8 space-y-4">
            <h2 className="text-sm font-semibold">Workspace details</h2>

            <Field label="Workspace name">
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                placeholder="Acme Agency"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Slug</p>
                <p className="text-xs tabular-nums bg-secondary/40 px-3 py-2 rounded-lg border border-border">{organization.slug}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Plan</p>
                <p className="capitalize px-3 py-2 text-xs">{organization.plan.toLowerCase()}</p>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <SaveButton loading={orgLoading} saved={orgSaved} />
          </div>
        </form>
      )}

      {/* Business Profile tab */}
      {tab === "business" && (
        <div className="space-y-6">
          {FEATURES.websiteImport && (
            <WebsiteImportCard
              url={importUrl}
              setUrl={setImportUrl}
              loading={importing}
              error={importError}
              note={importNote}
              onAnalyze={handleAnalyzeWebsite}
            />
          )}

          <form onSubmit={handleSaveBusinessProfile} className="space-y-6">
            {bpError && (
              <div className="rounded-lg bg-secondary/40 px-4 py-3 text-destructive text-sm">
                {bpError}
              </div>
            )}

            <section className="border-t border-border pt-8 space-y-5">
              <div>
                <h2 className="text-sm font-semibold">Business & ICP</h2>
                <p className="text-muted-foreground text-xs mt-1">Flowfiy uses this to research and qualify leads. Be specific.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Company name">
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Your company" className={inputCls} />
                </Field>
                <Field label="Website (optional)">
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputCls} />
                </Field>
              </div>

              <Field label="Service you offer">
                <textarea value={serviceOffered} onChange={(e) => setServiceOffered(e.target.value)} required rows={2} placeholder="e.g. We build AI-powered marketing funnels for B2B SaaS companies" className={textareaCls} />
              </Field>

              <Field label="Describe your ideal customer">
                <textarea value={icpDescription} onChange={(e) => setIcpDescription(e.target.value)} required rows={2} placeholder="e.g. B2B SaaS founders with 10-50 employees struggling with lead generation" className={textareaCls} />
              </Field>

              <Field label="Target industries (select up to 5)">
                <ChipGroup options={INDUSTRIES} selected={targetIndustries} onToggle={(v) => setTargetIndustries((prev) => toggleArr(prev, v))} />
              </Field>

              <Field label="Target geographies">
                <ChipGroup options={GEOGRAPHIES} selected={targetGeographies} onToggle={(v) => setTargetGeographies((prev) => toggleArr(prev, v))} />
              </Field>

              <Field label="Target company size">
                <SizeGroup value={companySizeRange} onChange={setCompanySizeRange} />
              </Field>

              <Field label="Pain points you solve">
                <textarea value={painPointsSolved} onChange={(e) => setPainPointsSolved(e.target.value)} required rows={2} placeholder="e.g. Poor lead quality, inconsistent pipeline, time wasted on manual prospecting" className={textareaCls} />
              </Field>

              <Field label="Your offer positioning">
                <textarea value={offerPositioning} onChange={(e) => setOfferPositioning(e.target.value)} required rows={2} placeholder="e.g. We guarantee 20 qualified discovery calls in 90 days or we work for free" className={textareaCls} />
              </Field>

              <Field label="Outreach tone">
                <div className="flex gap-2 mt-1">
                  {[
                    { value: "professional", label: "Professional" },
                    { value: "conversational", label: "Conversational" },
                    { value: "direct", label: "Direct" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOutreachTone(value)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                        outreachTone === value
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </section>

            <div className="flex justify-end">
              <SaveButton loading={bpLoading} saved={bpSaved} />
            </div>
          </form>

          {dialogOpen && (
            <MissingInfoDialog
              missing={missingFields}
              defaults={{
                companyName, serviceOffered, icpDescription, painPointsSolved, offerPositioning,
                targetIndustries, targetGeographies, companySizeRange, outreachTone, website,
              }}
              onApply={applyFields}
              onClose={() => setDialogOpen(false)}
            />
          )}
        </div>
      )}

      {/* Account tab */}
      {tab === "account" && (
        <div className="space-y-8">
          <section className="border-t border-border pt-8 space-y-4">
            <h2 className="text-sm font-semibold">Your account</h2>
            <div className="divide-y divide-border text-sm">
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize px-2.5 py-0.5 bg-secondary/40 rounded-full text-xs border border-border">
                  {user.role.toLowerCase()}
                </span>
              </div>
            </div>
          </section>

          <section className="border-t border-border pt-8">
            <h2 className="text-sm font-semibold mb-1">Workspace membership</h2>
            <p className="text-muted-foreground text-xs mb-3">You are {user.role === "OWNER" ? "the owner" : `a ${user.role.toLowerCase()}`} of this workspace.</p>
            <div className="text-xs text-muted-foreground">
              To change your email address or delete your account, contact <span className="text-foreground">support@flowfiy.com</span>.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
