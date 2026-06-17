"use client";

import { useState } from "react";
import { Loader2, Send, Users, FlaskConical, AlertTriangle, CheckCircle2, Mail } from "lucide-react";

interface SegmentOption {
  key: string;
  label: string;
  description: string;
}

type Mode = "preview" | "test" | "send";

export function EmailCampaignClient({
  segments,
  resendConfigured,
  fromEmail,
}: {
  segments: SegmentOption[];
  resendConfigured: boolean;
  fromEmail: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState(segments[0]?.key ?? "all");
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const selected = segments.find((s) => s.key === segment);
  const canCompose = subject.trim().length > 0 && body.trim().length > 0;

  async function run(mode: Mode) {
    if (mode !== "preview" && !canCompose) return;
    if (mode === "send") {
      const ok = confirm(
        `Send this email to the "${selected?.label}" segment${preview ? ` (${preview.count} recipients)` : ""}? This cannot be undone.`
      );
      if (!ok) return;
    }
    setBusy(mode);
    setError(null);
    if (mode !== "preview") setResult(null);
    try {
      const res = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, segment, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (mode === "preview") {
        setPreview({ count: data.count, sample: data.sample ?? [] });
      } else if (mode === "test") {
        setResult(`Test email sent to ${data.sentTo}. The live segment has ${data.count} recipient${data.count === 1 ? "" : "s"}.`);
      } else {
        setResult(`Sent to ${data.sent} of ${data.total} recipients${data.failed ? ` · ${data.failed} failed` : ""}${data.truncated ? " · capped at 5,000" : ""}.`);
        setPreview({ count: data.total, sample: [] });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {!resendConfigured && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Email sending isn&apos;t configured — set <code className="font-mono">RESEND_API_KEY</code> (and a verified <code className="font-mono">RESEND_FROM_EMAIL</code> domain for real delivery). You can still preview recipient counts.</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {result && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {/* Segment / condition */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Send to</label>
        <select
          value={segment}
          onChange={(e) => { setSegment(e.target.value); setPreview(null); }}
          className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        >
          {segments.map((s) => (
            <option key={s.key} value={s.key} className="bg-zinc-900">{s.label}</option>
          ))}
        </select>
        {selected && <p className="text-xs text-zinc-500 mt-2">{selected.description}</p>}

        <button
          onClick={() => run("preview")}
          disabled={busy !== null}
          className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {busy === "preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          Preview recipients
        </button>

        {preview && (
          <div className="mt-3 rounded-lg bg-zinc-950 border border-zinc-800 p-3">
            <p className="text-sm text-white"><span className="font-mono font-semibold text-amber-400">{preview.count.toLocaleString()}</span> recipient{preview.count === 1 ? "" : "s"} match this condition.</p>
            {preview.sample.length > 0 && (
              <p className="text-xs text-zinc-500 mt-1 truncate">e.g. {preview.sample.join(", ")}{preview.count > preview.sample.length ? " …" : ""}</p>
            )}
          </div>
        )}
      </div>

      {/* Compose */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A quick update from Flowfiy"
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            placeholder={"Hi {{name}},\n\nWrite your message here. Use {{name}} to personalize.\n\n— The Flowfiy team"}
            className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none leading-relaxed"
          />
          <p className="text-xs text-zinc-600 mt-1.5">
            <code className="font-mono">{"{{name}}"}</code> is replaced per recipient. Plain text — line breaks are preserved. From: <span className="font-mono">{fromEmail}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => run("test")}
          disabled={busy !== null || !canCompose || !resendConfigured}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          {busy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
          Send test to me
        </button>
        <button
          onClick={() => run("send")}
          disabled={busy !== null || !canCompose || !resendConfigured}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-40"
        >
          {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send campaign
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
          <Mail className="w-3.5 h-3.5" /> Bulk send is capped at 5,000 per campaign.
        </span>
      </div>
    </div>
  );
}
