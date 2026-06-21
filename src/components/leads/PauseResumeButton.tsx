"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface PauseResumeButtonProps {
  listId: string;
  organizationId: string;
  /** Current pause state (from the server on render). */
  paused: boolean;
}

export function PauseResumeButton({ listId, organizationId, paused }: PauseResumeButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const action = paused ? "resume" : "pause";
    try {
      const res = await fetch(`/api/leads/${listId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error ?? `Couldn't ${action} the search`, "error");
      } else {
        toast(paused ? "Search resumed — finding more leads." : "Search paused.", "info");
        router.refresh();
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : paused ? (
        <Play className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Pause className="w-3.5 h-3.5 text-amber-400" />
      )}
      {paused ? "Resume search" : "Pause search"}
    </button>
  );
}
