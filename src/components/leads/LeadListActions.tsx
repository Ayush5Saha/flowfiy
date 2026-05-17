"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, Download, Check } from "lucide-react";

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
}

export function LeadListActions({ listId, listName, isReady, hasQualifiedLeads, leads }: LeadListActionsProps) {
  const [exported, setExported] = useState(false);

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
    </div>
  );
}
