import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight, Plug, FileText, Zap, Upload } from "lucide-react";
import { GenerateLeadsButton } from "@/components/leads/GenerateLeadsButton";
import { LeadListRowActions } from "@/components/leads/LeadListRowActions";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  // Cache hits — layout already fetched these this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const [leadLists, integrations, businessProfile, totalLeadsCount, qualifiedCount] = await Promise.all([
    prisma.leadList.findMany({
      where: { organizationId: organization.id, status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.integration.findMany({
      where: { organizationId: organization.id, status: "CONNECTED" },
      select: { type: true },
    }),
    prisma.businessProfile.findUnique({ where: { organizationId: organization.id } }),
    prisma.lead.count({ where: { organizationId: organization.id } }),
    prisma.lead.count({ where: { organizationId: organization.id, status: { in: ["QUALIFIED", "CONTACTED", "REPLIED", "MEETING_BOOKED"] } } }),
  ]);

  const connectedTypes = new Set(integrations.map((i) => i.type));
  const hasClaudeKey = connectedTypes.has("CLAUDE");
  const hasApolloKey = connectedTypes.has("APOLLO");
  const hasBusinessProfile = !!businessProfile;

  const blockers = [
    !hasBusinessProfile && {
      label: "Set up your business profile & ICP",
      href: "/settings",
      icon: FileText,
    },
    !hasClaudeKey && {
      label: "Connect your Flowfiy API key",
      href: "/integrations",
      icon: Zap,
    },
    !hasApolloKey && {
      label: "Connect your Apollo API key",
      href: "/integrations",
      icon: Plug,
    },
  ].filter(Boolean) as { label: string; href: string; icon: React.ElementType }[];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-researched and qualified lead lists
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leads/import"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Link>
          <GenerateLeadsButton organizationId={organization.id} />
        </div>
      </div>

      {/* Quick stats — only show if we have data */}
      {leadLists.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Lead Lists", value: leadLists.length, color: "text-foreground" },
            { label: "Total Leads", value: totalLeadsCount, color: "text-blue-400" },
            { label: "Qualified", value: qualifiedCount, color: "text-green-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className={`text-lg font-mono font-semibold ${color}`}>{value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {leadLists.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Users className="w-7 h-7 text-primary" />
          </div>

          <h2 className="font-semibold text-lg mb-2">Generate your first lead list</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Flowfiy researches your ICP, finds matching companies via Apollo, analyzes each
            one, scores them 0–100, and writes personalized outreach — all automatically.
          </p>

          {blockers.length > 0 ? (
            <div className="max-w-sm mx-auto mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Complete these steps first
              </p>
              <div className="space-y-2 text-left">
                {blockers.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href + label}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                      {label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <GenerateLeadsButton organizationId={organization.id} variant="primary" />
          )}

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
            {[
              { stat: "~25s", label: "per lead researched" },
              { stat: "0–100", label: "qualification score" },
              { stat: "3-touch", label: "email sequence" },
            ].map(({ stat, label }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-3">
                <p className="text-lg font-mono font-bold">{stat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {leadLists.map((list) => (
            <Link
              key={list.id}
              href={`/leads/${list.id}`}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {list.name}
                  </p>
                  {list.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                      {list.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {list.totalLeads} leads · {list.qualifiedLeads} qualified ·{" "}
                    {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={list.status} />
                <LeadListRowActions listId={list.id} organizationId={organization.id} />
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Draft", class: "bg-secondary text-muted-foreground" },
    QUEUED: { label: "Queued", class: "bg-yellow-500/10 text-yellow-400" },
    RESEARCHING: { label: "Researching...", class: "bg-blue-500/10 text-blue-400" },
    READY: { label: "Ready", class: "bg-green-500/10 text-green-400" },
    FAILED: { label: "Failed", class: "bg-destructive/10 text-destructive" },
    ARCHIVED: { label: "Archived", class: "bg-secondary text-muted-foreground" },
  };
  const { label, class: cls } = config[status] ?? { label: status, class: "bg-secondary" };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>{label}</span>;
}
