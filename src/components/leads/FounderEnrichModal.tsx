"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2, AlertTriangle, Sparkles } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteResponse {
  eligibleLeads: number;
  creditsPerLead: number;
  maxCredits: number;
  maxInr: number;
  balance: number;
  sufficient: boolean;
  affordableLeads: number;
}

interface FounderEnrichModalProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  organizationId: string;
  /** Undefined = bulk (whole list). Pass a single-element array for one lead. */
  leadIds?: string[];
  title?: string;
  /** Called after a successful enqueue — parent should start polling router.refresh(). */
  onDone?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FounderEnrichModal({
  open,
  onClose,
  listId,
  organizationId,
  leadIds,
  title = "Get founder emails",
  onDone,
}: FounderEnrichModalProps) {
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch the quote whenever the modal opens (fresh balance/eligibility each time).
  useEffect(() => {
    if (!open) return;
    setQuote(null);
    setQuoteError("");
    setSubmitError("");
    setSuccess(null);
    setLoadingQuote(true);

    let active = true;
    fetch(`/api/leads/${listId}/enrich-founders/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, ...(leadIds ? { leadIds } : {}) }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok || !json) {
          setQuoteError((json && json.message) || "Could not fetch a quote. Please try again.");
          return;
        }
        setQuote(json as QuoteResponse);
      })
      .catch(() => {
        if (active) setQuoteError("Could not fetch a quote. Please try again.");
      })
      .finally(() => {
        if (active) setLoadingQuote(false);
      });

    return () => {
      active = false;
    };
    // leadIds is compared by value (JSON) so an inline array literal from the
    // caller doesn't retrigger this effect on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listId, organizationId, JSON.stringify(leadIds)]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/leads/${listId}/enrich-founders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ...(leadIds ? { leadIds } : {}) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) {
        setSubmitError((json && json.message) || "Something went wrong. Please try again.");
        return;
      }
      const enqueued = typeof json.enqueued === "number" ? json.enqueued : 0;
      setSuccess(
        `Finding founders for ${enqueued} ${enqueued === 1 ? "company" : "companies"}… this runs in the background and updates as it completes.`
      );
      onDone?.();
      setTimeout(() => onClose(), 1800);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingQuote ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Getting a quote…
          </div>
        ) : quoteError ? (
          <>
            <p className="text-xs text-destructive mt-3">{quoteError}</p>
            <div className="flex justify-end mt-5">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : quote ? (
          success ? (
            <>
              <p className="text-xs text-green-400 mt-3 leading-relaxed">{success}</p>
              <div className="flex justify-end mt-5">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs rounded-md bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : quote.eligibleLeads === 0 ? (
            <>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                All these leads already have a founder/decision-maker email — nothing to enrich.
              </p>
              <div className="flex justify-end mt-5">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs rounded-md bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We&apos;ll find each company&apos;s founder on LinkedIn and use their verified email for
                outreach instead of the generic website address.
              </p>

              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-4 px-3 py-2.5 rounded-lg bg-secondary/50 border border-border text-xs">
                <span className="font-medium tabular-nums">{quote.eligibleLeads}</span>
                <span className="text-muted-foreground">{quote.eligibleLeads === 1 ? "company" : "companies"}</span>
                <span className="text-muted-foreground">·</span>
                <span className="tabular-nums">{quote.creditsPerLead}</span>
                <span className="text-muted-foreground">credits each ·</span>
                <span className="font-medium">
                  up to <span className="tabular-nums">{quote.maxCredits}</span> credits
                </span>
                <span className="text-muted-foreground">(≈ ₹{quote.maxInr.toLocaleString("en-IN")})</span>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                You&apos;re only charged for founders we actually find — misses cost nothing.
              </p>

              <p className="text-xs text-muted-foreground mt-3">
                Balance: <span className="tabular-nums font-medium text-foreground">{quote.balance.toLocaleString("en-IN")}</span> credits.
              </p>

              {!quote.sufficient && (
                <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400 leading-relaxed">
                    Not enough credits — you can enrich up to {quote.affordableLeads} now, or{" "}
                    <Link href="/billing" className="underline hover:text-amber-300">
                      top up
                    </Link>
                    .
                  </p>
                </div>
              )}

              {submitError && <p className="text-xs text-destructive mt-3">{submitError}</p>}

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleConfirm()}
                  disabled={submitting || !quote.sufficient || quote.eligibleLeads === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm — use up to {quote.maxCredits} credits
                </button>
              </div>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
