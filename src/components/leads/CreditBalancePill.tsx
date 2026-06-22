"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";

// Module-level cache so the balance survives component remounts. The sidebar
// re-renders on every navigation, which can remount this pill; without the
// cache the balance would flash back to "…" and refetch each time.
let cachedBalance: number | null = null;

/** Wallet balance chip. Polls /api/credits once on mount; links to billing. */
export function CreditBalancePill({ className = "" }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(cachedBalance);

  useEffect(() => {
    let active = true;
    fetch("/api/credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.balance === "number") {
          cachedBalance = d.balance;
          setBalance(d.balance);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <Link
      href="/billing"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors ${className}`}
      title="Credit balance — manage in Billing"
    >
      <Coins className="w-3.5 h-3.5" />
      {balance === null ? "…" : `${balance.toLocaleString()} credits`}
    </Link>
  );
}
