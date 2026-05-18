import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const statusColors: Record<string, string> = {
  DRAFT: "bg-zinc-700 text-zinc-300",
  ACTIVE: "bg-emerald-500/20 text-emerald-300",
  PAUSED: "bg-amber-500/20 text-amber-300",
  COMPLETED: "bg-blue-500/20 text-blue-300",
};

export default async function AdminCampaignsPage() {
  await requireAdmin();

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { id: true, name: true, plan: true } },
      _count: { select: { campaignLeads: true } },
    },
  });

  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalReplies = campaigns.reduce((s, c) => s + c.replyCount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {campaigns.length} total · {totalSent.toLocaleString()} sent · {totalReplies.toLocaleString()} replies
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Leads</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Sent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Replies</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Reply Rate</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {campaigns.map((c) => {
                const replyRate = c.sentCount > 0
                  ? ((c.replyCount / c.sentCount) * 100).toFixed(1)
                  : "0.0";
                return (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{c.name}</p>
                        {c.gmailFromAddress && (
                          <p className="text-xs text-zinc-500">{c.gmailFromAddress}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{c.organization.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{c._count.campaignLeads}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.sentCount}</td>
                    <td className="px-4 py-3 text-zinc-300">{c.replyCount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        parseFloat(replyRate) > 5 ? "text-emerald-400" :
                        parseFloat(replyRate) > 0 ? "text-amber-400" : "text-zinc-500"
                      }`}>
                        {replyRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {campaigns.length === 0 && (
            <p className="text-center py-12 text-zinc-500">No campaigns yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
