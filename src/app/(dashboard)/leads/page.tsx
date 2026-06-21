import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Upload, FileText } from "lucide-react";
import { LeadRequestComposer } from "@/components/leads/LeadRequestComposer";
import { LeadListRowActions } from "@/components/leads/LeadListRowActions";
import { pausedListIds } from "@/lib/pipeline-pause";
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

  // One batched lookup for the pause flags of any in-progress lists.
  const pausedSet = await pausedListIds(
    leadLists.filter((l) => ["QUEUED", "RESEARCHING"].includes(l.status)).map((l) => l.id)
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Describe what you want — Flowfiy finds, qualifies &amp; writes outreach.
          </p>
        </div>
        <Link
          href="/leads/import"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </Link>
      </div>

      {/* Composer (primary entry) or business-profile prompt */}
      {hasBusinessProfile ? (
        <div className="mb-10">
          <LeadRequestComposer />
        </div>
      ) : (
        <div className="mb-10 rounded-lg bg-secondary/40 px-5 py-5 flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.75} />
          <div>
            <h2 className="text-sm font-medium">Set up your business profile first</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Flowfiy uses it to know who to find and how to write your outreach.</p>
            <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
              Set up business profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick stats — ruled strip */}
      {leadLists.length > 0 && (
        <section className="border-y border-border py-6 mb-10">
          <div className="grid grid-cols-3">
            {[
              { label: "Lead lists", value: leadLists.length },
              { label: "Total leads", value: totalLeadsCount },
              { label: "Qualified", value: qualifiedCount },
            ].map(({ label, value }, i) => (
              <div key={label} className={i === 0 ? "" : "border-l border-border pl-6"}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lead lists */}
      <section>
        <h2 className="text-sm font-semibold mb-1">Your lists</h2>
        {leadLists.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            Your lead lists will appear here once you run a search above.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {leadLists.map((list) => (
              <div key={list.id} className="flex items-center justify-between gap-4 py-4 group">
                <Link href={`/leads/${list.id}`} className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{list.name}</p>
                  {list.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{list.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                    {list.totalLeads} leads · {list.qualifiedLeads} qualified · {new Date(list.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={list.status} paused={pausedSet.has(list.id)} />
                  <LeadListRowActions listId={list.id} organizationId={organization.id} />
                  <Link href={`/leads/${list.id}`} aria-label="Open list">
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status, paused = false }: { status: string; paused?: boolean }) {
  const config: Record<string, { label: string; dot: string }> = {
    DRAFT: { label: "Draft", dot: "bg-muted-foreground/50" },
    QUEUED: { label: "Queued", dot: "bg-muted-foreground/50" },
    RESEARCHING: { label: "Researching", dot: "bg-primary" },
    READY: { label: "Ready", dot: "bg-emerald-400" },
    FAILED: { label: "Failed", dot: "bg-destructive" },
    ARCHIVED: { label: "Archived", dot: "bg-muted-foreground/50" },
  };
  const { label, dot } = paused
    ? { label: "Paused", dot: "bg-amber-400" }
    : config[status] ?? { label: status, dot: "bg-muted-foreground/50" };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
