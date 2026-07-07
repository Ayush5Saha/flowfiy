import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import SalesTeamManager, { type SalesRep } from "@/components/admin/SalesTeamManager";

export const dynamic = "force-dynamic";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Returns the UTC instant corresponding to 00:00 IST on the Monday `weeksAgo`
 * weeks before (or including, when weeksAgo = 0) the current IST week.
 * Computed explicitly against IST (UTC+5:30) rather than the server's local
 * timezone, since the server may run in any TZ.
 */
function istMondayBoundary(weeksAgo: number): Date {
  const now = new Date();
  const istShifted = new Date(now.getTime() + IST_OFFSET_MS);
  const dayOfWeek = istShifted.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon=0..Sun=6
  const istMidnightMondayUTCms = Date.UTC(
    istShifted.getUTCFullYear(),
    istShifted.getUTCMonth(),
    istShifted.getUTCDate() - daysSinceMonday - weeksAgo * 7,
    0, 0, 0, 0
  );
  return new Date(istMidnightMondayUTCms - IST_OFFSET_MS);
}

function istDateParts(d: Date): { day: number; month: string } {
  const shifted = new Date(d.getTime() + IST_OFFSET_MS);
  return { day: shifted.getUTCDate(), month: MONTH_ABBR[shifted.getUTCMonth()] };
}

function weekLabel(weekStart: Date, weekEndExclusive: Date): string {
  const sunday = new Date(weekEndExclusive.getTime() - DAY_MS);
  const start = istDateParts(weekStart);
  const end = istDateParts(sunday);
  if (start.month === end.month) return `${start.day}–${end.day} ${end.month}`;
  return `${start.day} ${start.month}–${end.day} ${end.month}`;
}

export default async function AdminSalesTeamPage() {
  await requireAdmin();

  const reps = await prisma.affiliate.findMany({
    where: { type: "SALES_REP" },
    orderBy: { createdAt: "desc" },
    include: {
      conversions: {
        include: {
          organization: { select: { id: true, name: true, plan: true, subscriptionStatus: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const currentWeekStart = istMondayBoundary(0);

  // 9 boundaries → 8 buckets, oldest → newest. weeksAgo runs 7,6,...,0,-1 so the
  // last bucket spans [current Monday, next Monday) — the in-progress current week.
  const weekBoundaries = Array.from({ length: 9 }, (_, i) => istMondayBoundary(7 - i));

  const salesReps: SalesRep[] = reps.map((r) => {
    type ConversionRow = (typeof r.conversions)[number];

    const active = r.conversions.filter((c: ConversionRow) => c.status !== "CANCELLED");

    // ── Customers, grouped by organization ──────────────────────────────
    const byOrg = new Map<
      string,
      {
        orgId: string;
        orgName: string;
        plan: string;
        subscriptionStatus: string | null;
        firstPaymentAt: Date;
        paymentsCount: number;
        revenueInPaise: bigint;
        commissionInPaise: bigint;
      }
    >();

    for (const c of active) {
      const existing = byOrg.get(c.organizationId);
      if (existing) {
        existing.paymentsCount += 1;
        existing.revenueInPaise += c.paymentAmountInPaise;
        existing.commissionInPaise += c.commissionAmountInPaise;
        if (c.createdAt < existing.firstPaymentAt) existing.firstPaymentAt = c.createdAt;
      } else {
        byOrg.set(c.organizationId, {
          orgId: c.organizationId,
          orgName: c.organization.name,
          plan: c.organization.plan,
          subscriptionStatus: c.organization.subscriptionStatus,
          firstPaymentAt: c.createdAt,
          paymentsCount: 1,
          revenueInPaise: c.paymentAmountInPaise,
          commissionInPaise: c.commissionAmountInPaise,
        });
      }
    }

    const customers = Array.from(byOrg.values())
      .sort((a, b) => b.firstPaymentAt.getTime() - a.firstPaymentAt.getTime())
      .map((c) => ({
        orgId: c.orgId,
        orgName: c.orgName,
        plan: c.plan,
        subscriptionStatus: c.subscriptionStatus,
        firstPaymentAt: c.firstPaymentAt.toISOString(),
        paymentsCount: c.paymentsCount,
        revenueInPaise: c.revenueInPaise.toString(),
        commissionInPaise: c.commissionInPaise.toString(),
      }));

    // ── Unpaid (PENDING or APPROVED) ─────────────────────────────────────
    const unpaidInPaise = r.conversions
      .filter((c: ConversionRow) => c.status === "PENDING" || c.status === "APPROVED")
      .reduce((sum: bigint, c: ConversionRow) => sum + c.commissionAmountInPaise, 0n);

    // ── This week ─────────────────────────────────────────────────────────
    const thisWeekInPaise = active
      .filter((c: ConversionRow) => c.createdAt >= currentWeekStart)
      .reduce((sum: bigint, c: ConversionRow) => sum + c.commissionAmountInPaise, 0n);

    // ── Weekly buckets (last 8 weeks) ───────────────────────────────────
    const weekly = Array.from({ length: 8 }, (_, i) => {
      const start = weekBoundaries[i];
      const end = weekBoundaries[i + 1];
      const commissionInPaise = active
        .filter((c: ConversionRow) => c.createdAt >= start && c.createdAt < end)
        .reduce((sum: bigint, c: ConversionRow) => sum + c.commissionAmountInPaise, 0n);
      return {
        weekStartISO: start.toISOString(),
        label: weekLabel(start, end),
        commissionInPaise: commissionInPaise.toString(),
      };
    });

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      affiliateCode: r.affiliateCode,
      commissionRate: r.commissionRate,
      status: r.status,
      totalEarningsInPaise: r.totalEarningsInPaise.toString(),
      totalPaidInPaise: r.totalPaidInPaise.toString(),
      unpaidInPaise: unpaidInPaise.toString(),
      thisWeekInPaise: thisWeekInPaise.toString(),
      createdAt: r.createdAt.toISOString(),
      hasPayoutAccount: r.razorpayFundAccountId != null,
      upiId: r.upiId,
      customers,
      weekly,
    };
  });

  return <SalesTeamManager reps={salesReps} />;
}
