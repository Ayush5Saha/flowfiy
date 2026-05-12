import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/onboarding");

  const orgId = membership.organization.id;

  // All queries in parallel
  const [leadStatusGroups, scoredLeads, campaigns, leadLists] = await Promise.all([
    // Lead status distribution
    prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { status: true },
    }),

    // Scored leads — for avg score + score distribution + industry breakdown
    prisma.lead.findMany({
      where: { organizationId: orgId },
      select: { qualificationScore: true, industry: true, status: true },
    }),

    // Campaign performance
    prisma.campaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        campaignLeads: { select: { status: true } },
      },
    }),

    // Recent lead lists
    prisma.leadList.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        totalLeads: true,
        qualifiedLeads: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const statusMap = Object.fromEntries(
    leadStatusGroups.map((g) => [g.status, g._count.status])
  );

  const totalLeads = scoredLeads.length;
  const qualifiedLeads = (statusMap["QUALIFIED"] ?? 0) +
    (statusMap["CONTACTED"] ?? 0) +
    (statusMap["REPLIED"] ?? 0) +
    (statusMap["MEETING_BOOKED"] ?? 0);
  const contactedLeads = (statusMap["CONTACTED"] ?? 0) +
    (statusMap["REPLIED"] ?? 0) +
    (statusMap["MEETING_BOOKED"] ?? 0);
  const repliedLeads = (statusMap["REPLIED"] ?? 0) + (statusMap["MEETING_BOOKED"] ?? 0);
  const meetingsBooked = statusMap["MEETING_BOOKED"] ?? 0;

  const withScore = scoredLeads.filter((l) => l.qualificationScore !== null);
  const avgScore = withScore.length
    ? Math.round(withScore.reduce((s, l) => s + (l.qualificationScore ?? 0), 0) / withScore.length)
    : 0;

  // Score distribution buckets: 0-20, 21-40, 41-60, 61-80, 81-100
  const scoreBuckets = [0, 20, 40, 60, 80, 100];
  const scoreDistribution = scoreBuckets.slice(0, -1).map((min, i) => {
    const max = scoreBuckets[i + 1];
    const count = withScore.filter(
      (l) => (l.qualificationScore ?? 0) > min && (l.qualificationScore ?? 0) <= max
    ).length;
    return { label: `${min + 1}–${max}`, count };
  });
  // Fix first bucket to include 0
  scoreDistribution[0] = {
    label: "0–20",
    count: withScore.filter((l) => (l.qualificationScore ?? 0) <= 20).length,
  };

  // Industry breakdown (top 8)
  const industryCounts: Record<string, number> = {};
  for (const l of scoredLeads) {
    if (l.industry) industryCounts[l.industry] = (industryCounts[l.industry] ?? 0) + 1;
  }
  const topIndustries = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Campaign metrics
  const campaignStats = campaigns.map((c) => {
    const sent = c.campaignLeads.filter((cl) =>
      ["SENT", "OPENED", "REPLIED", "BOUNCED"].includes(cl.status)
    ).length;
    const replied = c.campaignLeads.filter((cl) => cl.status === "REPLIED").length;
    const bounced = c.campaignLeads.filter((cl) => cl.status === "BOUNCED").length;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      sent,
      replied,
      bounced,
      meetings: c.meetingCount,
      replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    };
  });

  const totalEmailsSent = campaignStats.reduce((s, c) => s + c.sent, 0);
  const totalReplied = campaignStats.reduce((s, c) => s + c.replied, 0);
  const overallReplyRate = totalEmailsSent > 0
    ? Math.round((totalReplied / totalEmailsSent) * 100)
    : 0;

  return (
    <AnalyticsClient
      kpis={{
        totalLeads,
        qualifiedLeads,
        contactedLeads,
        repliedLeads,
        meetingsBooked,
        avgScore,
        totalEmailsSent,
        overallReplyRate,
      }}
      statusDistribution={Object.entries(statusMap).map(([status, count]) => ({ status, count }))}
      scoreDistribution={scoreDistribution}
      topIndustries={topIndustries}
      campaignStats={campaignStats}
      leadLists={leadLists.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  );
}
