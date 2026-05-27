"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ExternalLink,
  Twitter,
  Globe,
  Users,
  Check,
  Pencil,
  X,
} from "lucide-react";

type Props = {
  affiliate: {
    id: string;
    name: string;
    email: string;
    affiliateCode: string;
    commissionRate: number;
    status: string;
    totalClicks: number;
    totalSignups: number;
    totalEarningsInPaise: string;
    totalPaidInPaise: string;
    unpaidApprovedInPaise: string;
    website: string | null;
    socialHandle: string | null;
    audienceDescription: string | null;
    upiId: string | null;
    razorpayFundAccountId: string | null;
    createdAt: string;
  };
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  SUSPENDED: "bg-red-500/20 text-red-300 border-red-500/30",
};

function formatPaise(paise: string): string {
  return `₹${(Number(paise) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminAffiliateRow({ affiliate: a }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Commission editor state
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionInput, setCommissionInput] = useState(
    Math.round(a.commissionRate * 100).toString()
  );
  const [savingCommission, setSavingCommission] = useState(false);

  const unpaid = Number(a.unpaidApprovedInPaise) / 100;

  async function updateStatus(status: "ACTIVE" | "SUSPENDED") {
    setLoading(status);
    const res = await fetch(`/api/admin/affiliates/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    if (res.ok) router.refresh();
    else {
      const d = await res.json();
      alert(d.error ?? "Failed");
    }
  }

  async function saveCommission() {
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 1 || rate > 90) {
      alert("Enter a valid commission rate between 1% and 90%");
      return;
    }
    setSavingCommission(true);
    const res = await fetch(`/api/admin/affiliates/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: a.status as "ACTIVE" | "SUSPENDED",
        commissionRate: rate / 100,
      }),
    });
    setSavingCommission(false);
    if (res.ok) {
      setEditingCommission(false);
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to save commission");
    }
  }

  async function triggerPayout() {
    if (!a.razorpayFundAccountId) {
      alert("Affiliate has not added a UPI ID yet.");
      return;
    }
    if (unpaid < 5) {
      alert("No approved balance to pay out.");
      return;
    }
    if (!confirm(`Pay out ₹${unpaid.toLocaleString("en-IN")} to this affiliate via Razorpay X?`)) return;
    setLoading("payout");
    const res = await fetch(`/api/admin/affiliates/${a.id}/payout`, { method: "POST" });
    setLoading(null);
    const data = await res.json();
    if (res.ok) {
      alert(`Payout of ₹${data.amountPaid} initiated! Payout ID: ${data.payoutId}`);
      router.refresh();
    } else {
      alert(data.error ?? "Payout failed");
    }
  }

  return (
    <>
      {/* ── Main Row ── */}
      <tr
        className="hover:bg-zinc-800/40 transition cursor-pointer group"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Affiliate info */}
        <td className="px-5 py-4">
          <div className="flex items-start gap-2">
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 mt-0.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
            <div>
              <p className="font-semibold text-white">{a.name}</p>
              <p className="text-xs text-zinc-500">{a.email}</p>
              {a.audienceDescription && (
                <p className="text-xs text-zinc-600 max-w-[220px] truncate mt-0.5">
                  {a.audienceDescription}
                </p>
              )}
            </div>
          </div>
        </td>

        {/* Code + commission */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <code className="text-violet-400 font-mono text-xs bg-violet-500/10 px-2 py-1 rounded">
            {a.affiliateCode}
          </code>
          <div className="mt-1.5 flex items-center gap-1">
            {editingCommission ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  type="number"
                  min={1}
                  max={90}
                  className="w-14 bg-zinc-800 border border-violet-500/50 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCommission();
                    if (e.key === "Escape") setEditingCommission(false);
                  }}
                />
                <span className="text-xs text-zinc-400">%</span>
                <button
                  onClick={saveCommission}
                  disabled={savingCommission}
                  className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingCommission(false)}
                  className="p-1 rounded bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingCommission(true); }}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-violet-400 transition group/edit"
              >
                <span className="font-mono">{Math.round(a.commissionRate * 100)}%</span>
                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/edit:opacity-100 transition" />
              </button>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-5 py-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[a.status]}`}>
            {a.status}
          </span>
        </td>

        {/* Stats */}
        <td className="px-5 py-4 text-right font-mono text-zinc-300 text-sm">{a.totalClicks}</td>
        <td className="px-5 py-4 text-right font-mono text-zinc-300 text-sm">{a.totalSignups}</td>
        <td className="px-5 py-4 text-right font-mono text-emerald-400 text-sm">{formatPaise(a.totalEarningsInPaise)}</td>
        <td className="px-5 py-4 text-right font-mono text-zinc-400 text-sm">{formatPaise(a.totalPaidInPaise)}</td>
        <td className="px-5 py-4 text-right font-mono text-amber-400 text-sm">{formatPaise(a.unpaidApprovedInPaise)}</td>

        {/* Actions */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            {a.status === "PENDING" && (
              <button
                onClick={() => updateStatus("ACTIVE")}
                disabled={loading !== null}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition disabled:opacity-50"
              >
                {loading === "ACTIVE" ? "Approving…" : "Approve"}
              </button>
            )}
            {a.status === "ACTIVE" && (
              <button
                onClick={() => updateStatus("SUSPENDED")}
                disabled={loading !== null}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50"
              >
                {loading === "SUSPENDED" ? "Suspending…" : "Suspend"}
              </button>
            )}
            {a.status === "SUSPENDED" && (
              <button
                onClick={() => updateStatus("ACTIVE")}
                disabled={loading !== null}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition disabled:opacity-50"
              >
                {loading === "ACTIVE" ? "Reactivating…" : "Reactivate"}
              </button>
            )}
            {a.status === "ACTIVE" && unpaid >= 5 && a.razorpayFundAccountId && (
              <button
                onClick={triggerPayout}
                disabled={loading !== null}
                className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition disabled:opacity-50"
              >
                {loading === "payout" ? "Paying…" : `Pay ₹${unpaid.toLocaleString("en-IN")}`}
              </button>
            )}
            {a.status === "ACTIVE" && unpaid >= 5 && !a.razorpayFundAccountId && (
              <span className="text-xs text-amber-400 italic">UPI needed</span>
            )}
          </div>
        </td>
      </tr>

      {/* ── Expanded Detail Row ── */}
      {expanded && (
        <tr className="bg-zinc-900/60">
          <td colSpan={9} className="px-5 py-5 border-b border-zinc-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Application Details */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Application Details</h3>

                {/* Audience */}
                {a.audienceDescription && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-xs font-medium text-zinc-400">Audience Description</span>
                    </div>
                    <p className="text-sm text-zinc-200 bg-zinc-800/60 rounded-lg px-4 py-3 leading-relaxed border border-zinc-700/50">
                      {a.audienceDescription}
                    </p>
                  </div>
                )}

                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  {a.website && (
                    <a
                      href={a.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg transition"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {a.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {a.socialHandle && (
                    <a
                      href={
                        a.socialHandle.startsWith("http")
                          ? a.socialHandle
                          : `https://twitter.com/${a.socialHandle.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg transition"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                      {a.socialHandle}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!a.website && !a.socialHandle && (
                    <p className="text-xs text-zinc-600 italic">No website or social handle provided</p>
                  )}
                </div>
              </div>

              {/* Commission + Meta */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Commission Rate</h3>

                <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-violet-400 font-mono mb-1">
                    {Math.round(a.commissionRate * 100)}%
                  </p>
                  <p className="text-xs text-zinc-500 mb-4">on every payment, recurring</p>

                  {editingCommission ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        className="flex-1 bg-zinc-900 border border-violet-500/50 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                        value={commissionInput}
                        onChange={(e) => setCommissionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveCommission();
                          if (e.key === "Escape") setEditingCommission(false);
                        }}
                        placeholder="30"
                      />
                      <span className="text-sm text-zinc-400">%</span>
                      <button
                        onClick={saveCommission}
                        disabled={savingCommission}
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition disabled:opacity-50"
                      >
                        {savingCommission ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingCommission(false)}
                        className="px-2 py-2 rounded-lg bg-zinc-700 text-zinc-400 text-xs hover:bg-zinc-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCommission(true)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-700/60 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit commission rate
                    </button>
                  )}
                </div>

                {/* Meta */}
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>Applied: {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p>UPI ID: {a.upiId
                    ? <span className="text-emerald-400 font-mono">{a.upiId}</span>
                    : <span className="text-red-400">Not added</span>}
                  </p>
                  <p>Razorpay FA: {a.razorpayFundAccountId
                    ? <span className="text-emerald-400">Linked</span>
                    : <span className="text-yellow-400">Not linked</span>}
                  </p>
                  <p>Affiliate link: <code className="text-violet-400">flowfiy.com?ref={a.affiliateCode}</code></p>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
