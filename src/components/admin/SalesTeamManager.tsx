"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Copy,
  Check,
  Loader2,
  UserPlus,
  Pencil,
  X,
  Users,
  UserCheck,
  Wallet,
  HandCoins,
  Link2,
  Trash2,
} from "lucide-react";

// ─── Types (mirrors the server-serialized shape from src/app/admin/sales-team/page.tsx) ───

export type SalesRepCustomer = {
  orgId: string;
  orgName: string;
  plan: string;
  subscriptionStatus: string | null;
  firstPaymentAt: string;
  paymentsCount: number;
  revenueInPaise: string;
  commissionInPaise: string;
};

export type SalesRepWeekBucket = {
  weekStartISO: string;
  label: string;
  commissionInPaise: string;
};

export type SalesRep = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  affiliateCode: string;
  commissionRate: number;
  status: string;
  totalEarningsInPaise: string;
  totalPaidInPaise: string;
  unpaidInPaise: string;
  thisWeekInPaise: string;
  createdAt: string;
  hasPayoutAccount: boolean;
  upiId: string | null;
  customers: SalesRepCustomer[];
  weekly: SalesRepWeekBucket[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** ₹ formatter for BigInt-paise strings. Kept local (not @/lib/affiliate) since that pulls in node crypto. */
function formatPaise(paiseStr: string): string {
  return `₹${(Number(paiseStr) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function sumPaise(values: string[]): string {
  return values.reduce((sum, v) => sum + BigInt(v || "0"), 0n).toString();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function refLinkFor(code: string): string {
  return `flowfiy.com?ref=${code}`;
}

/** API errors may be plain strings or zod flatten() objects — always render a string. */
function errText(body: { error?: unknown }, fallback: string): string {
  if (typeof body.error === "string") return body.error;
  if (body.error && typeof body.error === "object") {
    const fieldErrors = (body.error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    const first = fieldErrors && Object.values(fieldErrors).flat()[0];
    if (first) return first;
  }
  return fallback;
}

function inputClassName(extra = "") {
  return `w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 ${extra}`;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  ACTIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  SUSPENDED: "bg-red-500/20 text-red-300 border-red-500/30",
};

type Notify = (kind: "error" | "success", message: string) => void;

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, icon,
}: {
  label: string; value: string; sub?: string; accent?: "amber"; icon: React.ReactNode;
}) {
  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent === "amber" ? "from-amber-500/50" : "from-zinc-600/40"} via-transparent to-transparent`} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent === "amber" ? "bg-amber-500/10" : "bg-zinc-800"}`}>
          <span className={accent === "amber" ? "text-amber-400" : "text-zinc-400"}>{icon}</span>
        </div>
      </div>
      <p className={`text-3xl font-bold font-mono tracking-tight ${accent === "amber" ? "text-amber-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function SalesTeamManager({ reps }: { reps: SalesRep[] }) {
  const router = useRouter();

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const notify: Notify = (kind, message) => {
    if (kind === "error") {
      setBannerError(message);
      setBannerSuccess(null);
    } else {
      setBannerSuccess(message);
      setBannerError(null);
    }
  };

  function refresh() {
    router.refresh();
  }

  // ── Add rep form ──────────────────────────────────────────────────────
  const [form, setForm] = useState({ name: "", email: "", phone: "", upiId: "", commissionRate: "10" });
  const [adding, setAdding] = useState(false);
  const [addedRep, setAddedRep] = useState<{ name: string; affiliateCode: string; refLink: string; dashboardLink?: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  async function addRep(e: React.FormEvent) {
    e.preventDefault();
    setBannerError(null);
    setBannerSuccess(null);
    setAdding(true);
    try {
      const rate = parseFloat(form.commissionRate);
      if (isNaN(rate) || rate < 1 || rate > 50) {
        notify("error", "Enter a valid commission rate between 1% and 50%.");
        return;
      }
      const res = await fetch("/api/admin/sales-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          upiId: form.upiId || undefined,
          commissionRate: rate / 100,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify("error", errText(body, "Could not add salesperson."));
        return;
      }
      const rep = body.rep;
      setAddedRep({
        name: rep.name,
        affiliateCode: rep.affiliateCode,
        refLink: rep.refLink || refLinkFor(rep.affiliateCode),
        dashboardLink: rep.dashboardLink,
      });
      setForm({ name: "", email: "", phone: "", upiId: "", commissionRate: "10" });
      refresh();
    } finally {
      setAdding(false);
    }
  }

  async function copyAddedLink() {
    if (!addedRep) return;
    await navigator.clipboard.writeText(addedRep.refLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // ── Stats ─────────────────────────────────────────────────────────────
  const activeCount = reps.filter((r) => r.status === "ACTIVE").length;
  const distinctCustomers = new Set(reps.flatMap((r) => r.customers.map((c) => c.orgId))).size;
  const totalUnpaid = sumPaise(reps.map((r) => r.unpaidInPaise));
  const totalPaid = sumPaise(reps.map((r) => r.totalPaidInPaise));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sales Team</h1>
        <p className="text-zinc-400 text-sm mt-1">Cold callers · commission on every customer payment, paid weekly</p>
      </div>

      {(bannerError || bannerSuccess) && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            bannerError
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {bannerError || bannerSuccess}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Sales Reps" value={String(reps.length)} sub={`${activeCount} active`} icon={<Users className="w-4 h-4" />} />
        <StatCard label="Customers Onboarded" value={String(distinctCustomers)} icon={<UserCheck className="w-4 h-4" />} />
        <StatCard label="Owed Right Now" value={formatPaise(totalUnpaid)} accent="amber" icon={<Wallet className="w-4 h-4" />} />
        <StatCard label="Paid Out All-Time" value={formatPaise(totalPaid)} icon={<HandCoins className="w-4 h-4" />} />
      </div>

      {/* ── Added-rep success panel ─────────────────────────────────── */}
      {addedRep && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">{addedRep.name} added</p>
              <p className="text-xs text-zinc-400 mt-1">
                Give them this link — every customer who pays through it is credited to them automatically.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="text-xs font-mono text-white bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 truncate">
                  {addedRep.refLink}
                </code>
                <button
                  type="button"
                  onClick={copyAddedLink}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {linkCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAddedRep(null)}
              className="shrink-0 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Add a salesperson ───────────────────────────────────────── */}
      <form onSubmit={addRep} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold">Add a salesperson</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClassName()} placeholder="Jane Doe" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Email</span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClassName()} placeholder="jane@example.com" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Phone</span>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClassName()} placeholder="+91 98765 43210" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">UPI ID (optional)</span>
            <input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} className={inputClassName("font-mono")} placeholder="name@upi — for weekly payouts" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Commission %</span>
            <input required type="number" min={1} max={50} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} className={inputClassName("font-mono")} placeholder="10" />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add salesperson
          </button>
        </div>
      </form>

      {/* ── Reps table ───────────────────────────────────────────────── */}
      {reps.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-500">No salespersons yet. Add your first cold caller above.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left px-5 py-3 font-medium">Rep</th>
                <th className="text-left px-5 py-3 font-medium">Code</th>
                <th className="text-right px-5 py-3 font-medium">Customers</th>
                <th className="text-right px-5 py-3 font-medium">Earned</th>
                <th className="text-right px-5 py-3 font-medium">Paid</th>
                <th className="text-right px-5 py-3 font-medium">Unpaid</th>
                <th className="text-right px-5 py-3 font-medium">This Week</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {reps.map((rep) => (
                <SalesRepRow key={rep.id} rep={rep} onNotify={notify} onRefresh={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function SalesRepRow({ rep, onNotify, onRefresh }: { rep: SalesRep; onNotify: Notify; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [editingUpi, setEditingUpi] = useState(false);
  const [upiInput, setUpiInput] = useState(rep.upiId ?? "");
  const [savingUpi, setSavingUpi] = useState(false);

  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionInput, setCommissionInput] = useState(Math.round(rep.commissionRate * 100).toString());
  const [savingCommission, setSavingCommission] = useState(false);

  const unpaidRupees = Number(rep.unpaidInPaise) / 100;

  let payoutDisabledReason: string | null = null;
  if (!rep.hasPayoutAccount) payoutDisabledReason = "No UPI ID on file";
  else if (unpaidRupees < 100) payoutDisabledReason = "Below ₹100 minimum";

  async function patch(data: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/admin/sales-team/${rep.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      onNotify("error", errText(body, "Update failed."));
      return false;
    }
    return true;
  }

  async function toggleStatus() {
    const next = rep.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setStatusLoading(true);
    try {
      const ok = await patch({ status: next });
      if (ok) {
        onNotify("success", `${rep.name} is now ${next === "ACTIVE" ? "active" : "suspended"}.`);
        onRefresh();
      }
    } finally {
      setStatusLoading(false);
    }
  }

  async function saveUpi() {
    // The API requires a valid UPI ID — it can be changed but not cleared.
    if (!upiInput.trim()) {
      onNotify("error", "Enter a UPI ID (e.g. name@upi).");
      return;
    }
    setSavingUpi(true);
    try {
      const ok = await patch({ upiId: upiInput.trim() });
      if (ok) {
        setEditingUpi(false);
        onNotify("success", "UPI ID updated.");
        onRefresh();
      }
    } finally {
      setSavingUpi(false);
    }
  }

  async function saveCommission() {
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 1 || rate > 50) {
      onNotify("error", "Enter a valid commission rate between 1% and 50%.");
      return;
    }
    setSavingCommission(true);
    try {
      const ok = await patch({ commissionRate: rate / 100 });
      if (ok) {
        setEditingCommission(false);
        onNotify("success", "Commission rate updated.");
        onRefresh();
      }
    } finally {
      setSavingCommission(false);
    }
  }

  async function payNow() {
    if (payoutDisabledReason) return;
    if (!window.confirm(`Pay ₹${unpaidRupees.toLocaleString("en-IN")} to ${rep.name} via UPI now?`)) return;
    setPayoutLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${rep.id}/payout`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotify("error", body.error || "Payout failed.");
        return;
      }
      onNotify("success", `Paid ₹${body.amountPaid} to ${rep.name}. Payout ID: ${body.payoutId}`);
      onRefresh();
    } finally {
      setPayoutLoading(false);
    }
  }

  async function removeRep() {
    if (!window.confirm(`Remove ${rep.name} (${rep.email})? Their referral link stops working immediately.`)) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-team/${rep.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotify("error", errText(body, "Could not remove salesperson."));
        return;
      }
      onNotify("success", `${rep.name} removed.`);
      onRefresh();
    } finally {
      setDeleteLoading(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(refLinkFor(rep.affiliateCode));
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <>
      <tr className="hover:bg-zinc-800/40 transition cursor-pointer group" onClick={() => setExpanded((v) => !v)}>
        {/* Rep info */}
        <td className="px-5 py-4">
          <div className="flex items-start gap-2">
            <ChevronDown className={`w-4 h-4 text-zinc-500 mt-0.5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
            <div>
              <p className="font-semibold text-white">{rep.name}</p>
              <p className="text-xs text-zinc-500">{rep.email}</p>
              {rep.phone && <p className="text-xs text-zinc-600">{rep.phone}</p>}
            </div>
          </div>
        </td>

        {/* Code */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <code className="text-amber-400 font-mono text-xs bg-amber-500/10 px-2 py-1 rounded">{rep.affiliateCode}</code>
            <button
              type="button"
              onClick={copyCode}
              title="Copy referral link"
              className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition"
            >
              {codeCopied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
            </button>
          </div>
        </td>

        {/* Customers */}
        <td className="px-5 py-4 text-right font-mono text-zinc-300 text-sm">{rep.customers.length}</td>

        {/* Earned / Paid / Unpaid / This week */}
        <td className="px-5 py-4 text-right font-mono text-emerald-400 text-sm">{formatPaise(rep.totalEarningsInPaise)}</td>
        <td className="px-5 py-4 text-right font-mono text-zinc-400 text-sm">{formatPaise(rep.totalPaidInPaise)}</td>
        <td className="px-5 py-4 text-right font-mono text-amber-400 text-sm">{formatPaise(rep.unpaidInPaise)}</td>
        <td className="px-5 py-4 text-right font-mono text-zinc-300 text-sm">{formatPaise(rep.thisWeekInPaise)}</td>

        {/* Status */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={statusLoading}
            onClick={toggleStatus}
            className={`text-xs px-2.5 py-1 rounded-full font-medium border transition disabled:opacity-50 ${statusColors[rep.status] ?? statusColors.SUSPENDED}`}
          >
            {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : rep.status}
          </button>
        </td>

        {/* Actions */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={payNow}
              disabled={payoutLoading || payoutDisabledReason !== null}
              title={payoutDisabledReason ?? undefined}
              className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {payoutLoading ? "Paying…" : payoutDisabledReason ? "Pay now" : `Pay ₹${unpaidRupees.toLocaleString("en-IN")}`}
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={removeRep}
              title={rep.customers.length > 0 ? "Has commission history — suspend instead" : "Remove salesperson"}
              className="rounded-lg border border-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>

      {/* ── Expanded detail ────────────────────────────────────────── */}
      {expanded && (
        <tr className="bg-zinc-900/60">
          <td colSpan={9} className="px-5 py-5 border-b border-zinc-800">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customers */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Customers</h3>
                {rep.customers.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No customers credited yet.</p>
                ) : (
                  <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-zinc-800/50 text-zinc-500">
                          <th className="text-left px-3 py-2 font-medium">Customer</th>
                          <th className="text-left px-3 py-2 font-medium">Plan</th>
                          <th className="text-left px-3 py-2 font-medium">Status</th>
                          <th className="text-left px-3 py-2 font-medium">First Payment</th>
                          <th className="text-right px-3 py-2 font-medium">Payments</th>
                          <th className="text-right px-3 py-2 font-medium">Revenue</th>
                          <th className="text-right px-3 py-2 font-medium">Commission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/70">
                        {rep.customers.map((c) => {
                          const isActive = c.subscriptionStatus === "active";
                          return (
                            <tr key={c.orgId}>
                              <td className="px-3 py-2 text-white">{c.orgName}</td>
                              <td className="px-3 py-2 text-zinc-400">{c.plan}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                                  <span className={isActive ? "text-emerald-400" : "text-red-400"}>{isActive ? "active" : "churned"}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-zinc-400">{formatDate(c.firstPaymentAt)}</td>
                              <td className="px-3 py-2 text-right font-mono text-zinc-300">{c.paymentsCount}</td>
                              <td className="px-3 py-2 text-right font-mono text-zinc-300">{formatPaise(c.revenueInPaise)}</td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-400">{formatPaise(c.commissionInPaise)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Weekly commission strip */}
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest pt-2">Weekly Commission</h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {rep.weekly.map((w, i) => {
                    const isCurrent = i === rep.weekly.length - 1;
                    return (
                      <div
                        key={w.weekStartISO}
                        className={`rounded-lg px-2 py-2 text-center border ${
                          isCurrent ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-800/40 border-zinc-800"
                        }`}
                      >
                        <p className={`text-[10px] ${isCurrent ? "text-amber-300" : "text-zinc-500"}`}>{w.label}</p>
                        <p className={`text-xs font-mono mt-0.5 ${isCurrent ? "text-amber-300 font-semibold" : "text-zinc-300"}`}>
                          {formatPaise(w.commissionInPaise)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editable settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Payout Settings</h3>

                <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 space-y-4">
                  {/* Commission */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Commission rate</p>
                    {editingCommission ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="number"
                          min={1}
                          max={50}
                          className="flex-1 bg-zinc-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none"
                          value={commissionInput}
                          onChange={(e) => setCommissionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveCommission();
                            if (e.key === "Escape") setEditingCommission(false);
                          }}
                        />
                        <span className="text-sm text-zinc-400">%</span>
                        <button
                          onClick={saveCommission}
                          disabled={savingCommission}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCommission(false)}
                          className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingCommission(true)}
                        className="flex items-center gap-1.5 text-sm text-white hover:text-amber-400 transition group/edit"
                      >
                        <span className="font-mono font-semibold">{Math.round(rep.commissionRate * 100)}%</span>
                        <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition" />
                      </button>
                    )}
                  </div>

                  {/* UPI */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">UPI ID</p>
                    {editingUpi ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          className="flex-1 bg-zinc-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none"
                          value={upiInput}
                          onChange={(e) => setUpiInput(e.target.value)}
                          placeholder="name@upi"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveUpi();
                            if (e.key === "Escape") setEditingUpi(false);
                          }}
                        />
                        <button
                          onClick={saveUpi}
                          disabled={savingUpi}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUpi(false)}
                          className="p-1.5 rounded-lg bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingUpi(true)}
                        className="flex items-center gap-1.5 text-sm hover:text-amber-400 transition group/edit"
                      >
                        {rep.upiId ? (
                          <span className="font-mono text-emerald-400">{rep.upiId}</span>
                        ) : (
                          <span className="text-red-400">Not added</span>
                        )}
                        <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-zinc-700/50">
                    <p>Added: {formatDate(rep.createdAt)}</p>
                    <p>Referral link: <code className="text-amber-400">{refLinkFor(rep.affiliateCode)}</code></p>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
