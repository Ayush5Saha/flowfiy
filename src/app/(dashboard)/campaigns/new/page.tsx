"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Mail, Clock, ChevronRight, Loader2 } from "lucide-react";

interface LeadList {
  id: string;
  name: string;
  qualifiedLeads: number;
  /** Qualified leads that actually have an email address (campaign-sendable). */
  emailableLeads: number;
  totalLeads: number;
  status: string;
}

interface OrgData {
  id: string;
  gmailConnected: boolean;
  leadLists: LeadList[];
}

function NewCampaignInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedListId = searchParams.get("listId") ?? "";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orgData, setOrgData] = useState<OrgData | null>(null);

  const [form, setForm] = useState({
    name: "",
    leadListId: preselectedListId,
    followUp1DelayDays: 3,
    followUp2DelayDays: 7,
    dailySendLimit: 50,
  });

  useEffect(() => {
    async function load() {
      try {
        const [orgRes, intRes] = await Promise.all([
          fetch("/api/organizations"),
          fetch("/api/integrations"),
        ]);
        const orgJson = await orgRes.json();
        const intJson = await intRes.json();

        const org = orgJson.organizations?.[0];
        if (!org) { router.push("/onboarding"); return; }

        const gmailConnected = intJson.integrations?.some(
          (i: { type: string; status: string }) => i.type === "GMAIL" && i.status === "CONNECTED"
        ) ?? false;

        // Fetch lead lists with qualified counts
        const listsRes = await fetch(`/api/leads?organizationId=${org.id}`);
        const listsJson = await listsRes.json();

        setOrgData({
          id: org.id,
          gmailConnected,
          leadLists: (listsJson.leadLists ?? []).filter(
            (l: LeadList) => l.status === "READY" && l.qualifiedLeads > 0
          ),
        });
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgData) return;
    if (!form.name.trim()) { setError("Campaign name is required"); return; }
    if (!form.leadListId) { setError("Select a lead list"); return; }

    // Email-address pre-check: don't let the user create a campaign on a list
    // where no lead has an email — nothing could ever be sent.
    const chosen = orgData.leadLists.find((l) => l.id === form.leadListId);
    if (chosen && chosen.emailableLeads === 0) {
      setError(
        "This lead list has no leads with an email address, so a campaign can't email anyone. " +
        "Pick a list that has emails, or reach these leads via WhatsApp/phone instead."
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgData.id,
          name: form.name.trim(),
          leadListId: form.leadListId,
          followUp1DelayDays: form.followUp1DelayDays,
          followUp2DelayDays: form.followUp2DelayDays,
          dailySendLimit: form.dailySendLimit,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(
          json.message ??
          json.error?.formErrors?.[0] ??
          (typeof json.error === "string" ? json.error : "Failed to create campaign")
        );
        return;
      }

      // Auto-add leads from the selected list
      const campaignId = json.campaign.id;
      await fetch(`/api/campaigns/${campaignId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // auto-adds all qualified leads from leadList
      });

      router.push(`/campaigns/${campaignId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedList = orgData?.leadLists.find((l) => l.id === form.leadListId);

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Campaigns
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Campaign</h1>
            <p className="text-muted-foreground text-sm mt-1">Set up your outreach sequence</p>
          </div>
        </div>
      </div>

      {/* Gmail warning */}
      {orgData && !orgData.gmailConnected && (
        <div className="mb-6 rounded-lg bg-secondary/40 px-4 py-3 flex items-start gap-3">
          <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">Gmail not connected</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You can create this campaign now, but you&apos;ll need to{" "}
              <Link href="/integrations" className="text-primary hover:underline">connect Gmail</Link>{" "}
              before launching it.
            </p>
          </div>
        </div>
      )}

      {/* No qualified leads warning */}
      {orgData && orgData.leadLists.length === 0 && (
        <div className="mb-6 rounded-lg bg-secondary/40 px-4 py-3 flex items-start gap-3">
          <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">No qualified leads yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You need at least one lead list with qualified leads before creating a campaign.{" "}
              <Link href="/leads" className="text-primary hover:underline">Generate leads →</Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-0">
        {/* Campaign name */}
        <section className="pt-8">
          <label className="block text-sm font-semibold mb-3">Campaign Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Q3 SaaS Founders Outreach"
            className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </section>

        {/* Lead list selection */}
        <section className="border-t border-border pt-8 mt-8">
          <label className="block text-sm font-semibold mb-1">Lead List</label>
          <p className="text-xs text-muted-foreground mb-4">
            Only lists with qualified leads are shown
          </p>

          {orgData?.leadLists.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No eligible lead lists found</p>
          ) : (
            <div className="divide-y divide-border">
              {orgData?.leadLists.map((list) => {
                const noEmail = list.emailableLeads === 0;
                const selected = form.leadListId === list.id;
                return (
                  <button
                    key={list.id}
                    type="button"
                    disabled={noEmail}
                    onClick={() => { if (!noEmail) setForm((f) => ({ ...f, leadListId: list.id })); }}
                    title={noEmail ? "This lead list has no leads with an email address" : undefined}
                    className={`w-full flex items-center justify-between gap-4 py-4 text-left group ${noEmail ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? "bg-primary" : "bg-muted-foreground/50"}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors ${selected ? "text-primary" : noEmail ? "" : "group-hover:text-primary"}`}>{list.name}</p>
                        {noEmail ? (
                          <p className="text-xs text-amber-400 mt-1">
                            No leads in this list have an email address — can&apos;t be emailed
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                            <span className="text-foreground">{list.emailableLeads}</span> of {list.qualifiedLeads} qualified lead{list.qualifiedLeads === 1 ? "" : "s"} have an email
                          </p>
                        )}
                      </div>
                    </div>
                    {selected && !noEmail && (
                      <ChevronRight className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Follow-up timing */}
        <section className="border-t border-border pt-8 mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
            <label className="text-sm font-semibold">Follow-up Timing</label>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Follow-up 1</span>
                <span className="text-sm font-medium tabular-nums">
                  Day {form.followUp1DelayDays}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={14}
                value={form.followUp1DelayDays}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm((f) => ({
                    ...f,
                    followUp1DelayDays: v,
                    followUp2DelayDays: Math.max(f.followUp2DelayDays, v + 1),
                  }));
                }}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Day 1</span><span>Day 14</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Follow-up 2</span>
                <span className="text-sm font-medium tabular-nums">
                  Day {form.followUp2DelayDays}
                </span>
              </div>
              <input
                type="range"
                min={form.followUp1DelayDays + 1}
                max={30}
                value={form.followUp2DelayDays}
                onChange={(e) => setForm((f) => ({ ...f, followUp2DelayDays: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>Day {form.followUp1DelayDays + 1}</span><span>Day 30</span>
              </div>
            </div>
          </div>

          {/* Timeline preview */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Sequence preview</p>
            <div className="flex items-center gap-0">
              {[
                { label: "Initial", day: "Day 0", color: "bg-primary" },
                { label: "Follow-up 1", day: `Day ${form.followUp1DelayDays}`, color: "bg-purple-500" },
                { label: "Follow-up 2", day: `Day ${form.followUp2DelayDays}`, color: "bg-indigo-500" },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${step.color}`} />
                    <p className="text-[11px] font-medium text-center">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{step.day}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="h-px bg-border flex-1 mx-1 -mt-5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Daily send limit */}
        <section className="border-t border-border pt-8 mt-8">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold">Daily Send Limit</label>
            <span className="text-sm font-medium tabular-nums">{form.dailySendLimit} / day</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Keep it under 100/day for new domains to protect deliverability
          </p>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={form.dailySendLimit}
            onChange={(e) => setForm((f) => ({ ...f, dailySendLimit: Number(e.target.value) }))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1 tabular-nums">
            <span>10</span><span className="text-emerald-400">100 (safe)</span><span>200</span>
          </div>
        </section>

        {error && (
          <p className="text-sm text-destructive bg-secondary/40 px-4 py-3 rounded-lg mt-8">{error}</p>
        )}

        {/* Summary + Submit */}
        {selectedList && (
          <div className="rounded-lg bg-secondary/40 px-4 py-3 text-sm mt-8">
            <p className="font-medium mb-2 text-primary">Campaign Summary</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>• <strong className="text-foreground tabular-nums">{selectedList.emailableLeads}</strong> of {selectedList.qualifiedLeads} qualified leads will be emailed from &quot;{selectedList.name}&quot;{selectedList.emailableLeads < selectedList.qualifiedLeads ? ` (${selectedList.qualifiedLeads - selectedList.emailableLeads} have no email and will be skipped)` : ""}</li>
              <li>• Initial email → Follow-up on day {form.followUp1DelayDays} → Follow-up on day {form.followUp2DelayDays}</li>
              <li>• Max {form.dailySendLimit} emails per day</li>
            </ul>
          </div>
        )}

        <div className="flex gap-3 border-t border-border pt-8 mt-8">
          <Link
            href="/campaigns"
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !form.leadListId || !form.name.trim() || selectedList?.emailableLeads === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
            ) : (
              <>Create Campaign <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewCampaignInner />
    </Suspense>
  );
}
