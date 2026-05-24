"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export default function AdminGenerationResetButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset() {
    if (!confirm("Reset generation count to 0 for this org? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetGenerationCount: true }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
      } else {
        alert("Failed to reset generation count");
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
          : "bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
      }`}
    >
      <RotateCcw className="w-3 h-3" />
      {loading ? "Resetting…" : done ? "Done!" : "Reset Count"}
    </button>
  );
}
