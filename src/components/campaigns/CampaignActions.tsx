"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, RefreshCw, Loader2, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface CampaignActionsProps {
  campaignId: string;
  status: string;
  pendingCount: number;
  organizationId: string;
}

export function CampaignActions({ campaignId, status, pendingCount }: CampaignActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);

  async function handleLaunch() {
    setLoading("launch");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to launch", "error");
      } else {
        toast(json.message ?? `Queued ${json.queued} emails`, "success");
        router.refresh();
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(null);
    }
  }

  async function handlePause() {
    setLoading("pause");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "ACTIVE" ? "PAUSED" : "ACTIVE" }),
      });
      if (res.ok) {
        toast(status === "ACTIVE" ? "Campaign paused" : "Campaign resumed", "success");
        router.refresh();
      } else {
        toast("Failed to update status", "error");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleCheckReplies() {
    setLoading("replies");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/replies`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast(
          json.repliesFound > 0
            ? `Found ${json.repliesFound} new repl${json.repliesFound === 1 ? "y" : "ies"}`
            : "No new replies found",
          "success"
        );
        router.refresh();
      } else {
        toast(json.error ?? "Failed to check replies", "error");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleDuplicate() {
    setLoading("duplicate");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        toast("Campaign duplicated as draft", "success");
        router.push(`/campaigns/${json.campaign.id}`);
      } else {
        toast(json.error ?? "Failed to duplicate", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(null);
    }
  }

  async function handleComplete() {
    if (!confirmComplete) {
      setConfirmComplete(true);
      setTimeout(() => setConfirmComplete(false), 4000);
      return;
    }
    setLoading("complete");
    setConfirmComplete(false);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        toast("Campaign marked as completed", "success");
        router.refresh();
      } else {
        toast("Failed to complete campaign", "error");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Duplicate */}
      <button
        onClick={() => void handleDuplicate()}
        disabled={!!loading}
        title="Duplicate campaign"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
      >
        {loading === "duplicate" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        Duplicate
      </button>

      {/* Mark as Completed */}
      {(status === "ACTIVE" || status === "PAUSED") && (
        <button
          onClick={() => void handleComplete()}
          disabled={!!loading}
          title="Mark campaign as completed"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
            confirmComplete
              ? "border-orange-500/40 text-orange-400 bg-orange-500/10"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          {loading === "complete" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          {confirmComplete ? "Confirm?" : "Complete"}
        </button>
      )}

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
  );
}
