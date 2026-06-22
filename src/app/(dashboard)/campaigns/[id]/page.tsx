import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { CampaignActions } from "@/components/campaigns/CampaignActions";
import { CampaignTimingEditor } from "@/components/campaigns/CampaignTimingEditor";
import { CampaignLeadsTable } from "@/components/campaigns/CampaignLeadsTable";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      campaignLeads: {
        // NOTE: Prisma forbids `include` and `select` together at the same
        // level — use `select` only (it already pulls the lead + outreachCopy).
        select: {
          id: true,
          status: true,
          followUpStep: true,
          sentAt: true,
          gmailThreadId: true,
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              companyName: true,
              status: true,
            },
          },
          outreachCopy: {
            select: { subjectLine: true, body: true, followUp1: true, followUp2: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign || campaign.organizationId !== membership.organization.id) notFound();

  const stats = {
    total: campaign.campaignLeads.length,
    pending: campaign.campaignLeads.filter((cl) => cl.status === "PENDING").length,
    // "Sent" includes leads that went on to reply (they were still sent)
    sent: campaign.campaignLeads.filter((cl) => ["SENT", "REPLIED", "BOUNCED"].includes(cl.status)).length,
    replied: campaign.campaignLeads.filter((cl) => cl.status === "REPLIED").length,
    bounced: campaign.campaignLeads.filter((cl) => cl.status === "BOUNCED").length,
    meetings: campaign.meetingCount,
  };

  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;

  const statusDot: Record<string, string> = {
    ACTIVE: "bg-emerald-400",
    PAUSED: "bg-amber-400",
    DRAFT: "bg-muted-foreground/50",
    COMPLETED: "bg-muted-foreground/50",
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Campaigns
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot[campaign.status] ?? "bg-muted-foreground/50"}`} />
                {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.total} leads · Created {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action buttons — client component */}
          <CampaignActions
            campaignId={campaign.id}
            status={campaign.status}
            pendingCount={stats.pending}
            organizationId={campaign.organizationId}
          />
        </div>
      </div>

      {/* Stats */}
      <section className="border-y border-border py-8 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-y-8">
          {[
            { label: "Total Leads", value: stats.total },
            { label: "Emails Sent", value: stats.sent },
            { label: "Replies", value: stats.replied },
            { label: "Reply Rate", value: `${replyRate}%` },
            { label: "Meetings", value: stats.meetings },
            { label: "Bounced", value: stats.bounced },
          ].map(({ label, value }, i) => (
            <div key={label} className={i === 0 ? "lg:pr-8" : "lg:px-8 lg:border-l lg:border-border"}>
              <p className="text-[13px] text-muted-foreground">{label}</p>
              <p className="mt-2.5 text-[34px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timing settings */}
      <section className="border-t border-border pt-8 mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold">Follow-up Sequence</h2>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {campaign.dailySendLimit} emails / day limit
          </span>
        </div>
        <CampaignTimingEditor
          campaignId={campaign.id}
          followUp1DelayDays={campaign.followUp1DelayDays}
          followUp2DelayDays={campaign.followUp2DelayDays}
          canEdit={campaign.status !== "COMPLETED"}
        />
        <p className="text-xs text-muted-foreground mt-3">
          Follow-ups stop automatically when a lead replies. Timing changes apply to upcoming follow-ups only.
        </p>
      </section>

      {/* Leads table — client component with preview modal */}
      <CampaignLeadsTable
        campaignLeads={campaign.campaignLeads}
        campaignId={campaign.id}
        followUp1DelayDays={campaign.followUp1DelayDays}
        followUp2DelayDays={campaign.followUp2DelayDays}
        stats={stats}
      />
    </div>
  );
}
