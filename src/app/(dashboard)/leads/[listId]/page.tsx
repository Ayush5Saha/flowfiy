import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Mail, TrendingUp } from "lucide-react";
import { LeadTableClient } from "@/components/leads/LeadTableClient";
import { LeadListActions } from "@/components/leads/LeadListActions";
import { RetryListButton } from "@/components/leads/RetryListButton";
import { getCurrentUser, getOrgMembership } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ listId: string }>;
}

export default async function LeadListPage({ params }: PageProps) {
  const { listId } = await params;
  // Cache hits — layout already fetched these this request
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const membership = await getOrgMembership(user.id);
  if (!membership) redirect("/onboarding");

  const leadList = await prisma.leadList.findFirst({
    where: { id: listId, organizationId: membership.organization.id },
    include: {
      leads: {
        include: {
          research: true,
          outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: [{ qualificationScore: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!leadList) notFound();

  const isProcessing = ["QUEUED", "RESEARCHING"].includes(leadList.status);

  // Score distribution buckets: 0-39, 40-59, 60-79, 80-100
  const scoredLeads = leadList.leads.filter((l) => l.qualificationScore !== null);
  const buckets = [
    { label: "0–39", min: 0, max: 39, color: "bg-destructive/40" },
    { label: "40–59", min: 40, max: 59, color: "bg-yellow-500/50" },
    { label: "60–79", min: 60, max: 79, color: "bg-blue-400/50" },
    { label: "80–100", min: 80, max: 100, color: "bg-green-400/60" },
  ].map((b) => ({
    ...b,
    count: scoredLeads.filter((l) => (l.qualificationScore ?? 0) >= b.min && (l.qualificationScore ?? 0) <= b.max).length,
  }));
  const maxBucketCount = Math.max(...buckets.map((b) => b.count), 1);
  const avgScore = scoredLeads.length > 0
    ? Math.round(scoredLeads.reduce((sum, l) => sum + (l.qualificationScore ?? 0), 0) / scoredLeads.length)
    : null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{leadList.name}</h1>
            {leadList.description && (
              <p className="text-muted-foreground text-sm">{leadList.description}</p>
            )}
          </div>
        </div>
        <LeadListActions
          listId={listId}
          listName={leadList.name}
          isReady={leadList.status === "READY"}
          hasQualifiedLeads={leadList.qualifiedLeads > 0}
          organizationId={membership.organization.id}
          leads={leadList.leads.map((l) => ({
            firstName: l.firstName,
            lastName: l.lastName,
            email: l.email,
            title: l.title,
            companyName: l.companyName,
            companyWebsite: l.companyWebsite,
            status: l.status,
            qualificationScore: l.qualificationScore,
          }))}
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: leadList.totalLeads, icon: Users, color: "text-foreground" },
          { label: "Qualified", value: leadList.qualifiedLeads, icon: CheckCircle, color: "text-green-400" },
          { label: "Disqualified", value: leadList.totalLeads - leadList.qualifiedLeads, icon: XCircle, color: "text-muted-foreground" },
          { label: "Contacted", value: leadList.leads.filter((l) => l.status === "CONTACTED").length, icon: Mail, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            <Icon className={`w-4 h-4 ${color} shrink-0`} />
            <div>
              <p className="font-mono text-sm font-medium">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-blue-400">
                {leadList.status === "QUEUED" ? "Queued for research..." : "AI research in progress..."}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {leadList.jobStatus?.replace(/_/g, " ")} — This takes 2–5 minutes. This page auto-refreshes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failed state */}
      {leadList.status === "FAILED" && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-destructive font-medium">Research failed</p>
            <p className="text-xs text-muted-foreground mt-0.5">{leadList.jobError ?? "An error occurred during lead research."}</p>
          </div>
          <RetryListButton listId={listId} organizationId={membership.organization.id} />
        </div>
      )}

      {/* Score distribution — only show for non-empty READY lists */}
      {leadList.status === "READY" && scoredLeads.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Score Distribution</h2>
            </div>
            {avgScore !== null && (
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Avg score </span>
                <span className={`text-sm font-mono font-bold ${avgScore >= 70 ? "text-green-400" : avgScore >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {avgScore}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-3 h-16">
            {buckets.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs text-muted-foreground font-mono">{b.count}</span>
                <div className="w-full rounded-t-sm" style={{ height: `${Math.round((b.count / maxBucketCount) * 44)}px` }}>
                  <div className={`w-full h-full rounded-t-sm ${b.color}`} />
                </div>
                <span className="text-[10px] text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead table */}
      <LeadTableClient
        leads={leadList.leads as Parameters<typeof LeadTableClient>[0]["leads"]}
        isProcessing={isProcessing}
        organizationId={membership.organization.id}
        listId={listId}
      />
    </div>
  );
}
