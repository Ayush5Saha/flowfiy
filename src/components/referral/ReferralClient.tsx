"use client";

import { useState } from "react";
import { Copy, Check, Gift, Users, Star, TrendingUp } from "lucide-react";

interface ReferralEntry {
  id: string;
  referredOrgName: string;
  plan: string;
  rewardApplied: boolean;
  rewardAppliedAt: string | null;
  createdAt: string;
}

interface ReferralClientProps {
  code: string;
  totalReferrals: number;
  paidConversions: number;
  freeMonthsEarned: number;
  creditBalance: number;
  referrals: ReferralEntry[];
}

const PLAN_LABEL: Record<string, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  AGENCY: "Agency",
};

export function ReferralClient({
  code,
  totalReferrals,
  paidConversions,
  freeMonthsEarned,
  creditBalance,
  referrals,
}: ReferralClientProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
  const referralLink = `${appUrl}/signup?ref=${code}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6">

      {/* How it works */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">1</span>
            Share your unique referral link with friends or on social media.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">2</span>
            They sign up and upgrade to any paid plan (Starter, Growth, or Agency).
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">3</span>
            <span>
              You automatically get <strong className="text-foreground">1 free month</strong> credited to your subscription — no action needed.
            </span>
          </li>
        </ol>
      </div>

      {/* Referral link */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-3">Your referral link</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-muted-foreground truncate select-all">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy link
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your referral code: <span className="font-mono font-semibold text-foreground">{code}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Referrals sent"
          value={totalReferrals}
          color="text-blue-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Paid conversions"
          value={paidConversions}
          color="text-green-400"
        />
        <StatCard
          icon={<Gift className="w-5 h-5" />}
          label="Free months earned"
          value={freeMonthsEarned}
          color="text-purple-400"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Credit balance"
          value={creditBalance}
          suffix={creditBalance === 1 ? " month" : " months"}
          color="text-amber-400"
        />
      </div>

      {/* Referral history */}
      {referrals.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Referral history</h2>
          </div>
          <div className="divide-y divide-border">
            {referrals.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{r.referredOrgName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PLAN_LABEL[r.plan] ?? r.plan} plan · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {r.rewardApplied ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Reward applied
                  </span>
                ) : (
                  <span className="text-xs text-amber-400 font-medium">Pending payment</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {referrals.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No referrals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Share your link to start earning free months.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Free months are applied automatically to your next billing cycle. There is no limit to how many free months you can earn.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix = "",
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold font-mono">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
