"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  listId: string;
  organizationId: string;
}

export function LeadListRowActions({ listId, organizationId }: Props) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault(); // don't navigate to list detail
    e.stopPropagation();

    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3500);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${listId}?organizationId=${organizationId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <button
      onClick={(e) => void handleDelete(e)}
      disabled={loading}
      title={confirm ? "Click again to confirm" : "Archive list"}
      className={`p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 ${
        confirm
          ? "text-destructive bg-destructive/10"
          : "text-muted-foreground hover:text-destructive"
      }`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  );
}
