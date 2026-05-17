"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone, Users, Mail, Clock, ChevronRight, Loader2 } from "lucide-react";

interface LeadList {
  id: string;
  name: string;
  qualifiedLeads: number;
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
        setError(json.error?.formErrors?.[0] ?? json.error ?? "Failed to create campaign");
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campaigns"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Campaigns
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">New Campaign</h1>
            <p className="text-muted-foreground text-sm">Set up your outreach sequence</p>
          </div>
        </div>
      </div>

      {/* Gmail warning */}
      {orgData && !orgData.gmailConnected && (
        <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3">
          <Mail className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-300">Gmail not connected</p>
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
        <div className="mb-6 p-4 rounded-xl border border-border bg-secondary/30 flex items-start gap-3">
          <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">No qualified leads yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You need at least one lead list with qualified leads before creating a campaign.{" "}
              <Link href="/leads" className="text-primary hover:underline">Generate leads →</Link>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign name */}
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="block text-sm font-medium mb-3">Campaign Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Q3 SaaS Founders Outreach"
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        {/* Lead list selection */}
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="block text-sm font-medium mb-1">Lead List</label>
          <p className="text-xs text-muted-foreground mb-3">
            Only lists with qualified leads are shown
          </p>

          {orgData?.leadLists.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No eligible lead lists found</p>
          ) : (
            <div className="space-y-2">
              {orgData?.leadLists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, leadListId: list.id }))}
                  className={`w-full flex items-center justify-between p-3.5 rounded-lg border text-left transition-all ${
                    form.leadListId === list.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${form.leadListId === list.id ? "bg-primary" : "bg-secondary"}`} />
                    <div>
                      <p className="text-sm font-medium">{list.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {list.qualifiedLeads} qualified leads
                      </p>
                    </div>
                  </div>
                  {form.leadListId === list.id && (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Follow-up timing */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium">Follow-up Timing</label>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Follow-up 1</span>
                <span className="text-sm font-mono font-medium">
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
                <span className="text-sm font-mono font-medium">
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
        </div>

        {/* Daily send limit */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Daily Send Limit</label>
            <span className="text-sm font-mono font-medium">{form.dailySendLimit} / day</span>
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
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>10</span><span className="text-green-400">100 (safe)</span><span>200</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">{error}</p>
        )}

        {/* Summary + Submit */}
        {selectedList && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
            <p className="font-medium mb-2 text-primary">Campaign Summary</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>• <strong className="text-foreground">{selectedList.qualifiedLeads}</strong> qualified leads from &quot;{selectedList.name}&quot;</li>
              <li>• Initial email → Follow-up on day {form.followUp1DelayDays} → Follow-up on day {form.followUp2DelayDays}</li>
              <li>• Max {form.dailySendLimit} emails per day</li>
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/campaigns"
            className="flex-1 text-center px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !form.leadListId || !form.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewCampaignInner />
    </Suspense>
  );
}
