"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink, Key, Zap, BookOpen, Sparkles } from "lucide-react";

interface IntegrationStatus {
  status: string;
  lastValidatedAt: Date | null;
}

interface IntegrationCenterProps {
  organizationId: string;
  statusMap: Record<string, IntegrationStatus>;
}

interface IntegrationConfig {
  type: string;
  label: string;
  description: string;
  icon: string;
  tier: "required" | "optional";
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
  isOAuth?: boolean;
  docsUrl?: string;
  howToGet?: {
    title: string;
    steps: string[];
    note?: string;
  };
}

const TIER_STYLE: Record<string, { label: string; class: string }> = {
  required: { label: "Required", class: "bg-red-500/10 text-red-400 border border-red-500/20" },
  optional: { label: "Optional", class: "bg-secondary text-muted-foreground border border-border" },
};

// Under the new architecture the AI (Gemini), lead sources (Google Maps + a B2B
// people database), and email verification are all fully managed by Flowfiy — no
// API keys. The only things a user connects are Gmail (to send) and, optionally,
// Calendly (to drop a booking link into outreach).
const INTEGRATIONS: IntegrationConfig[] = [
  {
    type: "GMAIL",
    label: "Gmail",
    description: "Sends your approved outreach from your own inbox",
    tier: "required",
    icon: "📧",
    fields: [],
    isOAuth: true,
    howToGet: {
      title: "How to connect Gmail",
      steps: [
        'Click "Connect with Google" below',
        "Choose the Gmail account you want to send outreach from",
        "Grant the requested permission (send email on your behalf)",
        "You'll be redirected back here once connected",
      ],
      note: "Flowfiy only sends emails — it never reads your inbox or deletes messages.",
    },
  },
  {
    type: "CALENDLY",
    label: "Calendly",
    description: "Meeting booking — link auto-inserted into outreach emails",
    tier: "optional",
    icon: "📅",
    fields: [
      { key: "apiKey", label: "Personal Access Token", placeholder: "eyJraWQi...", type: "password" },
      { key: "schedulingLink", label: "Scheduling Link (optional)", placeholder: "https://calendly.com/you/30min" },
    ],
    docsUrl: "https://calendly.com/integrations/api_webhooks",
    howToGet: {
      title: "How to get your Calendly API Token",
      steps: [
        "Log in to calendly.com",
        "Go to Integrations → API & Webhooks (or visit calendly.com/integrations/api_webhooks)",
        'Click "Create new token", name it, and copy the token',
        "Your scheduling link is your Calendly profile URL — e.g. calendly.com/yourname/30min",
      ],
      note: "The scheduling link is optional — if left blank, Flowfiy will try to fetch it automatically from your API token.",
    },
  },
];

export function IntegrationCenter({ organizationId, statusMap }: IntegrationCenterProps) {
  return (
    <div className="space-y-4">
      {/* Fully-managed banner — AI + data + email verification need no keys */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-green-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-sm">AI &amp; data — fully managed</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">No API keys</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The AI engine, lead discovery (Google Maps + a B2B people database), and email verification are all run
              and paid for by Flowfiy — metered by credits. There are no keys to connect. Just link your Gmail to send.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {INTEGRATIONS.map((integration) => (
          <IntegrationCard
            key={integration.type}
            config={integration}
            status={statusMap[integration.type]}
            organizationId={organizationId}
          />
        ))}
      </div>
    </div>
  );
}

function HowToGetBox({ howToGet, docsUrl }: { howToGet: NonNullable<IntegrationConfig["howToGet"]>; docsUrl?: string }) {
  return (
    <div className="mb-4 rounded-lg bg-blue-500/5 border border-blue-500/15 p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
        <p className="text-xs font-medium text-blue-400">{howToGet.title}</p>
      </div>
      <ol className="space-y-1">
        {howToGet.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="shrink-0 w-4 h-4 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center text-[10px] font-bold mt-px">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {(howToGet.note || docsUrl) && (
        <div className="mt-2.5 pt-2.5 border-t border-blue-500/10 flex items-start justify-between gap-3">
          {howToGet.note && <p className="text-[11px] text-muted-foreground/70 italic">{howToGet.note}</p>}
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open docs
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function IntegrationCard({
  config,
  status,
  organizationId,
}: {
  config: IntegrationConfig;
  status?: IntegrationStatus;
  organizationId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isConnected = status?.status === "CONNECTED";

  async function handleSave() {
    setValidating(true);
    setError("");
    setSuccess("");

    const validateRes = await fetch("/api/integrations/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: config.type, credentials }),
    });
    const validateData = await validateRes.json() as { valid: boolean; message: string; schedulingUrl?: string };
    setValidating(false);

    if (!validateData.valid) {
      setError(validateData.message);
      return;
    }

    const finalCredentials = { ...credentials };
    if (config.type === "CALENDLY" && validateData.schedulingUrl && !finalCredentials.schedulingLink) {
      finalCredentials.schedulingLink = validateData.schedulingUrl;
    }

    setSaving(true);
    const saveRes = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, type: config.type, credentials: finalCredentials }),
    });

    setSaving(false);
    if (saveRes.ok) {
      setSuccess(`${config.label} connected successfully`);
      setExpanded(false);
      window.location.reload();
    } else {
      setError("Failed to save integration");
    }
  }

  function handleOAuthConnect() {
    window.location.href = `/api/integrations/gmail/connect?organizationId=${organizationId}`;
  }

  async function handleDisconnect() {
    await fetch(`/api/integrations?organizationId=${organizationId}&type=${config.type}`, {
      method: "DELETE",
    });
    window.location.reload();
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{config.label}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIER_STYLE[config.tier].class}`}>
                {TIER_STYLE[config.tier].label}
              </span>
              {isConnected && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
              {status && !isConnected && <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isConnected ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"
          }`}>
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          {config.howToGet && <HowToGetBox howToGet={config.howToGet} docsUrl={config.docsUrl} />}

          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              {success}
            </div>
          )}

          {config.isOAuth ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Connect your Gmail account via OAuth. You&apos;ll be redirected to Google to grant permission.
              </p>
              <button
                onClick={handleOAuthConnect}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Key className="w-4 h-4" />
                Connect with Google
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium mb-1.5">{field.label}</label>
                  <input
                    type={field.type ?? "text"}
                    value={credentials[field.key] ?? ""}
                    onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={validating || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {(validating || saving) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {validating ? "Validating..." : saving ? "Saving..." : "Save & Connect"}
                </button>

                {isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 border border-destructive/30 text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          )}

          {isConnected && status?.lastValidatedAt && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Last validated {new Date(status.lastValidatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
