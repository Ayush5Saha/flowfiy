import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAffiliateRow from "@/components/admin/AdminAffiliateRow";

export default async function AdminAffiliatesPage() {
  await requireAdmin();

  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      conversions: {
        where: { status: "APPROVED" },
        select: { commissionAmountInPaise: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#09090f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm transition">← Admin</Link>
            </div>
            <h1 className="text-2xl font-bold">Affiliate Program</h1>
            <p className="text-zinc-400 text-sm mt-1">{affiliates.length} application{affiliates.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {affiliates.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-500">No affiliate applications yet.</p>
            <p className="text-xs text-zinc-600 mt-2">Applications will appear here when creators submit from /affiliates</p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left px-5 py-3 font-medium">Affiliate</th>
                  <th className="text-left px-5 py-3 font-medium">Code / Commission</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Clicks</th>
                  <th className="text-right px-5 py-3 font-medium">Signups</th>
                  <th className="text-right px-5 py-3 font-medium">Earned</th>
                  <th className="text-right px-5 py-3 font-medium">Paid</th>
                  <th className="text-right px-5 py-3 font-medium">Unpaid (APPR)</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {affiliates.map((a) => {
                  const unpaidApprovedInPaise = a.conversions.reduce(
                    (sum, c) => sum + c.commissionAmountInPaise,
                    0n
                  );
                  return (
                    <AdminAffiliateRow
                      key={a.id}
                      affiliate={{
                        id: a.id,
                        name: a.name,
                        email: a.email,
                        affiliateCode: a.affiliateCode,
                        commissionRate: a.commissionRate,
                        status: a.status,
                        totalClicks: a.totalClicks,
                        totalSignups: a.totalSignups,
                        totalEarningsInPaise: a.totalEarningsInPaise.toString(),
                        totalPaidInPaise: a.totalPaidInPaise.toString(),
                        unpaidApprovedInPaise: unpaidApprovedInPaise.toString(),
                        website: a.website,
                        socialHandle: a.socialHandle,
                        audienceDescription: a.audienceDescription,
                        razorpayFundAccountId: a.razorpayFundAccountId,
                        createdAt: a.createdAt.toISOString(),
                      }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
