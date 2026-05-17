import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Users, Send, MessageSquare, Clock, ExternalLink } from "lucide-react";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { CampaignActions } from "@/components/campaigns/CampaignActions";
import { CampaignTimingEditor } from "@/components/campaigns/CampaignTimingEditor";

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
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              companyName: true,
            },
          },
          outreachCopy: {
            select: { subjectLine: true, body: true, followUp1: true, followUp2: true },
          },
        },
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
    sent: campaign.campaignLeads.filter((cl) => cl.status === "SENT").length,
    replied: campaign.campaignLeads.filter((cl) => cl.status === "REPLIED").length,
    bounced: campaign.campaignLeads.filter((cl) => cl.status === "BOUNCED").length,
  };

  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-400",
    PAUSED: "bg-yellow-500/10 text-yellow-400",
    DRAFT: "bg-secondary text-muted-foreground",
    COMPLETED: "bg-secondary text-muted-foreground",
  };

  const leadStatusColor: Record<string, string> = {
    PENDING: "bg-secondary text-muted-foreground",
    SENT: "bg-blue-500/10 text-blue-400",
    REPLIED: "bg-green-500/10 text-green-400",
    BOUNCED: "bg-destructive/10 text-destructive",
    OPENED: "bg-purple-500/10 text-purple-400",
    UNSUBSCRIBED: "bg-secondary text-muted-foreground",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Campaigns
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{campaign.name}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[campaign.status] ?? "bg-secondary text-muted-foreground"}`}>
                  {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">
                {stats.total} leads · Created {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Leads", value: stats.total, icon: Users, color: "text-muted-foreground" },
          { label: "Emails Sent", value: stats.sent, icon: Send, color: "text-blue-400" },
          { label: "Replies", value: stats.replied, icon: MessageSquare, color: "text-green-400" },
          { label: "Reply Rate", value: `${replyRate}%`, icon: null, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
            </div>
            <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Timing settings */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Follow-up Sequence</h2>
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
      </div>

      {/* Leads table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium">Leads ({stats.total})</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.pending} pending</span>
            <span>·</span>
            <span>{stats.sent} sent</span>
            <span>·</span>
            <span className="text-green-400">{stats.replied} replied</span>
          </div>
        </div>

        {campaign.campaignLeads.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No leads in this campaign yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {campaign.campaignLeads.map((cl) => (
              <div key={cl.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(cl.lead.firstName?.[0] ?? cl.lead.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {cl.lead.firstName} {cl.lead.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cl.lead.title && `${cl.lead.title} · `}{cl.lead.companyName ?? cl.lead.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {cl.outreachCopy?.subjectLine && (
                    <p className="text-xs text-muted-foreground hidden sm:block max-w-[200px] truncate">
                      {cl.outreachCopy.subjectLine}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {cl.followUpStep > 0 && (
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                        Step {cl.followUpStep}
                      </span>
                    )}
                    {cl.sentAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(cl.sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {cl.gmailThreadId && (cl.status === "REPLIED" || cl.status === "SENT") && (
                    <a
                      href={`https://mail.google.com/mail/u/0/#inbox/${cl.gmailThreadId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Open in Gmail"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${leadStatusColor[cl.status] ?? "bg-secondary text-muted-foreground"}`}>
                    {cl.status.charAt(0) + cl.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
