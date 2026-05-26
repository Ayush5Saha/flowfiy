"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, ChevronRight, CheckCircle, XCircle, Clock, Copy, Check, Search, ArrowUpDown } from "lucide-react";
import { OutreachPanel } from "@/components/leads/OutreachPanel";

interface Lead {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  title?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  industry?: string | null;
  status: string;
  qualificationScore?: number | null;
  research?: {
    opportunityAngle?: string | null;
    painPointMatch?: string | null;
    companyAnalysis?: unknown;
    researchMetadata?: unknown;
  } | null;
  outreachCopies?: Array<{
    id: string;
    subjectLine?: string | null;
    body: string;
    followUp1?: string | null;
    followUp2?: string | null;
    isApproved: boolean;
  }>;
}

interface LeadTableClientProps {
  leads: Lead[];
  isProcessing: boolean;
  organizationId: string;
  listId: string;
}

type SortKey = "score" | "name" | "company";

export function LeadTableClient({ leads, isProcessing, organizationId, listId }: LeadTableClientProps) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<"ALL" | "QUALIFIED" | "DISQUALIFIED">("ALL");
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [showSort, setShowSort] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key !== "score"); // score descending by default, others ascending
    }
    setShowSort(false);
  }

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSort) return;
    function handleClick() { setShowSort(false); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showSort]);

  // Poll for updates while processing
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(interval);
  }, [isProcessing, router]);

  // Keyboard shortcuts: Escape to deselect, C to copy email
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") setSelectedLead(null);
      if (e.key === "c" && selectedLead) {
        const copy = selectedLead.outreachCopies?.[0];
        if (!copy) return;
        const text = `Subject: ${copy.subjectLine ?? ""}\n\n${copy.body}`;
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(selectedLead.id);
          setTimeout(() => setCopied(null), 2000);
        });
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectedLead]);

  async function quickCopyEmail(lead: Lead, e: React.MouseEvent) {
    e.stopPropagation();
    const copy = lead.outreachCopies?.[0];
    if (!copy) return;
    const text = `Subject: ${copy.subjectLine ?? ""}\n\n${copy.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(lead.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const q = search.toLowerCase().trim();
  const filtered = leads
    .filter((l) => {
      // Status filter
      if (filter === "QUALIFIED" && l.status !== "QUALIFIED" && l.status !== "CONTACTED") return false;
      if (filter === "DISQUALIFIED" && l.status !== "DISQUALIFIED") return false;
      // Search filter
      if (q) {
        const name = `${l.firstName ?? ""} ${l.lastName ?? ""}`.toLowerCase();
        const company = (l.companyName ?? "").toLowerCase();
        const email = (l.email ?? "").toLowerCase();
        const title = (l.title ?? "").toLowerCase();
        return name.includes(q) || company.includes(q) || email.includes(q) || title.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") {
        cmp = (a.qualificationScore ?? -1) - (b.qualificationScore ?? -1);
      } else if (sortKey === "name") {
        const na = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
        const nb = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
        cmp = na.localeCompare(nb);
      } else if (sortKey === "company") {
        const ca = (a.companyName ?? "").toLowerCase();
        const cb = (b.companyName ?? "").toLowerCase();
        cmp = ca.localeCompare(cb);
      }
      return sortAsc ? cmp : -cmp;
    });

  if (leads.length === 0 && !isProcessing) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">No leads yet.</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-5 ${selectedLead ? "h-[calc(100vh-280px)]" : ""}`}>
      {/* Lead list */}
      <div className={`flex flex-col ${selectedLead ? "w-1/2" : "w-full"} bg-card border border-border rounded-xl overflow-hidden`}>
        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-secondary/30">
          {(["ALL", "QUALIFIED", "DISQUALIFIED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "ALL" ? `All (${leads.length})` : f === "QUALIFIED"
                ? `Qualified (${leads.filter((l) => l.status === "QUALIFIED" || l.status === "CONTACTED").length})`
                : `Disqualified (${leads.filter((l) => l.status === "DISQUALIFIED").length})`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortKey === "score" ? "Score" : sortKey === "name" ? "Name" : "Company"}
                {sortAsc ? " ↑" : " ↓"}
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  {(["score", "name", "company"] as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleSort(key)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        sortKey === key ? "text-foreground bg-secondary/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      }`}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                      {sortKey === key && (sortAsc ? " ↑" : " ↓")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-7 pr-3 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-36 placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Lead rows */}
        <div className="overflow-y-auto flex-1">
          {filtered.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
              className={`w-full flex items-center gap-4 px-4 py-3 border-b border-border text-left hover:bg-secondary/50 transition-colors ${
                selectedLead?.id === lead.id ? "bg-secondary/70" : ""
              }`}
            >
              <StatusIcon status={lead.status} score={lead.qualificationScore} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {lead.firstName} {lead.lastName}
                  </span>
                  {lead.email && (
                    <Mail className="w-3 h-3 text-green-400 shrink-0" aria-label="Email available" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {lead.title} · {lead.companyName}
                </p>
                {(lead.status === "QUALIFIED" || lead.status === "CONTACTED") && (
                  <ServiceGapChips metadata={lead.research?.researchMetadata} />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lead.qualificationScore !== null && lead.qualificationScore !== undefined && (
                  <span className={`text-xs font-mono font-medium ${
                    lead.qualificationScore >= 70 ? "text-green-400" : "text-muted-foreground"
                  }`}>
                    {lead.qualificationScore}
                  </span>
                )}
                {(lead.status === "QUALIFIED" || lead.status === "CONTACTED") && lead.outreachCopies?.[0] && (
                  <button
                    onClick={(e) => void quickCopyEmail(lead, e)}
                    title="Copy email to clipboard"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {copied === lead.id ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
            </button>
          ))}

          {isProcessing && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border">
              <div className="w-6 h-6 rounded-full skeleton shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 skeleton rounded w-32" />
                <div className="h-2.5 skeleton rounded w-48" />
              </div>
            </div>
          ))}

          {/* Keyboard hint footer */}
          {filtered.length > 0 && (
            <div className="px-4 py-2 bg-secondary/20 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Click to open</span>
              <span className="px-1.5 py-0.5 bg-secondary rounded border border-border font-mono">C</span>
              <span>Copy email</span>
              <span className="px-1.5 py-0.5 bg-secondary rounded border border-border font-mono">Esc</span>
              <span>Close</span>
            </div>
          )}
        </div>
      </div>

      {/* Outreach panel */}
      {selectedLead && (
        <div className="w-1/2 overflow-y-auto">
          <OutreachPanel
            lead={selectedLead}
            organizationId={organizationId}
            onClose={() => setSelectedLead(null)}
          />
        </div>
      )}
    </div>
  );
}

function ServiceGapChips({ metadata }: { metadata?: unknown }) {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const gaps = Array.isArray(meta.serviceGaps) ? (meta.serviceGaps as string[]) : [];
  if (gaps.length === 0) return null;
  const visible = gaps.slice(0, 3);
  const overflow = gaps.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {visible.map((gap, i) => (
        <span
          key={i}
          className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5 text-[10px] leading-tight"
          title={gap}
        >
          {gap.length > 40 ? gap.slice(0, 38) + "…" : gap}
        </span>
      ))}
      {overflow > 0 && (
        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full px-2 py-0.5 text-[10px] leading-tight">
          +{overflow} more
        </span>
      )}
    </div>
  );
}

function StatusIcon({ status, score }: { status: string; score?: number | null }) {
  if (status === "QUALIFIED") return <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />;
  if (status === "DISQUALIFIED") return <XCircle className="w-5 h-5 text-muted-foreground shrink-0" />;
  if (status === "RESEARCHING") return <Clock className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />;
  if (status === "CONTACTED") return <Mail className="w-5 h-5 text-blue-400 shrink-0" />;
  return (
    <div className="w-5 h-5 rounded-full border border-border shrink-0 flex items-center justify-center">
      <span className="text-[8px] text-muted-foreground font-mono">{score ?? "?"}</span>
    </div>
  );
}
