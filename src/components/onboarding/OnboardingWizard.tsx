"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ChevronRight } from "lucide-react";
import { ICP_QUESTIONS } from "@/lib/icp";

const STEPS = [
  { id: 1, label: "Workspace" },
  { id: 2, label: "Business & ICP" },
];

type AnswerMap = Record<string, string | string[]>;

export function OnboardingWizard({ userId }: { userId: string }) {
  void userId;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  // Step 1
  const [workspaceName, setWorkspaceName] = useState("");

  // Step 2
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [outreachTone, setOutreachTone] = useState("professional");
  const [answers, setAnswers] = useState<AnswerMap>({});

  function isSelected(key: string, opt: string) {
    const v = answers[key];
    return Array.isArray(v) ? v.includes(opt) : v === opt;
  }

  function choose(key: string, opt: string, multi: boolean) {
    setAnswers((prev) => {
      if (multi) {
        const cur = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
        return { ...prev, [key]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
      }
      return { ...prev, [key]: prev[key] === opt ? "" : opt };
    });
  }

  const requiredMissing = ICP_QUESTIONS.filter((q) => q.required).some((q) => {
    const v = answers[q.key];
    return !v || (Array.isArray(v) && v.length === 0);
  });
  const step2Invalid = !companyName.trim() || businessDetails.trim().length < 10 || requiredMissing;

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workspaceName }),
    });
    const data = (await res.json()) as { organization?: { id: string }; error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create workspace");
      return;
    }
    setOrgId(data.organization!.id);
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);
    setError("");

    const icp: AnswerMap = {};
    for (const q of ICP_QUESTIONS) {
      const v = answers[q.key];
      if (v && (Array.isArray(v) ? v.length > 0 : true)) icp[q.key] = v;
    }

    const res = await fetch("/api/business-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgId,
        companyName,
        website: website || undefined,
        businessDetails,
        outreachTone,
        icp,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(typeof data.error === "string" ? data.error : "Failed to save profile");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-border">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 flex items-center gap-2 px-4 py-3 text-sm ${
              step >= s.id ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
              step > s.id ? "bg-primary text-primary-foreground" :
              step === s.id ? "border-2 border-primary text-primary" : "border border-border"
            }`}>
              {step > s.id ? <Check className="w-3 h-3" /> : s.id}
            </div>
            <span className="hidden sm:block">{s.label}</span>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />}
          </div>
        ))}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Workspace */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Name your workspace</h2>
              <p className="text-muted-foreground text-sm mb-4">This is usually your company or agency name.</p>
              <label className="block text-sm font-medium mb-1.5">Workspace name</label>
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                placeholder="Acme Agency"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !workspaceName.trim()}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Business details + structured ICP */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Tell us about your business</h2>
              <p className="text-muted-foreground text-sm">
                Write about your business in your own words — Flowfiy uses this to draft your outreach.
                Then answer a few quick questions so we target the right leads.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Company name</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Your company" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Website (optional)</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Your business details</label>
              <p className="text-muted-foreground text-xs mb-2">
                What you do, who you help, your offer, what makes you different — the AI references this when writing emails.
              </p>
              <textarea
                value={businessDetails}
                onChange={(e) => setBusinessDetails(e.target.value)}
                required
                rows={5}
                placeholder="e.g. We help D2C brands scale into offline retail across India without building a traditional distributor network. We connect them directly with vetted retailers and handle the logistics. Our edge is speed — brands go live in stores within 30 days."
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              {businessDetails.trim().length > 0 && businessDetails.trim().length < 10 && (
                <p className="text-destructive text-xs mt-1">Add a little more detail.</p>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* The 12 ICP questions */}
            {ICP_QUESTIONS.map((q, idx) => (
              <div key={q.key}>
                <label className="block text-sm font-medium mb-0.5">
                  {idx + 1}. {q.title}
                  {q.required && <span className="text-destructive ml-1">*</span>}
                </label>
                <p className="text-muted-foreground text-xs mb-2">{q.multi ? "Select all that apply" : "Select one"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => choose(q.key, opt, q.multi)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        isSelected(q.key, opt)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="h-px bg-border" />

            <div>
              <label className="block text-sm font-medium mb-1.5">Outreach tone</label>
              <div className="flex gap-2">
                {[
                  { value: "professional", label: "Professional" },
                  { value: "conversational", label: "Conversational" },
                  { value: "direct", label: "Direct" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOutreachTone(value)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      outreachTone === value
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || step2Invalid}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save & Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
