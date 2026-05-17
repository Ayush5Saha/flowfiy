"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";

const INDUSTRIES = [
  "SaaS", "E-commerce", "Marketing Agency", "Consulting", "Fintech",
  "HealthTech", "Real Estate", "Legal", "Education", "Manufacturing",
  "Retail", "Media & Content", "HR & Recruiting", "Logistics", "Other",
];

const GEOGRAPHIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Singapore", "UAE", "Global",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

type Tab = "workspace" | "business" | "account";

interface Props {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    memberCount: number;
  };
  businessProfile: {
    companyName: string;
    website: string;
    serviceOffered: string;
    icpDescription: string;
    targetIndustries: string[];
    targetGeographies: string[];
    companySizeRange: string;
    painPointsSolved: string;
    offerPositioning: string;
    outreachTone: string;
  } | null;
  user: {
    email: string;
    role: string;
  };
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <Check className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saved ? "Saved" : "Save changes"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring";
const textareaCls = `${inputCls} resize-none`;

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function SettingsClient({ organization, businessProfile, user }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("workspace");

  // Workspace form
  const [orgName, setOrgName] = useState(organization.name);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState("");

  // Business profile form
  const bp = businessProfile;
  const [companyName, setCompanyName] = useState(bp?.companyName ?? "");
  const [website, setWebsite] = useState(bp?.website ?? "");
  const [serviceOffered, setServiceOffered] = useState(bp?.serviceOffered ?? "");
  const [icpDescription, setIcpDescription] = useState(bp?.icpDescription ?? "");
  const [targetIndustries, setTargetIndustries] = useState<string[]>(bp?.targetIndustries ?? []);
  const [targetGeographies, setTargetGeographies] = useState<string[]>(bp?.targetGeographies ?? []);
  const [companySizeRange, setCompanySizeRange] = useState(bp?.companySizeRange ?? "");
  const [painPointsSolved, setPainPointsSolved] = useState(bp?.painPointsSolved ?? "");
  const [offerPositioning, setOfferPositioning] = useState(bp?.offerPositioning ?? "");
  const [outreachTone, setOutreachTone] = useState(bp?.outreachTone ?? "professional");
  const [bpLoading, setBpLoading] = useState(false);
  const [bpSaved, setBpSaved] = useState(false);
  const [bpError, setBpError] = useState("");

  async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setOrgLoading(true);
    setOrgError("");
    setOrgSaved(false);

    const res = await fetch("/api/organizations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: organization.id, name: orgName }),
    });

    setOrgLoading(false);
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setOrgError(typeof data.error === "string" ? data.error : "Failed to update workspace");
      return;
    }

    setOrgSaved(true);
    router.refresh();
    setTimeout(() => setOrgSaved(false), 3000);
  }

  async function handleSaveBusinessProfile(e: React.FormEvent) {
    e.preventDefault();
    setBpLoading(true);
    setBpError("");
    setBpSaved(false);

    const res = await fetch("/api/business-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: organization.id,
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

    setBpLoading(false);
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setBpError(typeof data.error === "string" ? data.error : "Failed to save profile");
      return;
    }

    setBpSaved(true);
    router.refresh();
    setTimeout(() => setBpSaved(false), 3000);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "workspace", label: "Workspace" },
    { id: "business", label: "Business Profile" },
    { id: "account", label: "Your Account" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Workspace tab */}
      {tab === "workspace" && (
        <form onSubmit={handleSaveWorkspace} className="space-y-6">
          {orgError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {orgError}
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-medium">Workspace details</h2>

            <Field label="Workspace name">
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                placeholder="Acme Agency"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4 text-sm pt-2">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Slug</p>
                <p className="font-mono text-xs bg-secondary px-3 py-2 rounded-lg border border-border">{organization.slug}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Plan</p>
                <p className="capitalize px-3 py-2 text-xs">{organization.plan.toLowerCase()}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <SaveButton loading={orgLoading} saved={orgSaved} />
          </div>
        </form>
      )}

      {/* Business Profile tab */}
      {tab === "business" && (
        <form onSubmit={handleSaveBusinessProfile} className="space-y-6">
          {bpError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {bpError}
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <h2 className="font-medium">Business & ICP</h2>
              <p className="text-muted-foreground text-xs mt-1">Flowfiy uses this to research and qualify leads. Be specific.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Company name">
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Your company" className={inputCls} />
              </Field>
              <Field label="Website (optional)">
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" className={inputCls} />
              </Field>
            </div>

            <Field label="Service you offer">
              <textarea value={serviceOffered} onChange={(e) => setServiceOffered(e.target.value)} required rows={2} placeholder="e.g. We build AI-powered marketing funnels for B2B SaaS companies" className={textareaCls} />
            </Field>

            <Field label="Describe your ideal customer">
              <textarea value={icpDescription} onChange={(e) => setIcpDescription(e.target.value)} required rows={2} placeholder="e.g. B2B SaaS founders with 10-50 employees struggling with lead generation" className={textareaCls} />
            </Field>

            <Field label="Target industries (select up to 5)">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setTargetIndustries((prev) => toggleArr(prev, ind))}
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
            </Field>

            <Field label="Target geographies">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {GEOGRAPHIES.map((geo) => (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => setTargetGeographies((prev) => toggleArr(prev, geo))}
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
            </Field>

            <Field label="Target company size">
              <div className="flex gap-2 mt-1">
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
            </Field>

            <Field label="Pain points you solve">
              <textarea value={painPointsSolved} onChange={(e) => setPainPointsSolved(e.target.value)} required rows={2} placeholder="e.g. Poor lead quality, inconsistent pipeline, time wasted on manual prospecting" className={textareaCls} />
            </Field>

            <Field label="Your offer positioning">
              <textarea value={offerPositioning} onChange={(e) => setOfferPositioning(e.target.value)} required rows={2} placeholder="e.g. We guarantee 20 qualified discovery calls in 90 days or we work for free" className={textareaCls} />
            </Field>

            <Field label="Outreach tone">
              <div className="flex gap-2 mt-1">
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
            </Field>
          </div>

          <div className="flex justify-end">
            <SaveButton loading={bpLoading} saved={bpSaved} />
          </div>
        </form>
      )}

      {/* Account tab */}
      {tab === "account" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-medium">Your account</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Role</span>
                <span className="capitalize px-2.5 py-0.5 bg-secondary rounded-full text-xs border border-border">
                  {user.role.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-medium mb-1">Workspace membership</h2>
            <p className="text-muted-foreground text-xs mb-3">You are {user.role === "OWNER" ? "the owner" : `a ${user.role.toLowerCase()}`} of this workspace.</p>
            <div className="text-xs text-muted-foreground">
              To change your email address or delete your account, contact <span className="text-foreground">support@flowfiy.com</span>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}