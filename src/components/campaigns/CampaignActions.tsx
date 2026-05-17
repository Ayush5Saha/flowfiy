"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, RefreshCw, Loader2 } from "lucide-react";

interface CampaignActionsProps {
  campaignId: string;
  status: string;
  pendingCount: number;
  organizationId: string;
}

export function CampaignActions({ campaignId, status, pendingCount }: CampaignActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleLaunch() {
    setLoading("launch");
    setMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ text: json.error ?? "Failed to launch", type: "error" });
      } else {
        setMessage({ text: json.message ?? `Queued ${json.queued} emails`, type: "success" });
        router.refresh();
      }
    } catch {
      setMessage({ text: "Something went wrong", type: "error" });
    } finally {
      setLoading(null);
    }
  }

  async function handlePause() {
    setLoading("pause");
    setMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setMessage({ text: "Failed to update status", type: "error" });
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleCheckReplies() {
    setLoading("replies");
    setMessage(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/replies`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setMessage({
          text: json.repliesFound > 0
            ? `Found ${json.repliesFound} new repl${json.repliesFound === 1 ? "y" : "ies"}`
            : "No new replies found",
          type: "success",
        });
        router.refresh();
      } else {
        setMessage({ text: json.error ?? "Failed to check replies", type: "error" });
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* Check replies */}
        {(status === "ACTIVE" || status === "PAUSED") && (
          <button
            onClick={handleCheckReplies}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {loading === "replies" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Check Replies
          </button>
        )}

        {/* Pause / Resume */}
        {(status === "ACTIVE" || status === "PAUSED") && (
          <button
            onClick={handlePause}
            disabled={!!loading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${
              status === "ACTIVE"
                ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                : "border-green-500/30 text-green-400 hover:bg-green-500/10"
            }`}
          >
            {loading === "pause" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === "ACTIVE" ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {status === "ACTIVE" ? "Pause" : "Resume"}
          </button>
        )}

        {/* Launch */}
        {(status === "DRAFT" || status === "PAUSED" || status === "ACTIVE") && pendingCount > 0 && (
          <button
            onClick={handleLaunch}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading === "launch" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Launch ({pendingCount})
          </button>
        )}
      </div>

      {message && (
        <p className={`text-xs ${message.type === "success" ? "text-green-400" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
