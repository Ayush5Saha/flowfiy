"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Mail, Phone, Trash2, AlertTriangle, Search } from "lucide-react";

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  packageTier: string | null;
  message: string;
  status: string;
  notes: string | null;
  emailSent: boolean;
  createdAt: string;
};

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;

const STATUS_STYLE: Record<string, string> = {
  NEW:       "bg-blue-500/10 text-blue-300 border-blue-500/25",
  CONTACTED: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  QUALIFIED: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  WON:       "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  LOST:      "bg-zinc-600/15 text-zinc-400 border-zinc-600/30",
};

export default function RoutcoreEnquiriesTable({ enquiries }: { enquiries: Enquiry[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [q, setQ] = useState("");

  const visible = enquiries.filter((e) => {
    if (filter !== "ALL" && e.status !== filter) return false;
    if (!q.trim()) return true;
    const hay = [e.name, e.email, e.companyName, e.phone, e.packageTier, e.message]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/routcore/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ? JSON.stringify(d.error) : "Update failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete the enquiry from ${name}? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/routcore/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Delete failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, company, message…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(["ALL", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-amber-500/15 text-amber-300"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Contact", "Company", "Tier", "Status", "Received", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {visible.map((e) => (
                // Keyed Fragment: the row and its detail row are siblings, so the
                // key belongs on the wrapper, not on each <tr>.
                <Fragment key={e.id}>
                  <tr
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{e.name}</span>
                        {!e.emailSent && (
                          <span title="Notification email did not send">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>
                      <a
                        href={`mailto:${e.email}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="text-xs text-zinc-400 hover:text-amber-400 inline-flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" /> {e.email}
                      </a>
                      {e.phone && (
                        <a
                          href={`tel:${e.phone}`}
                          onClick={(ev) => ev.stopPropagation()}
                          className="block text-xs text-zinc-500 hover:text-amber-400 mt-0.5 inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {e.phone}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{e.companyName || <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{e.packageTier || <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                      <select
                        value={e.status}
                        disabled={busy === e.id}
                        onChange={(ev) => patch(e.id, { status: ev.target.value })}
                        className={`rounded-md border px-2 py-1 text-xs font-medium bg-zinc-900 focus:outline-none disabled:opacity-50 ${
                          STATUS_STYLE[e.status] ?? STATUS_STYLE.NEW
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-zinc-900 text-white">
                            {s[0] + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); remove(e.id, e.name); }}
                        disabled={busy === e.id}
                        className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        aria-label="Delete enquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronDown
                        className={`inline w-4 h-4 ml-1 text-zinc-600 transition-transform ${expanded === e.id ? "rotate-180" : ""}`}
                      />
                    </td>
                  </tr>

                  {expanded === e.id && (
                    <tr className="bg-zinc-950/60">
                      <td colSpan={6} className="px-4 py-4">
                        <p className="text-xs font-medium text-zinc-500 mb-1.5">What they sell &amp; who to</p>
                        <p className="text-sm text-zinc-200 whitespace-pre-wrap bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                          {e.message}
                        </p>

                        <p className="text-xs font-medium text-zinc-500 mt-4 mb-1.5">Internal notes</p>
                        <NotesBox
                          initial={e.notes ?? ""}
                          disabled={busy === e.id}
                          onSave={(notes) => patch(e.id, { notes })}
                        />

                        <p className="mt-3 text-[11px] text-zinc-600">
                          Notification email: {e.emailSent ? "sent" : "NOT sent"} · ID {e.id}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {visible.length === 0 && (
            <p className="text-center py-12 text-zinc-500">
              {enquiries.length === 0
                ? "No enquiries yet — submissions from /routcore will appear here."
                : "No enquiries match this filter."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NotesBox({
  initial,
  disabled,
  onSave,
}: {
  initial: string;
  disabled: boolean;
  onSave: (notes: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Call notes, next steps, quoted price…"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none resize-y"
      />
      <button
        onClick={() => onSave(value)}
        disabled={!dirty || disabled}
        className="mt-2 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/25 disabled:opacity-40 disabled:hover:bg-amber-500/15"
      >
        {dirty ? "Save notes" : "Saved"}
      </button>
    </div>
  );
}
