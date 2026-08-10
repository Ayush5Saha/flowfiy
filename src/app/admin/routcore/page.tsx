import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import RoutcoreEnquiriesTable from "@/components/admin/RoutcoreEnquiriesTable";

export const metadata = { title: "Routcore Enquiries — Admin" };

// Enquiries arrive continuously; never serve a cached list.
export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;

export default async function AdminRoutcorePage() {
  await requireAdmin();

  const [enquiries, counts, total] = await Promise.all([
    prisma.routcoreEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.routcoreEnquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.routcoreEnquiry.count(),
  ]);

  const byStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all])
  ) as Record<string, number>;

  // Surfaced because a saved-but-unsent enquiry means nobody got the email —
  // it would otherwise sit here unnoticed while looking perfectly normal.
  const unsent = enquiries.filter((e) => !e.emailSent).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Routcore Enquiries</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Submissions from the{" "}
          <a href="/routcore#contact" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
            /routcore
          </a>{" "}
          contact form · {total} total{enquiries.length < total ? `, showing latest ${enquiries.length}` : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        {STATUSES.map((s) => (
          <div key={s} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">{s[0] + s.slice(1).toLowerCase()}</p>
            <p className="text-2xl font-bold text-white">{byStatus[s] ?? 0}</p>
          </div>
        ))}
      </div>

      {unsent > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span className="font-semibold">{unsent}</span>{" "}
          {unsent === 1 ? "enquiry was" : "enquiries were"} saved but the notification
          email did not send. They are safe here, but nobody was alerted by email —
          check the Resend dashboard and follow up manually.
        </div>
      )}

      <RoutcoreEnquiriesTable
        enquiries={enquiries.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          companyName: e.companyName,
          packageTier: e.packageTier,
          message: e.message,
          status: e.status,
          notes: e.notes,
          emailSent: e.emailSent,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
