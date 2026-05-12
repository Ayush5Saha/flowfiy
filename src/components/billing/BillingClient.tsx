"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Zap, XCircle } from "lucide-react";

interface BillingClientProps {
  organization: {
    id: string;
    plan: string;
    generationCount: number;
    generationLimit: number;
    subscriptionStatus: string | null;
    razorpaySubscriptionId: string | null;
  };
  usageThisMonth: number;
  plans: Array<{ key: string; name: string; price: number; generationLimit: number; seats: number }>;
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
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export function BillingClient({ organization, usageThisMonth, plans }: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  const usagePercent = organization.generationLimit === -1
    ? 0
    : Math.min(100, Math.round((organization.generationCount / organization.generationLimit) * 100));

  async function handleUpgrade(planKey: string) {
    setLoading(planKey);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id, plan: planKey }),
      });
      const data = await res.json() as { subscriptionId?: string; keyId?: string; planName?: string; error?: string };

      if (!data.subscriptionId || !data.keyId) {
        console.error("Checkout error:", data.error);
        return;
      }

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Flowfiy",
        description: `${data.planName} Plan`,
        handler: () => {
          window.location.href = `/billing?success=true&plan=${planKey}`;
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
        theme: { color: "#6366f1" },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel your subscription at the end of the current billing period?")) return;
    setCancelLoading(true);
    try {
      await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id }),
      });
      setCancelRequested(true);
    } finally {
      setCancelLoading(false);
    }
  }

  const statusLabel = cancelRequested ? "pending_cancellation" : organization.subscriptionStatus;

  return (
    <div className="space-y-6">
      {/* Current plan + usage */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-xl font-semibold capitalize mt-0.5">
              {organization.plan.toLowerCase()}{" "}
              {statusLabel && statusLabel !== "active" && (
                <span className="text-xs text-destructive font-normal">({statusLabel})</span>
              )}
            </p>
          </div>

          {organization.razorpaySubscriptionId && organization.plan !== "FREE" && !cancelRequested && (
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
            Your subscription will be cancelled at the end of the current billing period. You keep access until then.
          </p>
        )}

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Lead generations used</span>
            <span className="font-mono">
              {organization.generationCount.toLocaleString()}
              {organization.generationLimit !== -1 && ` / ${organization.generationLimit.toLocaleString()}`}
            </span>
          </div>
          {organization.generationLimit !== -1 && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${usagePercent > 80 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {usageThisMonth} generations this billing period
          </p>
        </div>
      </div>

      {/* Pricing plans */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Plans</h2>
        <div className="grid gap-3">
          {plans.filter((p) => p.key !== "FREE").map((plan) => {
            const isCurrent = plan.key === organization.plan;
            const isPopular = plan.key === "GROWTH";

            return (
              <div
                key={plan.key}
                className={`bg-card border rounded-xl p-5 flex items-center justify-between ${
                  isPopular ? "border-primary/40" : "border-border"
                } ${isCurrent ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{plan.name}</p>
                      {isPopular && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Popular</span>
                      )}
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" /> Current
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {plan.generationLimit === -1 ? "Unlimited" : plan.generationLimit.toLocaleString()} generations/mo ·{" "}
                      {plan.seats} seat{plan.seats > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono">${plan.price}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={loading !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {loading === plan.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Payments powered by Razorpay. Unused generations don&apos;t roll over.
      </p>
    </div>
  );
}
