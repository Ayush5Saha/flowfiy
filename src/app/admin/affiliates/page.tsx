import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminAffiliateActions from "@/components/admin/AdminAffiliateActions";

function formatPaise(paise: bigint): string {
  return `₹${(Number(paise) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300",
  ACTIVE: "bg-emerald-500/20 text-emerald-300",
  SUSPENDED: "bg-red-500/20 text-red-300",
};

export default async function AdminAffiliatesPage() {
  await requireAdmin();

  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      conversions: {
        where: { status: "APPROVED" },
        select: { commissionAmountInPaise: true },
      },
      _count: {
        select: { conversions: true },
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
            <p className="text-zinc-400 text-sm mt-1">{affiliates.length} applications</p>
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
                  <th className="text-left px-5 py-3 font-medium">Code</th>
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
                  const unpaidApproved = a.conversions.reduce(
                    (sum, c) => sum + c.commissionAmountInPaise,
                    0n
                  );
                  return (
                    <tr key={a.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white">{a.name}</p>
                        <p className="text-xs text-zinc-500">{a.email}</p>
                        {a.website && (
                          <a href={a.website} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline truncate max-w-[160px] block">
                            {a.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                        {a.audienceDescription && (
                          <p className="text-xs text-zinc-600 max-w-[200px] truncate mt-1" title={a.audienceDescription}>
                            {a.audienceDescription}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="text-violet-400 font-mono text-xs bg-violet-500/10 px-2 py-1 rounded">
                          {a.affiliateCode}
                        </code>
                        <p className="text-xs text-zinc-600 mt-1">{Math.round(a.commissionRate * 100)}% commission</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[a.status]}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-300">{a.totalClicks}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-300">{a.totalSignups}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-emerald-400">{formatPaise(a.totalEarningsInPaise)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-zinc-400">{formatPaise(a.totalPaidInPaise)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-amber-400">{formatPaise(unpaidApproved)}</td>
                      <td className="px-5 py-3.5">
                        <AdminAffiliateActions
                          affiliateId={a.id}
                          currentStatus={a.status}
                          hasFundAccount={!!a.razorpayFundAccountId}
                          unpaidApprovedInPaise={unpaidApproved.toString()}
                        />
                      </td>
                    </tr>
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
