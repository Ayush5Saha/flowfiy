"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Calendar, Loader2, Download, MessageSquare } from "lucide-react";
import { EmailPreviewModal } from "./EmailPreviewModal";
import { useToast } from "@/components/ui/ToastProvider";

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
    status?: string | null;
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
  campaignId: string;
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
  MEETING_BOOKED: "bg-yellow-500/10 text-yellow-400",
};

type FilterTab = "ALL" | "PENDING" | "SENT" | "REPLIED" | "MEETING_BOOKED";

export function CampaignLeadsTable({ campaignLeads, campaignId, followUp1DelayDays, followUp2DelayDays, stats }: CampaignLeadsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [previewLead, setPreviewLead] = useState<CampaignLead | null>(null);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [markingMeeting, setMarkingMeeting] = useState<string | null>(null);

  function exportCsv() {
    const toExport = filter === "ALL" ? campaignLeads : filtered;
    const headers = ["First Name", "Last Name", "Email", "Company", "Title", "Status", "Sent At", "Subject"];
    const rows = toExport.map((cl) => [
      cl.lead.firstName ?? "",
      cl.lead.lastName ?? "",
      cl.lead.email ?? "",
      cl.lead.companyName ?? "",
      cl.lead.title ?? "",
      cl.status,
      cl.sentAt ? new Date(cl.sentAt).toLocaleDateString() : "",
      cl.outreachCopy?.subjectLine ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign_leads_${filter.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${toExport.length} leads to CSV`, "success");
  }

  // Local optimistic cl status overrides: clId -> status
  const [localClStatuses, setLocalClStatuses] = useState<Record<string, string>>({});
  // Local optimistic meeting-booked overrides: clId -> boolean
  const [localMeetings, setLocalMeetings] = useState<Record<string, boolean>>({});
  const [markingReplied, setMarkingReplied] = useState<string | null>(null);

  const effectiveClStatus = (cl: CampaignLead) => localClStatuses[cl.id] ?? cl.status;

  async function markAsReplied(cl: CampaignLead) {
    const current = effectiveClStatus(cl);
    if (current === "REPLIED") return;
    setMarkingReplied(cl.id);
    setLocalClStatuses((prev) => ({ ...prev, [cl.id]: "REPLIED" }));
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/campaign-leads/${cl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REPLIED" }),
      });
      if (res.ok) {
        toast("Marked as replied", "success");
        router.refresh();
      } else {
        setLocalClStatuses((prev) => ({ ...prev, [cl.id]: current }));
        toast("Failed to update", "error");
      }
    } catch {
      setLocalClStatuses((prev) => ({ ...prev, [cl.id]: current }));
      toast("Something went wrong", "error");
    } finally {
      setMarkingReplied(null);
    }
  }

  const isMeetingBooked = (cl: CampaignLead) =>
    localMeetings[cl.id] !== undefined
      ? localMeetings[cl.id]
      : cl.lead.status === "MEETING_BOOKED";

  const counts = {
    ALL: campaignLeads.length,
    PENDING: campaignLeads.filter((cl) => effectiveClStatus(cl) === "PENDING").length,
    SENT: campaignLeads.filter((cl) => ["SENT", "OPENED"].includes(effectiveClStatus(cl))).length,
    REPLIED: campaignLeads.filter((cl) => effectiveClStatus(cl) === "REPLIED").length,
    MEETING_BOOKED: campaignLeads.filter((cl) => isMeetingBooked(cl)).length,
  };

  const filtered = campaignLeads.filter((cl) => {
    const s = effectiveClStatus(cl);
    if (filter === "ALL") return true;
    if (filter === "MEETING_BOOKED") return isMeetingBooked(cl);
    if (filter === "SENT") return s === "SENT" || s === "OPENED";
    return s === filter;
  });

  async function markMeeting(cl: CampaignLead) {
    const isBooked = isMeetingBooked(cl);
    const markBooked = !isBooked;
    setMarkingMeeting(cl.id);

    // Optimistic update
    setLocalMeetings((prev) => ({ ...prev, [cl.id]: markBooked }));

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/campaign-leads/${cl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingBooked: markBooked }),
      });
      if (res.ok) {
        toast(isBooked ? "Meeting booking removed" : "Marked as meeting booked! 🎉", "success");
        router.refresh();
      } else {
        // Revert optimistic update
        setLocalMeetings((prev) => ({ ...prev, [cl.id]: isBooked }));
        toast("Failed to update status", "error");
      }
    } catch {
      setLocalMeetings((prev) => ({ ...prev, [cl.id]: isBooked }));
      toast("Something went wrong", "error");
    } finally {
      setMarkingMeeting(null);
    }
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: `All (${counts.ALL})` },
    { key: "PENDING", label: `Pending (${counts.PENDING})` },
    { key: "SENT", label: `Sent (${counts.SENT})` },
    { key: "REPLIED", label: `Replied (${counts.REPLIED})` },
    { key: "MEETING_BOOKED", label: `Meetings (${counts.MEETING_BOOKED})` },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium">Leads ({stats.total})</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.pending} pending</span>
            <span>·</span>
            <span>{stats.sent} sent</span>
            <span>·</span>
            <span className="text-green-400">{stats.replied} replied</span>
          </div>
          {campaignLeads.length > 0 && (
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Export visible leads as CSV"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-secondary/20">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {campaignLeads.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">No leads in this campaign yet</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground text-sm">No leads match this filter</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((cl) => {
            const isMeeting = isMeetingBooked(cl);
            const clStatus = effectiveClStatus(cl);
            const canMarkMeeting = clStatus === "REPLIED" || isMeeting;
            const canMarkReplied = clStatus === "SENT" || clStatus === "OPENED";

            return (
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

                  {/* Mark as replied manually */}
                  {canMarkReplied && (
                    <button
                      onClick={() => void markAsReplied(cl)}
                      disabled={markingReplied === cl.id}
                      title="Mark as replied manually"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-muted-foreground hover:text-green-400 hover:bg-green-500/10 transition-all"
                    >
                      {markingReplied === cl.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Meeting booked button */}
                  {canMarkMeeting && (
                    <button
                      onClick={() => void markMeeting(cl)}
                      disabled={markingMeeting === cl.id}
                      title={isMeeting ? "Unmark meeting booked" : "Mark as meeting booked"}
                      className={`p-1.5 rounded transition-all ${
                        isMeeting
                          ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                          : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"
                      }`}
                    >
                      {markingMeeting === cl.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

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
                  {cl.gmailThreadId && (clStatus === "REPLIED" || clStatus === "SENT" || isMeeting) && (
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

                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    isMeeting ? leadStatusColor["MEETING_BOOKED"] : (leadStatusColor[clStatus] ?? "bg-secondary text-muted-foreground")
                  }`}>
                    {isMeeting ? "Meeting 🎉" : (clStatus.charAt(0) + clStatus.slice(1).toLowerCase())}
                  </span>
                </div>
              </div>
            );
          })}
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
