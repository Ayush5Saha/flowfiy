"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface RetryListButtonProps {
  listId: string;
  organizationId: string;
}

export function RetryListButton({ listId, organizationId }: RetryListButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRetry() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${listId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to retry");
        toast(json.error ?? "Failed to retry", "error");
      } else {
        toast("Research restarted — this may take a few minutes", "info");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        onClick={() => void handleRetry()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs hover:bg-destructive/10 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Retry
      </button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
