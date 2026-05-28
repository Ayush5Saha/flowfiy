"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck, Trash2 } from "lucide-react";

export default function AdminUserDetailActions({
  userId,
  userName,
  isBanned,
}: {
  userId: string;
  userName: string;
  isBanned: boolean;
}) {
  const router = useRouter();
  const [banned, setBanned] = useState(isBanned);
  const [loading, setLoading] = useState<"ban" | "delete" | null>(null);

  async function handleBan() {
    if (!confirm(`Ban "${userName}"? They will be unable to sign in.`)) return;
    setLoading("ban");
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
      setLoading(null);
    }
  }

  async function handleUnban() {
    if (!confirm(`Unban "${userName}"?`)) return;
    setLoading("ban");
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
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete user "${userName}"? This cannot be undone.`)) return;
    if (!confirm("Are you sure? All their auth data will be deleted.")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/users");
      } else {
        alert("Failed to delete user");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {banned ? (
        <button
          onClick={handleUnban}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {loading === "ban" ? "…" : "Unban"}
        </button>
      ) : (
        <button
          onClick={handleBan}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <Ban className="w-3.5 h-3.5" />
          {loading === "ban" ? "…" : "Ban"}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {loading === "delete" ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
