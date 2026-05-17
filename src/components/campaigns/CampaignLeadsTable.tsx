"use client";

import { useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { EmailPreviewModal } from "./EmailPreviewModal";

interface CampaignLead {
  id: string;
  status: string;
  followUpStep: number;
  sentAt?: Date | string | null;
  gmailThreadId?: string | null;
  lead: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    title?: string | null;
    companyName?: string | null;
  };
  outreachCopy?: {
    subjectLine?: string | null;
    body: string;
    followUp1?: string | null;
    followUp2?: string | null;
  } | null;
}

interface CampaignLeadsTableProps {
  campaignLeads: CampaignLead[];
  followUp1DelayDays: number;
  followUp2DelayDays: number;
  stats: { total: number; pending: number; sent: number; replied: number };
}

const leadStatusColor: Record<string, string> = {
  PENDING: "bg-secondary text-muted-foreground",
  SENT: "bg-blue-500/10 text-blue-400",
  REPLIED: "bg-green-500/10 text-green-400",
  BOUNCED: "bg-destructive/10 text-destructive",
  OPENED: "bg-purple-500/10 text-purple-400",
  UNSUBSCRIBED: "bg-secondary text-muted-foreground",
};

export function CampaignLeadsTable({ campaignLeads, followUp1DelayDays, followUp2DelayDays, stats }: CampaignLeadsTableProps) {
  const [previewLead, setPreviewLead] = useState<CampaignLead | null>(null);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium">Leads ({stats.total})</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{stats.pending} pending</span>
          <span>·</span>
          <span>{stats.sent} sent</span>
          <span>·</span>
          <span className="text-green-400">{stats.replied} replied</span>
        </div>
      </div>

      {campaignLeads.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No leads in this campaign yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {campaignLeads.map((cl) => (
            <div key={cl.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(cl.lead.firstName?.[0] ?? cl.lead.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {cl.lead.firstName} {cl.lead.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cl.lead.title && `${cl.lead.title} · `}{cl.lead.companyName ?? cl.lead.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                {cl.outreachCopy?.subjectLine && (
                  <p className="text-xs text-muted-foreground hidden sm:block max-w-[200px] truncate">
                    {cl.outreachCopy.subjectLine}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {cl.followUpStep > 0 && (
                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                      Step {cl.followUpStep}
                    </span>
                  )}
                  {cl.sentAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(cl.sentAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Preview button */}
                {cl.outreachCopy && (
                  <button
                    onClick={() => setPreviewLead(cl)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-all"
                    title="Preview email"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Gmail link */}
                {cl.gmailThreadId && (cl.status === "REPLIED" || cl.status === "SENT") && (
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${cl.gmailThreadId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Open in Gmail"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${leadStatusColor[cl.status] ?? "bg-secondary text-muted-foreground"}`}>
                  {cl.status.charAt(0) + cl.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewLead && previewLead.outreachCopy && (
        <EmailPreviewModal
          lead={previewLead.lead}
          outreachCopy={previewLead.outreachCopy}
          followUp1DelayDays={followUp1DelayDays}
          followUp2DelayDays={followUp2DelayDays}
          onClose={() => setPreviewLead(null)}
        />
      )}
    </div>
  );
}
