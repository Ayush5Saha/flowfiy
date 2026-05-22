"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ArrowRight, ShieldCheck } from "lucide-react";

interface IntegrationHealth {
  type: string;
  label: string;
  icon: string;
  description: string;
  tier: "required" | "recommended" | "optional";
  connected: boolean;
}

interface SystemHealthCheckProps {
  integrations: IntegrationHealth[];
}

const tierConfig = {
  required: {
    label: "Required",
    class: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  recommended: {
    label: "Recommended",
    class: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  optional: {
    label: "Optional",
    class: "bg-secondary text-muted-foreground border-border",
  },
};

export function SystemHealthCheck({ integrations }: SystemHealthCheckProps) {
  const [expanded, setExpanded] = useState(true);

  const required = integrations.filter((i) => i.tier === "required");
  const recommended = integrations.filter((i) => i.tier === "recommended");

  const missingRequired = required.filter((i) => !i.connected).length;
  const missingRecommended = recommended.filter((i) => !i.connected).length;
  const allHealthy = missingRequired === 0 && missingRecommended === 0;

  if (allHealthy) {
    // Compact "all good" pill — doesn't need to take up space
    return (
      <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 w-fit">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs text-emerald-400 font-medium">All systems connected</span>
      </div>
    );
  }

  const headerColor = missingRequired > 0
    ? "border-red-500/25 bg-red-500/5"
    : "border-amber-500/25 bg-amber-500/5";

  const statusIcon = missingRequired > 0
    ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
    : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;

  const statusText = missingRequired > 0
    ? `${missingRequired} required connection${missingRequired > 1 ? "s" : ""} missing`
    : `${missingRecommended} recommended connection${missingRecommended > 1 ? "s" : ""} missing`;

  const statusSubtext = missingRequired > 0
    ? "Lead generation and email outreach won't work until these are connected."
    : "Connect these to improve research quality and reply tracking.";

  return (
    <div className={`mb-6 border rounded-xl overflow-hidden ${headerColor}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{statusText}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{statusSubtext}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/integrations"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            Fix now <ArrowRight className="w-3 h-3" />
          </Link>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded integration list */}
      {expanded && (
        <div className="border-t border-white/[0.06] bg-card/40">
          {/* Managed Claude row — always first, always active */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
            <span className="text-lg w-6 text-center shrink-0">🤖</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Claude Sonnet</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                  Managed
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">AI engine — fully managed by Flowfiy</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Active</span>
            </div>
          </div>

          {/* User-configured integrations */}
          {integrations.map((integration) => {
            const tier = tierConfig[integration.tier];
            return (
              <div
                key={integration.type}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-lg w-6 text-center shrink-0">{integration.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{integration.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${tier.class}`}>
                      {tier.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                </div>
                <div className="shrink-0">
                  {integration.connected ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-medium">Connected</span>
                    </div>
                  ) : (
                    <Link
                      href="/integrations"
                      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                        integration.tier === "required"
                          ? "text-red-400 hover:text-red-300"
                          : "text-amber-400 hover:text-amber-300"
                      }`}
                    >
                      Connect <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
