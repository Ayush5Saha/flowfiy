"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ChevronRight } from "lucide-react";

const STEPS = [
  { id: 1, label: "Workspace" },
  { id: 2, label: "Business Profile" },
  { id: 3, label: "Connect Claude" },
];

const INDUSTRIES = [
  "SaaS", "E-commerce", "Marketing Agency", "Consulting", "Fintech",
  "HealthTech", "Real Estate", "Legal", "Education", "Manufacturing",
  "Retail", "Media & Content", "HR & Recruiting", "Logistics", "Other",
];

const GEOGRAPHIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Singapore", "UAE", "Global",
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "500+",
];

export function OnboardingWizard({ userId }: { userId: string }) {
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
  const [serviceOffered, setServiceOffered] = useState("");
  const [icpDescription, setIcpDescription] = useState("");
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [targetGeographies, setTargetGeographies] = useState<string[]>([]);
  const [companySizeRange, setCompanySizeRange] = useState("");
  const [painPointsSolved, setPainPointsSolved] = useState("");
  const [offerPositioning, setOfferPositioning] = useState("");
  const [outreachTone, setOutreachTone] = useState("professional");

  // Step 3
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [validating, setValidating] = useState(false);

  function toggleArray(arr: string[], setArr: (v: string[]) => void, value: string) {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else if (arr.length < 10) {
      setArr([...arr, value]);
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workspaceName }),
    });

    const data = await res.json() as { organization?: { id: string }; error?: string };
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

    const res = await fetch("/api/business-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgId,
        companyName,
        website: website || undefined,
        serviceOffered,
        icpDescription,
        targetIndustries,
        targetGeographies,
        companySizeRange: companySizeRange || undefined,
        painPointsSolved,
        offerPositioning,
        outreachTone,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(typeof data.error === "string" ? data.error : "Failed to save profile");
      return;
    }

    setStep(3);
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setValidating(true);
    setError("");

    // Validate the key
    const validateRes = await fetch("/api/integrations/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CLAUDE", credentials: { apiKey: claudeApiKey } }),
    });

    const validateData = await validateRes.json() as { valid: boolean; message: string };
    setValidating(false);

    if (!validateData.valid) {
      setError(validateData.message ?? "Invalid Claude API key");
      return;
    }

    setLoading(true);
    const saveRes = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: orgId,
        type: "CLAUDE",
        credentials: { apiKey: claudeApiKey },
      }),
    });

    setLoading(false);
    if (!saveRes.ok) {
      setError("Failed to save API key");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-border">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 flex items-center gap-2 px-4 py-3 text-sm ${
              step === s.id ? "text-foreground font-medium" : step > s.id ? "text-muted-foreground" : "text-muted-foreground"
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

        {/* Step 2: Business Profile */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Define your business & ICP</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Claude uses this to research and qualify leads. Be specific.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-sm font-medium mb-1.5">Service you offer</label>
              <textarea value={serviceOffered} onChange={(e) => setServiceOffered(e.target.value)} required rows={2} placeholder="e.g. We build AI-powered marketing funnels for B2B SaaS companies" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Describe your ideal customer</label>
              <textarea value={icpDescription} onChange={(e) => setIcpDescription(e.target.value)} required rows={2} placeholder="e.g. B2B SaaS founders with 10-50 employees struggling with lead generation" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Target industries (select up to 5)</label>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleArray(targetIndustries, setTargetIndustries, ind)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      targetIndustries.includes(ind)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Target geographies</label>
              <div className="flex flex-wrap gap-1.5">
                {GEOGRAPHIES.map((geo) => (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => toggleArray(targetGeographies, setTargetGeographies, geo)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      targetGeographies.includes(geo)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {geo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Target company size</label>
              <div className="flex gap-2">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setCompanySizeRange(size)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      companySizeRange === size
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Pain points you solve</label>
              <textarea value={painPointsSolved} onChange={(e) => setPainPointsSolved(e.target.value)} required rows={2} placeholder="e.g. Poor lead quality, inconsistent pipeline, time wasted on manual prospecting" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Your offer positioning</label>
              <textarea value={offerPositioning} onChange={(e) => setOfferPositioning(e.target.value)} required rows={2} placeholder="e.g. We guarantee 20 qualified discovery calls in 90 days or we work for free" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </div>

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
              disabled={loading || !companyName || !serviceOffered || !icpDescription || targetIndustries.length === 0 || targetGeographies.length === 0 || !painPointsSolved || !offerPositioning}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save & Continue
            </button>
          </form>
        )}

        {/* Step 3: Claude API Key */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Connect Claude AI</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Your API key is encrypted and stored securely. It&apos;s used only for your outbound research.
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
              <p className="text-blue-400 font-medium mb-1">Get your API key</p>
              <p className="text-muted-foreground text-xs">
                Go to{" "}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  console.anthropic.com
                </a>
                {" "}→ API Keys → Create Key. You need a paid Anthropic account.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Claude API Key</label>
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                required
                placeholder="sk-ant-api03-..."
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={validating || loading || !claudeApiKey}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(validating || loading) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {validating ? "Validating key..." : loading ? "Saving..." : "Complete Setup"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              You can connect Apollo, Apify, Gmail, and Calendly in the Integrations page after setup.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
