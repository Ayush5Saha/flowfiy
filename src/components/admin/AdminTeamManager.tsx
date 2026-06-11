"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Trash2, UserPlus, Crown } from "lucide-react";

export type TeamAdmin = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

function inputClassName(extra = "") {
  return `w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 ${extra}`;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function AdminTeamManager({
  admins,
  ownerEmail,
}: {
  admins: TeamAdmin[];
  ownerEmail: string;
  currentEmail: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" as "OWNER" | "ADMIN" });

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusyId("new");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Could not add admin.");
        return;
      }
      setSuccess(`${form.email} can now access the admin panel.`);
      setForm({ name: "", email: "", password: "", role: "ADMIN" });
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function patchAdmin(id: string, data: Partial<{ isActive: boolean; role: "OWNER" | "ADMIN" }>) {
    setError(null);
    setSuccess(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not update admin.");
        return;
      }
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeAdmin(admin: TeamAdmin) {
    if (!window.confirm(`Remove ${admin.name} (${admin.email})? They'll lose admin access immediately.`)) return;
    setError(null);
    setSuccess(null);
    setBusyId(admin.id);
    try {
      const res = await fetch(`/api/admin/team/${admin.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not remove admin.");
        return;
      }
      setSuccess(`${admin.email} no longer has admin access.`);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Team Access</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Grant employees access to this admin panel. Each gets their own email and password.
        </p>
      </div>

      {(error || success) && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-500/20 bg-red-500/10 text-red-300"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {error || success}
        </div>
      )}

      {/* ── Add admin ─────────────────────────────────────────── */}
      <form onSubmit={addAdmin} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold">Add a team member</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClassName()} placeholder="Jane Doe" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Email</span>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClassName()} placeholder="jane@company.com" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Temporary password</span>
            <input required type="text" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClassName("font-mono")} placeholder="min 8 chars" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "OWNER" | "ADMIN" })} className={inputClassName()}>
              <option value="ADMIN">Admin — full panel access</option>
              <option value="OWNER">Owner — can also manage team</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Share the password with them securely; they can sign in at <span className="text-zinc-400">/admin/login</span>.</p>
          <button
            type="submit"
            disabled={busyId === "new"}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {busyId === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add member
          </button>
        </div>
      </form>

      {/* ── Team list ─────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Members
        </div>

        {/* Built-in owner (the founder) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800/70 bg-amber-500/[0.03]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{ownerEmail}</p>
              <p className="text-xs text-zinc-500">Built-in owner · full access · can manage team</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">Owner</span>
        </div>

        {admins.length === 0 ? (
          <div className="px-5 py-8 text-sm text-zinc-500 text-center">No team members yet. Add one above.</div>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800/70 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center">
                  <ShieldCheck className={`h-4 w-4 ${admin.isActive ? "text-emerald-400" : "text-zinc-600"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{admin.name} <span className="text-zinc-500 font-normal">· {admin.email}</span></p>
                  <p className="text-xs text-zinc-500">Last login {formatDate(admin.lastLoginAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={admin.role}
                  disabled={busyId === admin.id}
                  onChange={(e) => patchAdmin(admin.id, { role: e.target.value as "OWNER" | "ADMIN" })}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500/60"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                </select>

                <button
                  type="button"
                  disabled={busyId === admin.id}
                  onClick={() => patchAdmin(admin.id, { isActive: !admin.isActive })}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                    admin.isActive
                      ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {busyId === admin.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : admin.isActive ? "Active" : "Disabled"}
                </button>

                <button
                  type="button"
                  disabled={busyId === admin.id}
                  onClick={() => removeAdmin(admin)}
                  title="Remove access"
                  className="rounded-lg border border-red-500/20 p-1.5 text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isPending && <p className="mt-3 text-xs text-zinc-600">Refreshing…</p>}
    </div>
  );
}
