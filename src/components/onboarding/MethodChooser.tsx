"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, PencilLine, Globe } from "lucide-react";

const STATUS_LINES = [
  "Reading your website…",
  "Understanding your offer…",
  "Drafting your ICP…",
];

export function MethodChooser({
  url,
  setUrl,
  loading,
  error,
  onAnalyze,
  onManual,
}: {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  error: string;
  onAnalyze: () => void;
  onManual: () => void;
}) {
  const [statusIdx, setStatusIdx] = useState(0);

  // Purely cosmetic rotating status while the analyze request is in flight.
  useEffect(() => {
    if (!loading) {
      setStatusIdx(0);
      return;
    }
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % STATUS_LINES.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Define your business & ICP</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Import it from your website, or fill it in yourself.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Import from website */}
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Import from your website</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              We&apos;ll read your site and draft your profile — you review before saving.
            </p>

            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{STATUS_LINES[statusIdx]}</span>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (url.trim()) onAnalyze();
                      }
                    }}
                    placeholder="https://yourcompany.com"
                    className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <button
                  type="button"
                  onClick={onAnalyze}
                  disabled={!url.trim()}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Analyze website
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enter manually */}
      <button
        type="button"
        onClick={onManual}
        disabled={loading}
        className="w-full text-left border border-border rounded-lg p-4 hover:border-primary/50 transition-colors disabled:opacity-50"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
            <PencilLine className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium">Enter manually</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Fill in your business and ICP details yourself.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
