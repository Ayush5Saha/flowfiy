"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDeleteOrg({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/organizations");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete organization");
      }
    } catch {
      alert("Network error");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Delete &quot;{orgName}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
        >
          {deleting ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg border border-red-600/30 transition-colors"
    >
      Delete Org
    </button>
  );
}
