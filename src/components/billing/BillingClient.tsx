"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, Loader2, Zap, XCircle, AlertTriangle, Check, Tag, ChevronDown, ChevronUp, Coins } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getLocalisedPrice, type LocalisedPrice } from "@/lib/currency";
import { trackMetaPixel } from "@/lib/meta-pixel";

interface Plan {
  key: string;
  name: string;
  priceUsd: number;
  priceInr: number;
  credits: number;
  features: readonly string[];
}

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
}

interface BillingClientProps {
  organization: {
    id: string;
    name: string;
    plan: string;
    subscriptionStatus: string | null;
    razorpaySubscriptionId: string | null;
    stripeSubscriptionId: string | null;
    billingGateway: string | null;
  };
  plan: Plan;
  wallet: { balance: number; held: number };
  creditsUsedThisCycle: number;
  subscriptionActive: boolean;
  trialLeadsUsed: number;
  trialLeads: number;
  ledger: LedgerEntry[];
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

const LEDGER_LABELS: Record<string, string> = {
  HOLD: "Reserved for a run",
  CONSUME: "Used",
  RELEASE: "Released (unused)",
  PURCHASE: "Added",
  GRANT: "Plan credits",
  REFUND: "Refunded",
  ADJUST: "Adjusted",
};

export function BillingClient({ organization, plan, wallet, creditsUsedThisCycle, subscriptionActive, trialLeadsUsed, trialLeads, ledger }: BillingClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("IN"); // default IN until geo loads

  // Referral code state
  const [showRefInput, setShowRefInput] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [refStatus, setRefStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [refName, setRefName] = useState<string | null>(null);
  const refDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const purchaseTrackedRef = useRef(false);

  // Detect visitor country once on mount
  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { country?: string }) => { if (d.country) setCountry(d.country); })
      .catch(() => null);
  }, []);

  // Handle ?success=true redirect from the checkout handler
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      setSuccessBanner(`🎉 You're subscribed — ${plan.credits} credits have been added to your wallet.`);
      if (!purchaseTrackedRef.current) {
        purchaseTrackedRef.current = true;
        const isStripe = searchParams.get("gateway") === "stripe";
        const value = isStripe ? plan.priceUsd : plan.priceInr;
        const currency = isStripe ? "USD" : "INR";
        const params = { value, currency, content_name: plan.name, content_type: "subscription" };
        trackMetaPixel("Purchase", params);
        trackMetaPixel("Subscribe", { ...params, predicted_ltv: value });
      }
      window.history.replaceState({}, "", "/billing");
      localStorage.removeItem("flowfiy_ref");
    }
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Payment was not completed. Please try again.");
      window.history.replaceState({}, "", "/billing");
    }
  }, [searchParams, plan]);

  // Pre-fill referral code from localStorage (set when visiting /signup?ref=CODE)
  useEffect(() => {
    const stored = localStorage.getItem("flowfiy_ref");
    if (stored) {
      setRefCode(stored);
      setShowRefInput(true);
    }
  }, []);

  // Debounced validation when referral code changes
  useEffect(() => {
    const code = refCode.trim().toUpperCase();
    if (!code || code.length < 8) {
      setRefStatus("idle");
      setRefName(null);
      return;
    }
    if (refDebounceRef.current) clearTimeout(refDebounceRef.current);
    refDebounceRef.current = setTimeout(async () => {
      setRefStatus("validating");
      setRefName(null);
      try {
        const res = await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, organizationId: organization.id }),
        });
        const data = await res.json() as { valid: boolean; referrerName?: string };
        if (data.valid) { setRefStatus("valid"); setRefName(data.referrerName ?? null); }
        else { setRefStatus("invalid"); setRefName(null); }
      } catch {
        setRefStatus("invalid");
      }
    }, 500);
    return () => { if (refDebounceRef.current) clearTimeout(refDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refCode]);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { organizationId: organization.id, plan: plan.key, country };
      if (refStatus === "valid" && refCode.trim()) body.referralCode = refCode.trim().toUpperCase();
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as {
        gateway?: "razorpay" | "stripe";
        planName?: string;
        error?: string;
        subscriptionId?: string;
        keyId?: string;
        priceInr?: number;
        prefill?: { name: string; email: string };
        checkoutUrl?: string;
      };

      if (!res.ok) { setError(data.error ?? "Failed to start checkout. Please try again."); setLoading(false); return; }

      if (data.gateway === "stripe") {
        if (!data.checkoutUrl) { setError("Failed to create Stripe checkout session."); setLoading(false); return; }
        window.location.href = data.checkoutUrl;
        return;
      }

      if (!data.subscriptionId || !data.keyId) { setError(data.error ?? "Failed to start checkout."); setLoading(false); return; }

      await loadRazorpayScript();
      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Flowfiy",
        description: `${data.planName} — ${data.priceInr ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(data.priceInr) : ""}/month`,
        image: "/logo.png",
        prefill: data.prefill ?? {},
        handler: () => { window.location.href = `/billing?success=true&plan=${plan.key}`; },
        modal: { ondismiss: () => setLoading(false), escape: true, confirm_close: true },
        theme: { color: "#6366f1" },
        notes: { organizationId: organization.id, orgName: organization.name },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel your subscription at the end of the current billing period?")) return;
    setCancelLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id }),
      });
      const data = await res.json() as { gateway?: string; portalUrl?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to cancel subscription."); return; }
      if (data.gateway === "stripe" && data.portalUrl) { window.location.href = data.portalUrl; return; }
      setCancelRequested(true);
    } finally {
      setCancelLoading(false);
    }
  }

  const statusLabel = cancelRequested ? "pending_cancellation" : organization.subscriptionStatus;
  const statusColor: Record<string, string> = {
    active: "text-green-400",
    pending: "text-yellow-400",
    payment_failed: "text-red-400",
    halted: "text-red-400",
    pending_cancellation: "text-amber-400",
    cancelled: "text-zinc-400",
  };

  const localised: LocalisedPrice = getLocalisedPrice(plan.priceInr, country);

  return (
    <div className="space-y-6">

      {/* Success banner */}
      {successBanner && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="ml-auto text-green-400/60 hover:text-green-400">✕</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-destructive/60 hover:text-destructive">✕</button>
        </div>
      )}

      {/* Payment failed warning */}
      {(statusLabel === "payment_failed" || statusLabel === "halted") && !error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            {statusLabel === "halted"
              ? "Your subscription was halted after repeated payment failures. Subscribe again to restore access."
              : "Your last payment failed. We'll retry automatically — please ensure your card is valid."}
          </span>
        </div>
      )}

      {/* ── No-subscription trial progress ─────────────────────────────── */}
      {!subscriptionActive && (
        <div className="bg-card border border-violet-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-sm">Free trial — no subscription needed</p>
            <span className="text-sm font-mono">{Math.min(trialLeadsUsed, trialLeads).toLocaleString()} / {trialLeads.toLocaleString()} leads</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="h-2 rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((trialLeadsUsed / trialLeads) * 100))}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {trialLeadsUsed >= trialLeads
              ? `You've used your ${trialLeads} free leads — subscribe below to keep generating.`
              : `Top up credits and generate up to ${trialLeads} leads with no subscription. Beyond ${trialLeads}, a plan is required.`}
          </p>
        </div>
      )}

      {/* ── Credit wallet ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Credit balance</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="text-2xl font-bold font-mono">{wallet.balance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reserved</p>
            <p className="text-2xl font-bold font-mono text-amber-400">{wallet.held.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Used this cycle</p>
            <p className="text-2xl font-bold font-mono">{creditsUsedThisCycle.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Renews to</p>
            <p className="text-2xl font-bold font-mono">{subscriptionActive ? plan.credits.toLocaleString() : "—"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
          <Coins className="w-3 h-3" /> ~2 leads per credit (varies by search). You only pay for qualified leads — credits are reserved at run start and reconciled to actual cost.
        </p>
      </div>

      {/* ── Subscription ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">Current plan</p>
          {subscriptionActive && (organization.razorpaySubscriptionId || organization.stripeSubscriptionId) && !cancelRequested && statusLabel !== "cancelled" && (
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-secondary transition-colors disabled:opacity-50 text-muted-foreground"
            >
              {cancelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              {organization.billingGateway === "stripe" ? "Manage subscription" : "Cancel plan"}
            </button>
          )}
        </div>

        {subscriptionActive ? (
          <>
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">{plan.name}</p>
              <span className="text-sm text-muted-foreground">· {localised.formatted}/mo</span>
              <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" /> Active</span>
            </div>
            {cancelRequested && (
              <p className="text-xs text-amber-400 mt-2">
                Cancellation scheduled — you keep full access until the end of the current billing period.
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {plan.credits} credits are added each billing cycle. Need more before renewal? Top up below.
            </p>
          </>
        ) : (
          <SubscribeCard
            plan={plan}
            localised={localised}
            loading={loading}
            onSubscribe={handleSubscribe}
            statusLabel={statusLabel}
            statusColor={statusColor}
          />
        )}
      </div>

      {/* ── Referral code (only before subscribing) ───────────────────── */}
      {!subscriptionActive && (
        <div className="bg-card border border-border rounded-xl p-4">
          <button
            type="button"
            onClick={() => setShowRefInput((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <Tag className="w-4 h-4" />
            <span>Have a referral code?</span>
            {showRefInput ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
          </button>
          {showRefInput && (
            <div className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code (e.g. FLOW1XY9)"
                  maxLength={8}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-28"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs">
                  {refStatus === "validating" && <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />Checking…</span>}
                  {refStatus === "valid" && <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" />Valid</span>}
                  {refStatus === "invalid" && <span className="flex items-center gap-1 text-destructive"><XCircle className="w-3 h-3" />Invalid</span>}
                </div>
              </div>
              {refStatus === "valid" && refName && (
                <p className="text-xs text-green-400 mt-1.5">✓ Referred by <strong>{refName}</strong> — your first month will earn them a free month!</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Recent activity ───────────────────────────────────────────── */}
      {ledger.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Recent credit activity</h2>
          <ul className="divide-y divide-border">
            {ledger.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{LEDGER_LABELS[e.type] ?? e.type}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
                  <span className={`font-mono font-medium w-16 text-right ${e.amount >= 0 ? "text-green-400" : "text-foreground"}`}>
                    {e.amount >= 0 ? "+" : ""}{e.amount.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Payments processed securely by {country === "IN" ? "Razorpay (INR)" : "Stripe (USD)"}. GST is added at checkout where applicable. Plan credits roll over once and expire 60 days after they are issued. Cancellation takes effect at the end of the billing period.
      </p>
    </div>
  );
}

// ── Subscribe card (shown when no active subscription) ──────────────────
function SubscribeCard({
  plan, localised, loading, onSubscribe, statusLabel, statusColor,
}: {
  plan: Plan;
  localised: LocalisedPrice;
  loading: boolean;
  onSubscribe: () => void;
  statusLabel: string | null;
  statusColor: Record<string, string>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xl font-semibold">No active subscription</p>
        {statusLabel && statusLabel !== "active" && (
          <span className={`text-xs ${statusColor[statusLabel] ?? "text-muted-foreground"}`}>({statusLabel.replace("_", " ")})</span>
        )}
      </div>

      <div className="rounded-xl border border-primary/40 bg-primary/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{plan.name}</p>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{plan.credits} credits / mo</span>
            </div>
            <ul className="space-y-1 mt-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-mono">{localised.formatted}</p>
            <p className="text-xs text-muted-foreground">/month</p>
            {localised.currency.code !== "INR" && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">{localised.note}</p>
            )}
            <button
              onClick={onSubscribe}
              disabled={loading}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
