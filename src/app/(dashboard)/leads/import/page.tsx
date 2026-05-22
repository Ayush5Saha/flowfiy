"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Upload, ChevronRight, Check, Loader2,
  FileText, AlertCircle, X, RefreshCw,
} from "lucide-react";

// ── CSV parser (no external dependency) ───────────────────────────────────────

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim()); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = parseCSVRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  });
  return { headers, rows };
}

// ── Column auto-detection ─────────────────────────────────────────────────────

const FIELD_PATTERNS: Record<string, RegExp> = {
  firstName: /first.?name|fname|given.?name/i,
  lastName: /last.?name|lname|surname|family.?name/i,
  email: /^email|e.?mail|email.?address/i,
  title: /^title|job.?title|position|role/i,
  companyName: /company|org(anization)?|employer|account/i,
  companyWebsite: /website|domain|url|company.?url|web/i,
  companySize: /size|employees|headcount|team.?size/i,
  industry: /industry|sector|vertical|market/i,
  linkedinUrl: /linkedin/i,
};

function autoDetect(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(header) && !Object.values(mapping).includes(header)) {
        mapping[field] = header;
        break;
      }
    }
  }
  return mapping;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TARGET_FIELDS = [
  { id: "firstName", label: "First Name", required: false },
  { id: "lastName", label: "Last Name", required: false },
  { id: "email", label: "Email", required: false },
  { id: "title", label: "Job Title", required: false },
  { id: "companyName", label: "Company Name", required: true },
  { id: "companyWebsite", label: "Company Website", required: false },
  { id: "companySize", label: "Company Size", required: false },
  { id: "industry", label: "Industry", required: false },
  { id: "linkedinUrl", label: "LinkedIn URL", required: false },
] as const;

type FieldId = typeof TARGET_FIELDS[number]["id"];

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Partial<Record<FieldId, string>>>({});
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Pull organizationId from a data attribute set by the layout — we read it via a hidden field pattern.
  // Since this is a client component inside the dashboard layout, we fetch it from the API on submit.

  function handleFile(file: File) {
    setParseError("");
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setParseError("Please upload a .csv file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError("File too large. Maximum size is 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0 || rows.length === 0) {
        setParseError("Could not parse CSV. Make sure the file has a header row and at least one data row.");
        return;
      }
      if (rows.length > 500) {
        setParseError(`CSV has ${rows.length} rows. Maximum is 500 per import.`);
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      setFileName(file.name);
      setMapping(autoDetect(headers));
      setListName(file.name.replace(/\.csv$/i, "").replace(/[-_]/g, " "));
      setStep(2);
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the mapped lead rows for preview/submission
  function getMappedLeads() {
    return csvRows.map((row) => {
      const lead: Record<string, string> = {};
      for (const field of TARGET_FIELDS) {
        const col = mapping[field.id];
        if (col) lead[field.id] = row[col] ?? "";
      }
      return lead;
    }).filter((l) => l.companyName?.trim());
  }

  const mappedLeads = getMappedLeads();
  const hasCompanyNameMapping = !!mapping.companyName;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");

    // Fetch org ID from the current session
    const orgRes = await fetch("/api/organizations");
    if (!orgRes.ok) { setSubmitError("Could not load workspace. Please refresh."); setSubmitting(false); return; }
    const orgData = await orgRes.json() as { organizations: { id: string }[] };
    const organizationId = orgData.organizations[0]?.id;
    if (!organizationId) { setSubmitError("No workspace found."); setSubmitting(false); return; }

    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        listName: listName.trim() || fileName,
        listDescription: listDescription.trim() || undefined,
        leads: mappedLeads,
      }),
    });

    const data = await res.json() as { leadList?: { id: string }; error?: string };
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(typeof data.error === "string" ? data.error : "Import failed. Please try again.");
      return;
    }

    router.push(`/leads/${data.leadList!.id}`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Import CSV</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Upload your own leads — Flowfiy will research, qualify, and write outreach for each one
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["Upload", "Map columns", "Review & import"] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = step > n;
          const active = step === n;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                done ? "bg-primary text-primary-foreground" :
                active ? "border-2 border-primary text-primary" :
                "border border-border text-muted-foreground"
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Upload ────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-secondary/30"
            }`}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-1">Drop your CSV here, or click to browse</p>
            <p className="text-sm text-muted-foreground">Up to 500 leads · Max 5 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {parseError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Format guide */}
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Expected CSV format
            </p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["first_name", "last_name", "email", "title", "company", "website", "industry"].map((h) => (
                      <th key={h} className="text-left py-1.5 px-2 font-mono text-muted-foreground font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {["Sarah", "Chen", "s@acme.com", "VP Sales", "Acme Corp", "acme.com", "SaaS"].map((v, i) => (
                      <td key={i} className="py-1.5 px-2 text-muted-foreground">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Column names are flexible — you&apos;ll map them in the next step. Only <span className="text-foreground font-medium">Company Name</span> is required.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Map columns ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-medium text-foreground">{fileName}</span>
              <span>· {csvRows.length} rows, {csvHeaders.length} columns</span>
            </div>
            <button
              onClick={() => { setStep(1); setCsvHeaders([]); setCsvRows([]); setMapping({}); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Re-upload
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-secondary/30">
              <p className="text-sm font-medium">Map your columns to lead fields</p>
              <p className="text-xs text-muted-foreground mt-0.5">Auto-detected where possible. Only Company Name is required.</p>
            </div>
            <div className="divide-y divide-border">
              {TARGET_FIELDS.map((field) => (
                <div key={field.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.required && <span className="text-destructive ml-1 text-xs">*</span>}
                  </div>
                  <select
                    value={mapping[field.id] ?? ""}
                    onChange={(e) => setMapping((prev) => ({ ...prev, [field.id]: e.target.value || undefined }))}
                    className="text-sm bg-secondary border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring w-52"
                  >
                    <option value="">— skip —</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview first 3 rows */}
          {mappedLeads.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-medium">Preview (first 3 rows)</p>
              </div>
              <div className="divide-y divide-border">
                {mappedLeads.slice(0, 3).map((lead, i) => (
                  <div key={i} className="px-5 py-3 text-sm">
                    <p className="font-medium">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                      {lead.title && <span className="text-muted-foreground font-normal"> · {lead.title}</span>}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {lead.companyName}
                      {lead.companyWebsite && ` · ${lead.companyWebsite}`}
                      {lead.email && ` · ${lead.email}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!hasCompanyNameMapping || mappedLeads.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & import ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-medium">Ready to import</h2>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { value: mappedLeads.length, label: "leads to import" },
                { value: mappedLeads.filter((l) => l.email).length, label: "with email" },
                { value: mappedLeads.filter((l) => l.companyWebsite).length, label: "with website" },
              ].map(({ value, label }) => (
                <div key={label} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-2xl font-mono font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-sm font-medium mb-1.5">Lead list name</label>
                <input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  required
                  placeholder="Q2 Prospects from LinkedIn"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  value={listDescription}
                  onChange={(e) => setListDescription(e.target.value)}
                  placeholder="e.g. SaaS CTOs from LinkedIn Sales Navigator export"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <p className="text-sm font-medium mb-3">What happens after import</p>
            <div className="space-y-2">
              {[
                "Flowfiy analyzes your ICP to build qualification criteria",
                "Each company website is scraped for research signals",
                "Every lead is scored 0–100 against your ICP",
                "Qualified leads get a personalized 3-touch email sequence",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Apollo is not required for CSV imports — Claude AI is fully managed by Flowfiy.
            </p>
          </div>

          {/* Lead preview table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">Lead preview</p>
              <span className="text-xs text-muted-foreground">
                {mappedLeads.length > 5 ? `showing 5 of ${mappedLeads.length}` : `${mappedLeads.length} leads`}
              </span>
            </div>
            <div className="divide-y divide-border">
              {mappedLeads.slice(0, 5).map((lead, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-mono text-muted-foreground shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                      {lead.title && <span className="text-muted-foreground font-normal"> · {lead.title}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{lead.companyName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.email && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">email</span>
                    )}
                    {lead.companyWebsite && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">website</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              disabled={submitting}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !listName.trim() || mappedLeads.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Import {mappedLeads.length} leads</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
