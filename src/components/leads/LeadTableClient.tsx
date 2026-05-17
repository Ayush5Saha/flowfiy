"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, ChevronRight, CheckCircle, XCircle, Clock, Copy, Check, Megaphone } from "lucide-react";
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

export function LeadTableClient({ leads, isProcessing, organizationId, listId }: LeadTableClientProps) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<"ALL" | "QUALIFIED" | "DISQUALIFIED">("ALL");
  const [copied, setCopied] = useState<string | null>(null);

  // Poll for updates while processing
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(interval);
  }, [isProcessing, router]);

  async function quickCopyEmail(lead: Lead, e: React.MouseEvent) {
    e.stopPropagation();
    const copy = lead.outreachCopies?.[0];
    if (!copy) return;
    const text = `Subject: ${copy.subjectLine ?? ""}\n\n${copy.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(lead.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = leads.filter((l) => {
    if (filter === "ALL") return true;
    if (filter === "QUALIFIED") return l.status === "QUALIFIED" || l.status === "CONTACTED";
    if (filter === "DISQUALIFIED") return l.status === "DISQUALIFIED";
    return true;
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
