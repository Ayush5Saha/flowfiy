"use client";

import { useEffect, useState } from "react";
import { Bug, X, Loader2, CheckCircle2 } from "lucide-react";

type Severity = "low" | "medium" | "high" | "critical";

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low — minor / cosmetic" },
  { value: "medium", label: "Medium — annoying but workable" },
  { value: "high", label: "High — blocks part of my work" },
  { value: "critical", label: "Critical — app unusable / data issue" },
];

/**
 * Floating "Report a bug" widget for the dashboard. Captures the current URL
 * and browser automatically and posts to /api/bug-report (which attaches the
 * signed-in user + org server-side).
 */
export function BugReportWidget() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setTitle("");
    setSeverity("medium");
    setDescription("");
    setError("");
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 3) {
      setError("Give the bug a short title.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please add a little more detail.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't submit your report. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't submit your report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { reset(); setOpen(true); }}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-lg hover:text-foreground hover:border-primary/40 transition-colors"
        aria-label="Report a bug"
      >
        <Bug className="w-4 h-4" strokeWidth={1.75} />
        <span className="hidden sm:inline">Report a bug</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Report a bug"
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-primary" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold">Report a bug</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="font-medium mb-1">Thanks — report sent</p>
                <p className="text-muted-foreground text-sm mb-5">
                  Our team will look into it. We may email you for more detail.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1.5">What went wrong?</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={160}
                    required
                    placeholder="e.g. Lead export button does nothing"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Severity)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Details</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    maxLength={5000}
                    placeholder="What did you do, what did you expect, and what happened instead?"
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    We automatically include the current page and your browser to help us reproduce it.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Sending…" : "Send report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
