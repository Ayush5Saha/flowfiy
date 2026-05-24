"use client";

import { useState } from "react";

type ApiMode = "CENTRAL" | "BYOK";

export default function AdminApiModeToggle({
  orgId,
  currentMode,
}: {
  orgId: string;
  currentMode: string;
}) {
  const [mode, setMode] = useState<ApiMode>(currentMode as ApiMode);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const newMode: ApiMode = mode === "CENTRAL" ? "BYOK" : "CENTRAL";
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiMode: newMode }),
      });
      if (res.ok) setMode(newMode);
      else alert("Failed to update API mode");
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      title="Click to toggle"
      className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 ${
        mode === "CENTRAL"
          ? "bg-blue-500/15 text-blue-300"
          : "bg-violet-500/15 text-violet-300"
      }`}
    >
      {saving ? "…" : mode}
    </button>
  );
}
