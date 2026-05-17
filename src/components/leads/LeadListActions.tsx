"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Megaphone, Download, Check, Trash2, Loader2 } from "lucide-react";

interface LeadRow {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  title?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  status: string;
  qualificationScore?: number | null;
}

interface LeadListActionsProps {
  listId: string;
  listName: string;
  isReady: boolean;
  hasQualifiedLeads: boolean;
  leads: LeadRow[];
  organizationId: string;
}

export function LeadListActions({ listId, listName, isReady, hasQualifiedLeads, leads, organizationId }: LeadListActionsProps) {
  const router = useRouter();
  const [exported, setExported] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleExportCsv() {
    const headers = ["First Name", "Last Name", "Email", "Title", "Company", "Website", "Status", "Score"];
    const rows = leads.map((l) => [
      l.firstName ?? "",
      l.lastName ?? "",
      l.email ?? "",
      l.title ?? "",
      l.companyName ?? "",
      l.companyWebsite ?? "",
      l.status,
      l.qualificationScore?.toString() ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listName.replace(/[^a-z0-9]/gi, "_")}_leads.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${listId}?organizationId=${organizationId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/leads");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Export CSV */}
      {leads.length > 0 && (
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {exported ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {exported ? "Exported!" : "Export CSV"}
        </button>
      )}

      {/* Create Campaign */}
      {isReady && hasQualifiedLeads && (
        <Link
          href={`/campaigns/new?listId=${listId}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Megaphone className="w-3.5 h-3.5" />
          Create Campaign
        </Link>
      )}

      {/* Delete */}
      <button
        onClick={() => void handleDelete()}
        disabled={deleting}
        title={confirmDelete ? "Click again to confirm delete" : "Archive this lead list"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
          confirmDelete
            ? "border-destructive/50 text-destructive bg-destructive/10 hover:bg-destructive/20"
            : "border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"
        }`}
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        {confirmDelete ? "Confirm delete?" : "Delete"}
      </button>
    </div>
  );
}
