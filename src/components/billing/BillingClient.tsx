"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Loader2, Zap, XCircle, AlertTriangle, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Plan {
  key: string;
  name: string;
  priceUsd: number;
  priceInr: number;
  generationLimit: number;
  seats: number;
  features: readonly string[];
}

interface BillingClientProps {
  organization: {
    id: string;
    name: string;
    plan: string;
    generationCount: number;
    generationLimit: number;
    subscriptionStatus: string | null;
    razorpaySubscriptionId: string | null;
  };
  usageThisMonth: number;
  plans: Plan[];
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

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function BillingClient({ organization, usageThisMonth, plans }: BillingClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Handle ?success=true&plan=GROWTH redirect from Razorpay handler
  useEffect(() => {
    const success = searchParams.get("success");
    const plan = searchParams.get("plan");
    if (success === "true" && plan) {
      setSuccessBanner(`🎉 You're now on the ${plan.charAt(0) + plan.slice(1).toLowerCase()} plan! Your limits have been updated.`);
      // Clean up the URL without reload
      window.history.replaceState({}, "", "/billing");
    }
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Payment was not completed. Please try again.");
      window.history.replaceState({}, "", "/billing");
    }
  }, [searchParams]);

  const usagePercent = organization.generationLimit === -1
    ? 0
    : Math.min(100, Math.round((organization.generationCount / organization.generationLimit) * 100));

  async function handleUpgrade(planKey: string) {
    setLoading(planKey);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id, plan: planKey }),
      });
      const data = await res.json() as {
        subscriptionId?: string;
        keyId?: string;
        planName?: string;
        priceInr?: number;
        prefill?: { name: string; email: string };
        error?: string;
      };

      if (!res.ok || !data.subscriptionId || !data.keyId) {
        setError(data.error ?? "Failed to create checkout. Please try again.");
        setLoading(null);
        return;
      }

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Flowfiy",
        description: `${data.planName} Plan — ${data.priceInr ? formatInr(data.priceInr) : ""}/month`,
        image: "/logo.png",         // optional — add your logo at /public/logo.png
        prefill: data.prefill ?? {},
        handler: () => {
          window.location.href = `/billing?success=true&plan=${planKey}`;
        },
        modal: {
          ondismiss: () => setLoading(null),
          escape: true,
          confirm_close: true,
        },
        theme: { color: "#6366f1" },
        notes: {
          organizationId: organization.id,
          orgName: organization.name,
        },
      });

      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      setError(msg);
      setLoading(null);
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
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to cancel subscription.");
      } else {
        setCancelRequested(true);
      }
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
              ? "Your subscription was halted after repeated payment failures. Please upgrade again to restore access."
              : "Your last payment failed. Razorpay will retry automatically. Please ensure your card is valid."}
          </span>
        </div>
      )}

      {/* Current plan + usage */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-semibold capitalize">
                {organization.plan.toLowerCase()}
              </p>
              {statusLabel && statusLabel !== "active" && (
                <span className={`text-xs font-normal ${statusColor[statusLabel] ?? "text-muted-foreground"}`}>
                  ({statusLabel.replace("_", " ")})
                </span>
              )}
              {statusLabel === "active" && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>

          {organization.razorpaySubscriptionId && organization.plan !== "FREE" && !cancelRequested && statusLabel !== "cancelled" && (
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-50 text-muted-foreground"
            >
              {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancel plan
            </button>
          )}
        </div>

        {cancelRequested && (
          <p className="text-xs text-amber-400 mb-4">
            Cancellation scheduled — you keep full access until the end of the current billing period.
          </p>
        )}

        {/* Usage bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Lead generations used</span>
            <span className="font-mono">
              {organization.generationCount.toLocaleString()}
              {organization.generationLimit !== -1 && ` / ${organization.generationLimit.toLocaleString()}`}
              {organization.generationLimit === -1 && " / ∞"}
            </span>
          </div>
          {organization.generationLimit !== -1 && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  usagePercent > 90 ? "bg-destructive" : usagePercent > 70 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          <div className="flex justify-between mt-2">
            <p className="text-xs text-muted-foreground">{usageThisMonth} this billing period</p>
            {usagePercent > 80 && organization.generationLimit !== -1 && (
              <p className="text-xs text-amber-400 font-medium">Approaching limit — consider upgrading</p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing plans */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Plans</h2>
        <div className="grid gap-3">
          {plans.filter((p) => p.key !== "FREE").map((plan) => {
            const isCurrent = plan.key === organization.plan;
            const isPopular = plan.key === "GROWTH";
            const isDowngrade = ["STARTER"].includes(plan.key) && ["GROWTH", "AGENCY"].includes(organization.plan);

            return (
              <div
                key={plan.key}
                className={`bg-card border rounded-xl p-5 ${
                  isPopular ? "border-primary/40" : "border-border"
                } ${isCurrent ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: plan info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{plan.name}</p>
                      {isPopular && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Most popular</span>
                      )}
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" /> Current plan
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      {plan.generationLimit === -1 ? "Unlimited" : plan.generationLimit.toLocaleString()} generations/mo · {plan.seats} seat{plan.seats > 1 ? "s" : ""}
                    </p>
                    <ul className="space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: price + button */}
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold font-mono">{formatInr(plan.priceInr)}</p>
                    <p className="text-xs text-muted-foreground">/month · ~${plan.priceUsd} USD</p>

                    {!isCurrent ? (
                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={loading !== null}
                        className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          isDowngrade
                            ? "border border-border text-muted-foreground hover:bg-secondary"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {loading === plan.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        {isDowngrade ? "Switch plan" : "Upgrade"}
                      </button>
                    ) : (
                      <div className="mt-3 h-9" /> // spacer
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed securely by Razorpay. Prices in INR. Unused generations don&apos;t roll over. Cancellation takes effect at the end of the billing period.
      </p>
    </div>
  );
}
