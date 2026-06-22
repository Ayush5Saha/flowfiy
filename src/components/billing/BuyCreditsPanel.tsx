"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Loader2, Lock } from "lucide-react";

interface Props {
  subscribed: boolean;          // org has an active subscription
  trialLeadsUsed: number;       // leads generated on the no-subscription trial
  trialLeads: number;           // trial allowance (TRIAL_LEADS)
  minCredits: number;           // effective min top-up (75 trial / 50 subscribed)
  balance: number;
  held: number;
}

// `Window.Razorpay` is declared globally in BillingClient.tsx — reuse that.

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function BuyCreditsPanel({ subscribed, trialLeadsUsed, trialLeads, minCredits, balance, held }: Props) {
  const trialExhausted = !subscribed && trialLeadsUsed >= trialLeads;
  const [credits, setCredits] = useState(Math.max(100, minCredits));
  const [cost, setCost] = useState<string>("…");
  const [country, setCountry] = useState("IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/geo").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.country) setCountry(d.country); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (trialExhausted) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      fetch(`/api/credits/quote?credits=${credits}&country=${country}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.formatted) setCost(d.formatted); })
        .catch(() => {});
    }, 250);
  }, [credits, country, trialExhausted]);

  // Trial used up and still no subscription → top-ups are locked behind subscribing.
  if (trialExhausted) {
    return (
      <section className="border-t border-border pt-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Buy credits</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;ve used your {trialLeads} free leads. Subscribe to keep generating and to top up more credits.
        </p>
      </section>
    );
  }

  async function pay() {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits, country }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Couldn't start checkout."); setLoading(false); return; }

      if (data.gateway === "stripe" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data.gateway === "razorpay") {
        const ok = await loadRazorpay();
        if (!ok || !window.Razorpay) { setError("Couldn't load the payment window."); setLoading(false); return; }
        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          order_id: data.orderId,
          name: "Flowfiy",
          description: `${data.credits} credits`,
          prefill: data.prefill,
          handler: () => {
            setNotice("Payment received — credits will appear in a moment.");
            setLoading(false);
            setTimeout(() => window.location.reload(), 4000);
          },
          modal: { ondismiss: () => setLoading(false) },
        });
        rzp.open();
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <h3 className="font-medium">Buy credits</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Balance <span className="font-mono font-semibold text-foreground">{balance.toLocaleString()}</span>
          {held > 0 && <span className="text-xs"> · {held} held</span>}
        </span>
      </div>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}
      {notice && <p className="text-sm text-green-400 mb-3">{notice}</p>}

      {!subscribed && (
        <p className="text-xs text-violet-300 mb-3">
          No subscription needed — fund your first {trialLeads} leads with credits ({trialLeadsUsed}/{trialLeads} used). Minimum {minCredits} credits.
        </p>
      )}

      <label className="block text-sm font-medium mb-1.5">How many credits?</label>
      <input
        type="number"
        min={minCredits}
        max={5000}
        step={10}
        value={credits}
        onChange={(e) => setCredits(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        className="w-40 px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <p className="text-sm text-muted-foreground mt-2">
        Cost: <span className="font-semibold text-foreground">{cost}</span>
        <span className="text-xs"> · ~2 leads/credit (varies by search)</span>
      </p>

      <button
        onClick={pay}
        disabled={loading || credits < minCredits || credits > 5000}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Pay</>}
      </button>
      {(credits < minCredits || credits > 5000) && (
        <p className="text-xs text-muted-foreground mt-2">Choose between {minCredits.toLocaleString()} and 5,000 credits.</p>
      )}
    </div>
  );
}
