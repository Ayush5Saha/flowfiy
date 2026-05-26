"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, TrendingUp, Users, DollarSign, CreditCard, LogIn, ExternalLink } from "lucide-react";

type Conversion = {
  id: string;
  plan: string;
  paymentAmountInPaise: string;
  commissionAmountInPaise: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

type AffiliateData = {
  name: string;
  email: string;
  affiliateCode: string;
  commissionRate: number;
  totalClicks: number;
  totalSignups: number;
  totalEarningsInPaise: string;
  totalPaidInPaise: string;
  unpaidEarningsInPaise: string;
  upiId: string | null;
  razorpayFundAccountId: string | null;
  conversions: Conversion[];
};

function formatPaise(paise: string | number): string {
  const amount = Number(paise) / 100;
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  APPROVED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function AffiliateDashboardPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [upiId, setUpiId] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);
  const [loginSent, setLoginSent] = useState(false);
  const [sendingLogin, setSendingLogin] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/affiliate/me");
    if (res.status === 401) { setUnauthorized(true); setLoading(false); return; }
    const data = await res.json();
    setAffiliate(data.affiliate);
    setUpiId(data.affiliate?.upiId ?? "");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://flowfiy.com";

  async function copyLink() {
    if (!affiliate) return;
    await navigator.clipboard.writeText(`${appUrl}?ref=${affiliate.affiliateCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveUpi(e: React.FormEvent) {
    e.preventDefault();
    setSavingUpi(true);
    await fetch("/api/affiliate/payment-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId }),
    });
    setSavingUpi(false);
    setUpiSaved(true);
    setTimeout(() => setUpiSaved(false), 3000);
  }

  async function sendLoginLink(e: React.FormEvent) {
    e.preventDefault();
    setSendingLogin(true);
    await fetch("/api/affiliate/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSendingLogin(false);
    setLoginSent(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
          <LogIn className="w-6 h-6 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Sign in to your dashboard</h2>
        <p className="text-zinc-400 mb-8">Enter your affiliate email and we&apos;ll send you a login link.</p>
        {loginSent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <p className="text-emerald-400 font-medium mb-1">Link sent!</p>
            <p className="text-sm text-zinc-400">Check your inbox and click the link to log in.</p>
          </div>
        ) : (
          <form onSubmit={sendLoginLink} className="space-y-3">
            <input
              required
              type="email"
              className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={sendingLogin}
              className="w-full py-2.5 bg-primary rounded-xl text-white font-semibold text-sm disabled:opacity-60"
            >
              {sendingLogin ? "Sending…" : "Send login link"}
            </button>
          </form>
        )}
        <p className="text-xs text-zinc-600 mt-6">
          Not an affiliate yet?{" "}
          <a href="/affiliates" className="text-violet-400 hover:underline">Apply here</a>
        </p>
      </div>
    );
  }

  if (!affiliate) return null;

  const affiliateLink = `${appUrl}?ref=${affiliate.affiliateCode}`;
  const stats = [
    { icon: ExternalLink, label: "Total clicks", value: affiliate.totalClicks.toLocaleString(), color: "text-blue-400" },
    { icon: Users, label: "Paying customers", value: affiliate.totalSignups.toLocaleString(), color: "text-violet-400" },
    { icon: TrendingUp, label: "Total earned", value: formatPaise(affiliate.totalEarningsInPaise), color: "text-emerald-400" },
    { icon: DollarSign, label: "Unpaid balance", value: formatPaise(affiliate.unpaidEarningsInPaise), color: "text-amber-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Hey, {affiliate.name.split(" ")[0]} 👋</h1>
        <p className="text-zinc-400 text-sm">Your {Math.round(affiliate.commissionRate * 100)}% commission dashboard</p>
      </div>

      {/* Affiliate link */}
      <div className="bg-zinc-900/60 border border-white/8 rounded-2xl p-5 mb-6">
        <p className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">Your affiliate link</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm text-violet-300 bg-black/20 rounded-lg px-3 py-2 truncate">{affiliateLink}</code>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm hover:bg-violet-500/20 transition shrink-0"
          >
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-2">Share this link. Anyone who signs up and subscribes earns you {Math.round(affiliate.commissionRate * 100)}% — every month.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-white/6 rounded-xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <p className={`text-xl font-bold ${color} font-mono`}>{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversions */}
        <div className="bg-zinc-900/50 border border-white/6 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-semibold text-white text-sm">Recent conversions</h2>
          </div>
          {affiliate.conversions.length === 0 ? (
            <div className="px-5 py-8 text-center text-zinc-500 text-sm">
              No conversions yet. Share your link to start earning!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {affiliate.conversions.slice(0, 10).map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{c.plan} plan</p>
                    <p className="text-xs text-zinc-500">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">{formatPaise(c.commissionAmountInPaise)}</p>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${statusColors[c.status] ?? statusColors.PENDING}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout settings */}
        <div className="bg-zinc-900/50 border border-white/6 rounded-2xl p-5">
          <h2 className="font-semibold text-white text-sm mb-1">Payout settings</h2>
          <p className="text-xs text-zinc-500 mb-4">Add your UPI ID to receive monthly payouts. Minimum payout: ₹500.</p>
          <form onSubmit={saveUpi} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">UPI ID</label>
              <input
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
                placeholder="name@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                pattern="^[\w.\-]+@[\w]+$"
                title="Enter a valid UPI ID (e.g. name@upi)"
              />
            </div>
            <button
              type="submit"
              disabled={savingUpi || !upiId}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-sm text-white font-medium transition disabled:opacity-50"
            >
              {savingUpi ? "Saving…" : upiSaved ? "✓ Saved" : "Save UPI ID"}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-xs text-zinc-500 mb-2">Total paid out</p>
            <p className="text-2xl font-bold text-white font-mono">{formatPaise(affiliate.totalPaidInPaise)}</p>
          </div>
        </div>
      </div>

      {/* Login link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => { setLoginSent(false); setUnauthorized(true); }}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition"
        >
          Get a new login link
        </button>
      </div>
    </div>
  );
}
