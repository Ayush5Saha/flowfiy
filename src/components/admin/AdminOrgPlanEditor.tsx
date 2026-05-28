"use client";

import { useState } from "react";

const PLANS = ["FREE", "INDIE", "STARTER", "GROWTH", "AGENCY"] as const;
type Plan = (typeof PLANS)[number];

const planColors: Record<Plan, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  INDIE:   "bg-teal-500/20 text-teal-300",
  STARTER: "bg-blue-500/20 text-blue-300",
  GROWTH:  "bg-violet-500/20 text-violet-300",
  AGENCY:  "bg-amber-500/20 text-amber-300",
};

export default function AdminOrgPlanEditor({
  orgId,
  currentPlan,
}: {
  orgId: string;
  currentPlan: string;
}) {
  const [plan, setPlan] = useState<Plan>(currentPlan as Plan);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSelect(newPlan: Plan) {
    if (newPlan === plan) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (res.ok) {
        setPlan(newPlan);
      } else {
        alert("Failed to update plan");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${planColors[plan]} ${saving ? "opacity-50" : ""}`}
      >
        {saving ? "…" : plan}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-7 z-20 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden w-32">
            {PLANS.map((p) => (
              <button
                key={p}
                onClick={() => handleSelect(p)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 transition-colors ${
                  p === plan ? "font-semibold text-white" : "text-zinc-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
