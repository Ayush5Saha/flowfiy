"use client";

import { useState } from "react";
import { Loader2, Coins } from "lucide-react";

/** Admin control: comp credits to an org's wallet (additive, GRANT ledger entry). */
export default function AdminCreditGrant({ orgId }: { orgId: string }) {
  const [amount, setAmount] = useState(100);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function grant() {
    if (amount <= 0 || busy) return;
    if (!confirm(`Grant ${amount} credits to this organization?`)) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantCredits: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error ?? "Failed to grant credits"); return; }
      window.location.reload();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={1}
        max={100000}
        value={amount}
        onChange={(e) => setAmount(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        className="w-24 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      />
      <button
        onClick={grant}
        disabled={busy || amount <= 0}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
        Grant credits
      </button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}
