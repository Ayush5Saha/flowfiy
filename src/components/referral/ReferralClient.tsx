"use client";

import { useState } from "react";
import { Copy, Check, Gift } from "lucide-react";

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
    <div>

      {/* How it works */}
      <section>
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" strokeWidth={1.75} />
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold tabular-nums">1</span>
            Share your unique referral link with friends or on social media.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold tabular-nums">2</span>
            They sign up and upgrade to any paid plan (Starter, Growth, or Agency).
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold tabular-nums">3</span>
            <span>
              You automatically get <strong className="text-foreground">1 free month</strong> credited to your subscription — no action needed.
            </span>
          </li>
        </ol>
      </section>

      {/* Referral link */}
      <section className="border-t border-border pt-8 mt-8">
        <h2 className="text-sm font-semibold mb-3">Your referral link</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground truncate select-all">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
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
          Your referral code: <span className="font-semibold text-foreground tabular-nums">{code}</span>
        </p>
      </section>

      {/* Stats */}
      <section className="border-y border-border py-8 mt-8 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8">
          {[
            { label: "Referrals sent", value: `${totalReferrals}` },
            { label: "Paid conversions", value: `${paidConversions}` },
            { label: "Free months earned", value: `${freeMonthsEarned}` },
            { label: "Credit balance", value: `${creditBalance}`, sub: creditBalance === 1 ? "month" : "months" },
          ].map((s, i) => (
            <div key={s.label} className={i === 0 ? "lg:pr-8" : "lg:px-8 lg:border-l lg:border-border"}>
              <p className="text-[13px] text-muted-foreground">{s.label}</p>
              <p className="mt-2.5 text-[34px] leading-none font-semibold tracking-tight tabular-nums">{s.value}</p>
              {s.sub && <p className="mt-2.5 text-xs text-muted-foreground">{s.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Referral history */}
      {referrals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2">Referral history</h2>
          <div className="divide-y divide-border">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.referredOrgName}</p>
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {PLAN_LABEL[r.plan] ?? r.plan} plan · {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                {r.rewardApplied ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Reward applied
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Pending payment
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {referrals.length === 0 && (
        <div className="border-t border-border pt-12 text-center">
          <p className="text-sm font-medium">No referrals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Share your link to start earning free months.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-8 mt-10">
        Free months are applied automatically to your next billing cycle. There is no limit to how many free months you can earn.
      </p>
    </div>
  );
}
