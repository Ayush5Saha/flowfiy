"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink, Key, Zap } from "lucide-react";

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
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
  isOAuth?: boolean;
  docsUrl?: string;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    type: "CLAUDE",
    label: "Claude AI",
    description: "Powers all AI research, qualification, and outreach generation",
    icon: "🤖",
    fields: [{ key: "apiKey", label: "API Key", placeholder: "sk-ant-...", type: "password" }],
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    type: "APOLLO",
    label: "Apollo.io",
    description: "Lead discovery — finds contacts matching your ICP",
    icon: "🚀",
    fields: [{ key: "apiKey", label: "API Key", placeholder: "Apollo API key", type: "password" }],
    docsUrl: "https://app.apollo.io/#/settings/integrations/api",
  },
  {
    type: "APIFY",
    label: "Apify",
    description: "Web scraping — extracts company website content for analysis",
    icon: "🕷️",
    fields: [{ key: "apiKey", label: "API Key", placeholder: "apify_api_...", type: "password" }],
    docsUrl: "https://console.apify.com/account/integrations",
  },
  {
    type: "GMAIL",
    label: "Gmail",
    description: "Sends personalized outreach emails from your account",
    icon: "📧",
    fields: [],
    isOAuth: true,
  },
  {
    type: "CALENDLY",
    label: "Calendly",
    description: "Meeting booking — link auto-inserted into outreach emails",
    icon: "📅",
    fields: [
      { key: "apiKey", label: "Personal Access Token", placeholder: "eyJraWQi...", type: "password" },
      { key: "schedulingLink", label: "Scheduling Link (optional)", placeholder: "https://calendly.com/you/30min" },
    ],
    docsUrl: "https://calendly.com/integrations/api_webhooks",
  },
];

export function IntegrationCenter({ organizationId, statusMap }: IntegrationCenterProps) {
  return (
    <div className="space-y-4">
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

    // Validate first
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

    // For Calendly, auto-populate schedulingLink from API if not provided
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
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{config.label}</p>
              {isConnected && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
              {status && !isConnected && <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isConnected
              ? "bg-green-500/10 text-green-400"
              : "bg-secondary text-muted-foreground"
          }`}>
            {isConnected ? "Connected" : "Not connected"}
          </span>
          {config.docsUrl && (
            <a
              href={config.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4">
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
