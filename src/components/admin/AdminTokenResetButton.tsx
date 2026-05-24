"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export default function AdminTokenResetButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (!confirm("Reset monthly token usage to 0 for this org?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetTokenUsage: true }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      } else {
        alert("Failed to reset token usage");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
        done
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
      }`}
    >
      <RotateCcw className="w-3 h-3" />
      {loading ? "Resetting…" : done ? "Reset!" : "Reset Usage"}
    </button>
  );
}
