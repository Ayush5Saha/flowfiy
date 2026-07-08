"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import AdminUserActions from "@/components/admin/AdminUserActions";

const planColors: Record<string, string> = {
  FREE:    "bg-zinc-700 text-zinc-300",
  FLOWFIY: "bg-emerald-500/20 text-emerald-300",
};

export interface AdminUserRow {
  id: string;
  name: string;            // display name (already resolved server-side)
  email: string;           // "" if none
  phone: string;           // "" if none
  provider: string;        // "email" | "google" | ...
  isVerified: boolean;
  isBanned: boolean;
  orgs: Array<{ id: string; name: string; plan: string; role: string }>;
  createdAt: string | null;    // ISO string
  lastSignIn: string | null;   // ISO string
}

function filterUsers(users: AdminUserRow[], query: string): AdminUserRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return users;

  const qDigits = q.replace(/\D/g, "");

  return users.filter((row) => {
    if (row.name.toLowerCase().includes(q)) return true;
    if (row.email.toLowerCase().includes(q)) return true;
    if (row.id.toLowerCase().includes(q)) return true;
    if (row.orgs.some((o) => o.name.toLowerCase().includes(q))) return true;
    if (row.phone) {
      if (row.phone.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 3 && row.phone.replace(/\D/g, "").includes(qDigits)) return true;
    }
    return false;
  });
}

export default function AdminUsersTable({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterUsers(users, query), [users, query]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or phone…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-8 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {query && (
          <span className="text-xs text-zinc-500">
            {filtered.length} of {users.length} users
          </span>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Auth</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Organizations</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Last Sign In</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Actions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((row) => (
                <tr key={row.id} className={`hover:bg-zinc-800/40 transition-colors ${row.isBanned ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{row.name || "—"}</p>
                      <p className="text-xs text-zinc-500">{row.email}</p>
                      {row.phone && (
                        <p className="text-[10px] text-zinc-600">{row.phone}</p>
                      )}
                      <p className="text-[10px] text-zinc-700 font-mono mt-0.5">{row.id.slice(0, 12)}…</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300 capitalize">
                      {row.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-medium ${row.isVerified ? "text-emerald-400" : "text-amber-400"}`}>
                        {row.isVerified ? "✓ Verified" : "⚠ Unverified"}
                      </span>
                      {row.isBanned && (
                        <span className="text-xs text-red-400">🚫 Banned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.orgs.length === 0 ? (
                        <span className="text-zinc-600 text-xs">—</span>
                      ) : (
                        row.orgs.map((o) => (
                          <span
                            key={o.id}
                            className={`px-2 py-0.5 rounded-full text-xs ${planColors[o.plan] ?? "bg-zinc-700 text-zinc-300"}`}
                          >
                            {o.name} ({o.role})
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {row.lastSignIn ? new Date(row.lastSignIn).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <AdminUserActions
                      userId={row.id}
                      userName={row.name || row.email || row.id}
                      isBanned={row.isBanned}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No users found</p>
          )}
          {users.length > 0 && filtered.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No users match &quot;{query}&quot;</p>
          )}
        </div>
      </div>
    </div>
  );
}
