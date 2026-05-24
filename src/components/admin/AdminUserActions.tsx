"use client";

import { useState } from "react";
import { Ban, ShieldCheck, ChevronDown } from "lucide-react";

export default function AdminUserActions({
  userId,
  userName,
  isBanned,
}: {
  userId: string;
  userName: string;
  isBanned: boolean;
}) {
  const [banned, setBanned] = useState(isBanned);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleBan() {
    if (!confirm(`Ban user "${userName}"? They will be unable to sign in.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ban: true }),
      });
      if (res.ok) setBanned(true);
      else alert("Failed to ban user");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  async function handleUnban() {
    if (!confirm(`Unban user "${userName}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unban: true }),
      });
      if (res.ok) setBanned(false);
      else alert("Failed to unban user");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
      >
        {loading ? "…" : "Actions"}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden w-36">
            {!banned ? (
              <button
                onClick={handleBan}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Ban User
              </button>
            ) : (
              <button
                onClick={handleUnban}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Unban User
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
