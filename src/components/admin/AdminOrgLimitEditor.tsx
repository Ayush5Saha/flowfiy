"use client";

import { useState } from "react";

export default function AdminOrgLimitEditor({
  orgId,
  generationCount,
  generationLimit,
}: {
  orgId: string;
  generationCount: number;
  generationLimit: number;
}) {
  const [limit, setLimit] = useState(generationLimit);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(generationLimit === -1 ? "unlimited" : String(generationLimit));
  const [saving, setSaving] = useState(false);

  const displayLimit = limit === -1 ? "∞" : limit;
  const usagePct = limit === -1 ? 0 : Math.min(Math.round((generationCount / limit) * 100), 100);

  async function handleSave() {
    const parsed = inputVal.trim().toLowerCase();
    const newLimit = parsed === "unlimited" || parsed === "-1" || parsed === "∞" ? -1 : parseInt(parsed, 10);
    if (isNaN(newLimit) && newLimit !== -1) {
      alert("Enter a number or 'unlimited'");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationLimit: newLimit }),
      });
      if (res.ok) {
        setLimit(newLimit);
        setEditing(false);
      } else {
        alert("Failed to update limit");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-xs text-zinc-400">{generationCount} used /</div>
        <input
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-24 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-violet-500"
          placeholder="50 or unlimited"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
        >
          {saving ? "…" : "Save"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="text-sm text-white">
          {generationCount} / {displayLimit}
        </p>
        {limit !== -1 && (
          <div className="w-32 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${usagePct > 80 ? "bg-red-500" : "bg-violet-500"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={() => {
          setInputVal(limit === -1 ? "unlimited" : String(limit));
          setEditing(true);
        }}
        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
      >
        Edit
      </button>
    </div>
  );
}
