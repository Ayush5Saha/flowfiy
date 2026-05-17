"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Users, Mail, MessageSquare, Calendar,
  Star, BarChart3, Target, Activity, ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KPIs {
  totalLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  repliedLeads: number;
  meetingsBooked: number;
  avgScore: number;
  totalEmailsSent: number;
  overallReplyRate: number;
}

interface StatusItem { status: string; count: number }
interface ScoreBucket { label: string; count: number }
interface IndustryItem { name: string; count: number }
interface CampaignStat {
  id: string; name: string; status: string;
  sent: number; replied: number; bounced: number;
  meetings: number; replyRate: number;
}
interface LeadListItem {
  id: string; name: string; totalLeads: number;
  qualifiedLeads: number; status: string; createdAt: string;
}

interface Props {
  kpis: KPIs;
  statusDistribution: StatusItem[];
  scoreDistribution: ScoreBucket[];
  topIndustries: IndustryItem[];
  campaignStats: CampaignStat[];
  leadLists: LeadListItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "New", RESEARCHING: "Researching", QUALIFIED: "Qualified",
  DISQUALIFIED: "Disqualified", CONTACTED: "Contacted",
  REPLIED: "Replied", MEETING_BOOKED: "Meeting Booked",
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-zinc-600", RESEARCHING: "bg-blue-500", QUALIFIED: "bg-violet-500",
  DISQUALIFIED: "bg-red-500/70", CONTACTED: "bg-indigo-500",
  REPLIED: "bg-emerald-500", MEETING_BOOKED: "bg-yellow-400",
};

const CAMPAIGN_STATUS_BADGE: Record<string, string> = {
  DRAFT: "text-zinc-400 bg-zinc-800", ACTIVE: "text-emerald-400 bg-emerald-400/10",
  PAUSED: "text-yellow-400 bg-yellow-400/10", COMPLETED: "text-blue-400 bg-blue-400/10",
};

// ── Animated counter ──────────────────────────────────────────────────────────

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span>{fmt(display)}{suffix}</span>;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, suffix = "", icon: Icon, sub, accent = false,
}: {
  label: string; value: number; suffix?: string;
  icon: React.ElementType; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${
      accent
        ? "border-violet-500/30 bg-violet-500/5"
        : "border-border bg-card"
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          accent ? "bg-violet-500/20" : "bg-secondary"
        }`}>
          <Icon className={`w-4 h-4 ${accent ? "text-violet-400" : "text-muted-foreground"}`} />
        </div>
      </div>
      <p className="text-3xl font-bold font-mono tracking-tight">
        <Counter value={value} suffix={suffix} />
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Bar (reusable) ────────────────────────────────────────────────────────────

function Bar({ pct: p, color = "bg-violet-500" }: { pct: number; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(p), 100); return () => clearTimeout(t); }, [p]);
  return (
    <div className="h-2 rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────

function Funnel({ kpis }: { kpis: KPIs }) {
  const stages = [
    { label: "Generated", value: kpis.totalLeads, color: "bg-zinc-500" },
    { label: "Qualified", value: kpis.qualifiedLeads, color: "bg-violet-500" },
    { label: "Contacted", value: kpis.contactedLeads, color: "bg-indigo-500" },
    { label: "Replied", value: kpis.repliedLeads, color: "bg-emerald-500" },
    { label: "Meeting", value: kpis.meetingsBooked, color: "bg-yellow-400" },
  ];
  const max = Math.max(kpis.totalLeads, 1);

  return (
    <div className="space-y-3">
      {stages.map((s, i) => {
        const p = pct(s.value, max);
        const convRate = i === 0 ? null : pct(s.value, stages[i - 1].value || 1);
        return (
          <div key={s.label} className="flex items-center gap-4">
            <span className="w-20 text-xs text-muted-foreground text-right shrink-0">{s.label}</span>
            <div className="flex-1 relative">
              <Bar pct={p} color={s.color} />
            </div>
            <span className="w-12 text-xs font-mono text-right shrink-0">{fmt(s.value)}</span>
            {convRate !== null && (
              <span className="w-14 text-xs text-muted-foreground text-right shrink-0">
                {convRate}% conv
              </span>
            )}
            {convRate === null && <span className="w-14 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Score Distribution ─────────────────────────────────────────────────────────

function ScoreChart({ data }: { data: ScoreBucket[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const colors = ["bg-red-500/60", "bg-orange-500/60", "bg-yellow-500/60", "bg-blue-500/60", "bg-emerald-500/70"];

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((bucket, i) => {
        const heightPct = pct(bucket.count, max);
        return (
          <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-mono">{bucket.count}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
              <Pillar pct={heightPct} color={colors[i]} />
            </div>
            <span className="text-xs text-muted-foreground">{bucket.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Pillar({ pct: p, color }: { pct: number; color: string }) {
  const [height, setHeight] = useState(0);
  useEffect(() => { const t = setTimeout(() => setHeight(p), 150); return () => clearTimeout(t); }, [p]);
  return (
    <div className="w-full bg-secondary rounded-t-md overflow-hidden" style={{ height: "80px" }}>
      <div
        className={`w-full rounded-t-md transition-all duration-700 ease-out ${color}`}
        style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AnalyticsClient({
  kpis, statusDistribution, scoreDistribution, topIndustries, campaignStats, leadLists,
}: Props) {
  const maxIndustry = Math.max(...topIndustries.map((i) => i.count), 1);
  const totalStatusCount = statusDistribution.reduce((s, i) => s + i.count, 0);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Pipeline performance across all campaigns and lead lists</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
          <Activity className="w-3.5 h-3.5" />
          All time
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={kpis.totalLeads} icon={Users}
          sub={`${kpis.qualifiedLeads} qualified`} />
        <KpiCard label="Avg Score" value={kpis.avgScore} suffix="/100" icon={Star}
          sub="Qualification score" accent />
        <KpiCard label="Emails Sent" value={kpis.totalEmailsSent} icon={Mail}
          sub={`${kpis.totalEmailsSent} total sends`} />
        <KpiCard label="Reply Rate" value={kpis.overallReplyRate} suffix="%" icon={MessageSquare}
          sub={`${kpis.repliedLeads} replies`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Qualified" value={kpis.qualifiedLeads} icon={TrendingUp}
          sub={`${pct(kpis.qualifiedLeads, kpis.totalLeads)}% of total`} />
        <KpiCard label="Contacted" value={kpis.contactedLeads} icon={Target}
          sub={`${pct(kpis.contactedLeads, kpis.qualifiedLeads)}% of qualified`} />
        <KpiCard label="Replied" value={kpis.repliedLeads} icon={MessageSquare}
          sub={`${pct(kpis.repliedLeads, kpis.contactedLeads)}% of contacted`} />
        <KpiCard label="Meetings" value={kpis.meetingsBooked} icon={Calendar}
          sub={`${pct(kpis.meetingsBooked, kpis.repliedLeads)}% of replies`} accent />
      </div>

      {/* Funnel + Status Distribution */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-medium">Lead Pipeline Funnel</h2>
          </div>
          {kpis.totalLeads === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No leads yet. Generate your first lead list to see the funnel.</p>
          ) : (
            <Funnel kpis={kpis} />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-medium mb-5">Lead Status Breakdown</h2>
          {statusDistribution.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {statusDistribution
                .sort((a, b) => b.count - a.count)
                .map(({ status, count }) => (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[status] ?? "bg-zinc-500"}`} />
                        {STATUS_LABELS[status] ?? status}
                      </span>
                      <span className="font-mono">{count} <span className="text-muted-foreground">({pct(count, totalStatusCount)}%)</span></span>
                    </div>
                    <Bar pct={pct(count, totalStatusCount)} color={STATUS_COLOR[status] ?? "bg-zinc-500"} />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Score Distribution + Top Industries */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-medium mb-2">Qualification Score Distribution</h2>
          <p className="text-xs text-muted-foreground mb-6">How leads score across 0–100 range</p>
          {scoreDistribution.every((b) => b.count === 0) ? (
            <p className="text-muted-foreground text-sm text-center py-8">No scored leads yet.</p>
          ) : (
            <ScoreChart data={scoreDistribution} />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-medium mb-2">Top Industries</h2>
          <p className="text-xs text-muted-foreground mb-5">Lead distribution by industry</p>
          {topIndustries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No industry data yet.</p>
          ) : (
            <div className="space-y-3">
              {topIndustries.map(({ name, count }) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground truncate pr-2">{name}</span>
                    <span className="font-mono shrink-0">{count}</span>
                  </div>
                  <Bar pct={pct(count, maxIndustry)} color="bg-indigo-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">Campaign Performance</h2>
          <span className="text-xs text-muted-foreground">{campaignStats.length} campaigns</span>
        </div>
        {campaignStats.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">
            No campaigns yet. Create a campaign to start tracking performance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Sent</th>
                  <th className="text-right px-4 py-3 font-medium">Replied</th>
                  <th className="text-right px-4 py-3 font-medium">Reply Rate</th>
                  <th className="text-right px-4 py-3 font-medium">Bounced</th>
                  <th className="text-right px-6 py-3 font-medium">Meetings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaignStats.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/40 transition-colors group">
                    <td className="px-6 py-3.5 font-medium truncate max-w-48">
                      <Link href={`/campaigns/${c.id}`} className="hover:text-primary transition-colors flex items-center gap-1.5 group/link">
                        {c.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_BADGE[c.status] ?? ""}`}>
                        {c.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">{c.sent}</td>
                    <td className="px-4 py-3.5 text-right font-mono">{c.replied}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-mono ${c.replyRate >= 15 ? "text-emerald-400" : c.replyRate >= 5 ? "text-yellow-400" : "text-muted-foreground"}`}>
                        {c.replyRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-muted-foreground">{c.bounced}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`font-mono ${c.meetings > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>
                        {c.meetings}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Lead Lists */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">Lead Lists</h2>
          <span className="text-xs text-muted-foreground">{leadLists.length} recent</span>
        </div>
        {leadLists.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground text-sm">
            No lead lists yet. Generate your first batch to see data here.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leadLists.map((list) => {
              const qualRate = pct(list.qualifiedLeads, list.totalLeads);
              return (
                <div key={list.id} className="px-6 py-4 flex items-center gap-6 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/leads/${list.id}`} className="font-medium text-sm truncate hover:text-primary transition-colors flex items-center gap-1.5 group/link w-fit">
                      {list.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(list.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    <div className="text-center">
                      <p className="font-mono font-medium">{list.totalLeads}</p>
                      <p className="text-xs text-muted-foreground">total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono font-medium text-violet-400">{list.qualifiedLeads}</p>
                      <p className="text-xs text-muted-foreground">qualified</p>
                    </div>
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">qual rate</span>
                        <span className="font-mono">{qualRate}%</span>
                      </div>
                      <Bar pct={qualRate} color="bg-violet-500" />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      list.status === "READY" ? "text-emerald-400 bg-emerald-400/10" :
                      list.status === "RESEARCHING" ? "text-blue-400 bg-blue-400/10" :
                      list.status === "FAILED" ? "text-red-400 bg-red-400/10" :
                      "text-zinc-400 bg-zinc-800"
                    }`}>
                      {list.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
