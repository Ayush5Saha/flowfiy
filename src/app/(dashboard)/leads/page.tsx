import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ArrowRight, Upload, FileText } from "lucide-react";
import { LeadRequestComposer } from "@/components/leads/LeadRequestComposer";
import { LeadListRowActions } from "@/components/leads/LeadListRowActions";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const { organization } = membership;

  const [leadLists, businessProfile, totalLeadsCount, qualifiedCount] = await Promise.all([
    prisma.leadList.findMany({
      where: { organizationId: organization.id, status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.businessProfile.findUnique({ where: { organizationId: organization.id } }),
    prisma.lead.count({ where: { organizationId: organization.id } }),
    prisma.lead.count({ where: { organizationId: organization.id, status: { in: ["QUALIFIED", "CONTACTED", "REPLIED", "MEETING_BOOKED"] } } }),
  ]);

  const hasBusinessProfile = !!businessProfile;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Describe what you want — Flowfiy finds, qualifies &amp; writes outreach.
          </p>
        </div>
        <Link
          href="/leads/import"
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </Link>
      </div>

      {/* Composer (primary entry) or business-profile prompt */}
      {hasBusinessProfile ? (
        <div className="mb-8">
          <LeadRequestComposer />
        </div>
      ) : (
        <div className="mb-8 border border-dashed border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-semibold mb-1">Set up your business profile</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            Flowfiy uses it to know who to find and how to write your outreach.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium underline underline-offset-2">
            Set up business profile →
          </Link>
        </div>
      )}

      {/* Quick stats */}
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

      {/* Lead lists */}
      {leadLists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 border border-dashed border-border rounded-xl">
          Your lead lists will appear here once you run a search above.
        </p>
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
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{list.name}</p>
                  {list.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{list.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {list.totalLeads} leads · {list.qualifiedLeads} qualified · {new Date(list.createdAt).toLocaleDateString()}
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
