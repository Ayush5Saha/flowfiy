"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ArrowUpDown, Copy, Check, Pencil, X, Save,
  CheckCircle, XCircle, Clock, Mail, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignLead {
  status: string;
  followUpStep: number;
  sentAt?: Date | string | null;
  campaign?: { name: string } | null;
}

interface Lead {
  id: string;
  createdAt: Date | string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  title?: string | null;
  industry?: string | null;
  city?: string | null;
  companyWebsite?: string | null;
  email?: string | null;
  whatsApp?: string | null;
  source?: string | null;
  qualificationScore?: number | null;
  status: string;
  waStatus?: string | null;
  notes?: string | null;
  research?: {
    opportunityAngle?: string | null;
    researchMetadata?: unknown;
  } | null;
  outreachCopies?: Array<{
    id: string;
    subjectLine?: string | null;
    body: string;
    isApproved: boolean;
  }>;
  campaignLeads?: CampaignLead[];
}

interface LeadDataTableProps {
  leads: Lead[];
  isProcessing: boolean;
  organizationId: string;
  listId: string;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS = [
  { key: "dateAdded",     label: "Date Added",      width: 100, sticky: false },
  { key: "contactName",   label: "Contact Name",     width: 160, sticky: true  },
  { key: "company",       label: "Company",          width: 160, sticky: true  },
  { key: "role",          label: "Role",             width: 140, sticky: false },
  { key: "companyType",   label: "Company Type",     width: 130, sticky: false },
  { key: "city",          label: "City",             width: 110, sticky: false },
  { key: "website",       label: "Website",          width: 160, sticky: false },
  { key: "email",         label: "Email",            width: 200, sticky: false },
  { key: "whatsApp",      label: "WhatsApp",         width: 140, sticky: false },
  { key: "leadSource",    label: "Lead Source",      width: 110, sticky: false },
  { key: "score",         label: "Score",            width: 70,  sticky: false },
  { key: "gapIdentified", label: "Gap Identified",   width: 220, sticky: false },
  { key: "subjectLine",   label: "Subject Line",     width: 220, sticky: false },
  { key: "emailStatus",   label: "Email Status",     width: 120, sticky: false },
  { key: "waStatus",      label: "WA Status",        width: 110, sticky: false },
  { key: "followupStage", label: "Follow-up Stage",  width: 130, sticky: false },
  { key: "replyStatus",   label: "Reply Status",     width: 110, sticky: false },
  { key: "meetingBooked", label: "Meeting Booked",   width: 130, sticky: false },
  { key: "draftId",       label: "Draft ID",         width: 130, sticky: false },
  { key: "notes",         label: "Notes",            width: 200, sticky: false },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

function truncate(s: string | null | undefined, n = 40) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function scoreColor(s: number) {
  if (s >= 80) return "text-green-400";
  if (s >= 60) return "text-blue-400";
  if (s >= 40) return "text-yellow-400";
  return "text-muted-foreground";
}

function emailStatusColor(s: string) {
  if (s === "REPLIED") return "text-green-400 bg-green-400/10";
  if (s === "OPENED") return "text-blue-400 bg-blue-400/10";
  if (s === "SENT") return "text-muted-foreground bg-secondary";
  if (s === "BOUNCED") return "text-red-400 bg-red-400/10";
  if (s === "UNSUBSCRIBED") return "text-orange-400 bg-orange-400/10";
  return "text-muted-foreground bg-secondary";
}

function getGap(lead: Lead) {
  const meta = (lead.research?.researchMetadata ?? {}) as Record<string, unknown>;
  const gaps = Array.isArray(meta.serviceGaps) ? (meta.serviceGaps as string[]) : [];
  if (gaps.length > 0) return gaps.slice(0, 2).join(", ");
  return lead.research?.opportunityAngle ?? "—";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LeadDataTable({ leads, isProcessing, organizationId, listId }: LeadDataTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "QUALIFIED" | "DISQUALIFIED">("ALL");
  const [sortKey, setSortKey] = useState<ColKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    new Set(COLUMNS.map((c) => c.key))
  );
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh while processing
  useEffect(() => {
    if (!isProcessing) return;
    const iv = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(iv);
  }, [isProcessing, router]);

  // Close col picker on outside click
  useEffect(() => {
    if (!showColPicker) return;
    function handler(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
        setShowColPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColPicker]);

  async function saveNotes(leadId: string, notes: string) {
    setSavingNotes(true);
    await fetch(`/api/leads/${listId}/lead/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, organizationId }),
    });
    setSavingNotes(false);
    setEditingNotes(null);
    router.refresh();
  }

  async function copyDraftId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const q = search.toLowerCase().trim();
  const filtered = leads
    .filter((l) => {
      if (filter === "QUALIFIED" && l.status !== "QUALIFIED" && l.status !== "CONTACTED" && l.status !== "REPLIED" && l.status !== "MEETING_BOOKED") return false;
      if (filter === "DISQUALIFIED" && l.status !== "DISQUALIFIED") return false;
      if (!q) return true;
      const name = `${l.firstName ?? ""} ${l.lastName ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (l.companyName ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.title ?? "").toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "score") cmp = (a.qualificationScore ?? -1) - (b.qualificationScore ?? -1);
      else if (sortKey === "contactName") cmp = (`${a.firstName ?? ""} ${a.lastName ?? ""}`).localeCompare(`${b.firstName ?? ""} ${b.lastName ?? ""}`);
      else if (sortKey === "company") cmp = (a.companyName ?? "").localeCompare(b.companyName ?? "");
      else if (sortKey === "dateAdded") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? cmp : -cmp;
    });

  function toggleSort(key: ColKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(key !== "score"); }
  }

  const activeCols = COLUMNS.filter((c) => visibleCols.has(c.key));
  // Calculate sticky offsets
  const stickyOffsets: Record<string, number> = {};
  let stickyOffset = 0;
  for (const col of activeCols) {
    if (col.sticky) {
      stickyOffsets[col.key] = stickyOffset;
      stickyOffset += col.width;
    }
  }

  if (leads.length === 0 && !isProcessing) {
    return (
      <div className="border-t border-border pt-12 text-center">
        <p className="text-sm font-medium">No leads yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30 flex-wrap">
        {/* Filter tabs */}
        {(["ALL", "QUALIFIED", "DISQUALIFIED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {f === "ALL" ? `All (${leads.length})` : f === "QUALIFIED"
              ? `Qualified (${leads.filter((l) => ["QUALIFIED","CONTACTED","REPLIED","MEETING_BOOKED"].includes(l.status)).length})`
              : `Disqualified (${leads.filter((l) => l.status === "DISQUALIFIED").length})`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="pl-7 pr-3 py-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-40 placeholder:text-muted-foreground"
            />
          </div>

          {/* Column picker */}
          <div className="relative" ref={colPickerRef}>
            <button
              onClick={() => setShowColPicker((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Columns <ChevronDown className="w-3 h-3" />
            </button>
            {showColPicker && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg z-30 p-3 min-w-[200px] grid grid-cols-2 gap-1">
                {COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-foreground text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={visibleCols.has(col.key)}
                      onChange={(e) => {
                        const next = new Set(visibleCols);
                        if (e.target.checked) next.add(col.key);
                        else if (next.size > 3) next.delete(col.key); // always keep ≥3
                        setVisibleCols(next);
                      }}
                      className="accent-primary"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto flex-1 max-h-[70vh]">
        <table className="text-xs border-collapse" style={{ minWidth: activeCols.reduce((s, c) => s + c.width, 0) + "px" }}>
          <thead className="sticky top-0 z-20 bg-secondary/80 backdrop-blur-sm">
            <tr>
              {activeCols.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    minWidth: col.width,
                    ...(col.sticky ? { position: "sticky", left: stickyOffsets[col.key], zIndex: 30, background: "hsl(var(--secondary) / 0.9)" } : {}),
                  }}
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground uppercase tracking-wide text-[10px] border-b border-border whitespace-nowrap"
                >
                  {["score","contactName","company","dateAdded"].includes(col.key) ? (
                    <button
                      onClick={() => toggleSort(col.key as ColKey)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown className="w-2.5 h-2.5" />
                      {sortKey === col.key && (sortAsc ? "↑" : "↓")}
                    </button>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {filtered.map((lead) => {
              const cl = lead.campaignLeads?.[0];
              const copy = lead.outreachCopies?.[0];
              const isMeetingBooked = lead.status === "MEETING_BOOKED";
              const isReplied = lead.status === "REPLIED" || cl?.status === "REPLIED";

              return (
                <tr key={lead.id} className="hover:bg-secondary/30 transition-colors group">
                  {activeCols.map((col) => {
                    const cellClass = `px-3 py-2.5 align-top border-b border-border/30 ${col.sticky ? "bg-card group-hover:bg-secondary/30" : ""}`;
                    const stickyStyle = col.sticky ? { position: "sticky" as const, left: stickyOffsets[col.key], zIndex: 10 } : {};

                    switch (col.key) {
                      case "dateAdded":
                        return <td key={col.key} style={stickyStyle} className={cellClass}><span className="text-muted-foreground">{fmtDate(lead.createdAt)}</span></td>;

                      case "contactName":
                        return (
                          <td key={col.key} style={stickyStyle} className={cellClass}>
                            <div className="flex items-center gap-1.5">
                              <StatusDot status={lead.status} />
                              <span className="font-medium text-foreground whitespace-nowrap">
                                {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                              </span>
                            </div>
                          </td>
                        );

                      case "company":
                        return <td key={col.key} style={stickyStyle} className={cellClass}><span className="font-medium text-foreground whitespace-nowrap">{lead.companyName ?? "—"}</span></td>;

                      case "role":
                        return <td key={col.key} className={cellClass}><span className="text-muted-foreground">{truncate(lead.title, 30)}</span></td>;

                      case "companyType":
                        return <td key={col.key} className={cellClass}><span className="text-muted-foreground">{lead.industry ?? "—"}</span></td>;

                      case "city":
                        return <td key={col.key} className={cellClass}><span className="text-muted-foreground">{lead.city ?? "—"}</span></td>;

                      case "website":
                        return (
                          <td key={col.key} className={cellClass}>
                            {lead.companyWebsite ? (
                              <a href={lead.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block max-w-[150px]">
                                {lead.companyWebsite.replace(/^https?:\/\//, "")}
                              </a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "email":
                        return (
                          <td key={col.key} className={cellClass}>
                            {lead.email ? (
                              <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline truncate block max-w-[190px]">{lead.email}</a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "whatsApp":
                        return (
                          <td key={col.key} className={cellClass}>
                            {lead.whatsApp ? (
                              <a href={`https://wa.me/${lead.whatsApp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                                {lead.whatsApp}
                              </a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "leadSource":
                        return <td key={col.key} className={cellClass}><span className="text-muted-foreground capitalize">{lead.source ?? "—"}</span></td>;

                      case "score":
                        return (
                          <td key={col.key} className={cellClass}>
                            {lead.qualificationScore != null ? (
                              <span className={`tabular-nums font-bold ${scoreColor(lead.qualificationScore)}`}>{lead.qualificationScore}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "gapIdentified":
                        return (
                          <td key={col.key} className={cellClass}>
                            <span className="text-orange-400 text-[11px] leading-snug">{truncate(getGap(lead), 60)}</span>
                          </td>
                        );

                      case "subjectLine":
                        return (
                          <td key={col.key} className={cellClass}>
                            <span className="text-foreground/80">{truncate(copy?.subjectLine, 50)}</span>
                          </td>
                        );

                      case "emailStatus":
                        return (
                          <td key={col.key} className={cellClass}>
                            {cl ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${emailStatusColor(cl.status)}`}>
                                {cl.status}
                              </span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "waStatus":
                        return (
                          <td key={col.key} className={cellClass}>
                            {lead.waStatus ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-400/10 text-green-400 capitalize">{lead.waStatus}</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "followupStage":
                        return (
                          <td key={col.key} className={cellClass}>
                            {cl && cl.followUpStep > 0 ? (
                              <span className="text-blue-400">FU-{cl.followUpStep}</span>
                            ) : cl ? (
                              <span className="text-muted-foreground">Initial</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "replyStatus":
                        return (
                          <td key={col.key} className={cellClass}>
                            {isReplied ? (
                              <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> Replied</span>
                            ) : <span className="text-muted-foreground">No reply</span>}
                          </td>
                        );

                      case "meetingBooked":
                        return (
                          <td key={col.key} className={cellClass}>
                            {isMeetingBooked ? (
                              <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle className="w-3 h-3" /> Booked</span>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "draftId":
                        return (
                          <td key={col.key} className={cellClass}>
                            {copy?.id ? (
                              <button
                                onClick={() => void copyDraftId(copy.id)}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-mono text-[10px]"
                              >
                                {copied === copy.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                {copy.id.slice(0, 8)}…
                              </button>
                            ) : <span className="text-muted-foreground">—</span>}
                          </td>
                        );

                      case "notes":
                        return (
                          <td key={col.key} className={`${cellClass} min-w-[200px]`}>
                            {editingNotes === lead.id ? (
                              <div className="flex items-start gap-1">
                                <textarea
                                  autoFocus
                                  value={notesValue}
                                  onChange={(e) => setNotesValue(e.target.value)}
                                  rows={2}
                                  className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                                />
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => void saveNotes(lead.id, notesValue)}
                                    disabled={savingNotes}
                                    className="p-1 rounded hover:bg-green-500/10 text-green-400 disabled:opacity-50"
                                  ><Save className="w-3 h-3" /></button>
                                  <button
                                    onClick={() => setEditingNotes(null)}
                                    className="p-1 rounded hover:bg-secondary text-muted-foreground"
                                  ><X className="w-3 h-3" /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1 group/notes">
                                <span className="text-muted-foreground flex-1">{truncate(lead.notes, 50)}</span>
                                <button
                                  onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes ?? ""); }}
                                  className="opacity-0 group-hover/notes:opacity-100 p-0.5 rounded hover:bg-secondary text-muted-foreground transition-opacity shrink-0"
                                ><Pencil className="w-3 h-3" /></button>
                              </div>
                            )}
                          </td>
                        );

                      default:
                        return <td key={(col as { key: string }).key} className={cellClass}>—</td>;
                    }
                  })}
                </tr>
              );
            })}

            {/* Skeleton rows while processing */}
            {isProcessing && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {activeCols.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 border-b border-border/30">
                    <div className="h-3 skeleton rounded" style={{ width: Math.floor(col.width * 0.6) }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && !isProcessing && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No leads match your filter.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>{filtered.length} of {leads.length} leads</span>
        <span>Hover Notes column to edit</span>
        <span className="ml-auto">Scroll horizontally to see all columns →</span>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "QUALIFIED" || status === "CONTACTED" || status === "REPLIED" || status === "MEETING_BOOKED")
    return <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />;
  if (status === "DISQUALIFIED")
    return <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  if (status === "RESEARCHING")
    return <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />;
  if (status === "CONTACTED")
    return <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  return <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />;
}
