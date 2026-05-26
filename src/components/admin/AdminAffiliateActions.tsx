"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  affiliateId: string;
  currentStatus: string;
  hasFundAccount: boolean;
  unpaidApprovedInPaise: string;
};

export default function AdminAffiliateActions({
  affiliateId,
  currentStatus,
  hasFundAccount,
  unpaidApprovedInPaise,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const unpaid = Number(unpaidApprovedInPaise) / 100;

  async function updateStatus(status: "ACTIVE" | "SUSPENDED") {
    setLoading(status);
    const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to update status");
    }
  }

  async function triggerPayout() {
    if (!hasFundAccount) {
      alert("Affiliate has not added a UPI ID yet.");
      return;
    }
    if (unpaid < 5) {
      alert("No approved balance to pay out.");
      return;
    }
    if (!confirm(`Pay out ₹${unpaid.toLocaleString("en-IN")} to this affiliate via Razorpay X?`)) return;

    setLoading("payout");
    const res = await fetch(`/api/admin/affiliates/${affiliateId}/payout`, { method: "POST" });
    setLoading(null);

    const data = await res.json();
    if (res.ok) {
      alert(`Payout of ₹${data.amountPaid} initiated! Payout ID: ${data.payoutId}`);
      router.refresh();
    } else {
      alert(data.error ?? "Payout failed");
    }
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      {currentStatus === "PENDING" && (
        <button
          onClick={() => updateStatus("ACTIVE")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition disabled:opacity-50"
        >
          {loading === "ACTIVE" ? "Approving…" : "Approve"}
        </button>
      )}
      {currentStatus === "ACTIVE" && (
        <button
          onClick={() => updateStatus("SUSPENDED")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50"
        >
          {loading === "SUSPENDED" ? "Suspending…" : "Suspend"}
        </button>
      )}
      {currentStatus === "SUSPENDED" && (
        <button
          onClick={() => updateStatus("ACTIVE")}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition disabled:opacity-50"
        >
          {loading === "ACTIVE" ? "Reactivating…" : "Reactivate"}
        </button>
      )}
      {currentStatus === "ACTIVE" && unpaid >= 5 && (
        <button
          onClick={triggerPayout}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/25 transition disabled:opacity-50"
        >
          {loading === "payout" ? "Paying…" : `Pay ₹${unpaid.toLocaleString("en-IN")}`}
        </button>
      )}
    </div>
  );
}
