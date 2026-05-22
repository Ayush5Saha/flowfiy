"use client";
import { Sidebar } from "@/components/layout/Sidebar";

const mockOrg = {
  id: "demo-org", name: "Acme Corp", slug: "acme-corp", plan: "GROWTH" as const,
  razorpayCustomerId: null, razorpaySubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null, billingGateway: null, subscriptionStatus: "active",
  generationCount: 847, generationLimit: 7500, createdAt: new Date(), updatedAt: new Date(), members: [],
  referralCode: null, referralCreditMonths: 0,
  monthlyTokensUsed: BigInt(0), tokenBudgetResetAt: null, apiMode: "CENTRAL" as const,
};

const integrations = [
  { type: "CLAUDE", name: "Claude API", desc: "Powers all 5 AI agents — ICP analysis, research, qualification, personalization", status: "CONNECTED", badge: "Required", icon: "🤖", validated: "2 hours ago" },
  { type: "APOLLO", name: "Apollo.io", desc: "Lead discovery — searches 275M+ contacts matching your ICP criteria", status: "CONNECTED", badge: "Required", icon: "🔍", validated: "2 hours ago" },
  { type: "APIFY", name: "Apify", desc: "Web scraping — enriches company research with live website content", status: "CONNECTED", badge: "Recommended", icon: "🕷️", validated: "Yesterday" },
  { type: "GMAIL", name: "Gmail", desc: "Outreach delivery — sends personalized emails from your own inbox", status: "CONNECTED", badge: "Required for sending", icon: "✉️", validated: "3 days ago" },
  { type: "CALENDLY", name: "Calendly", desc: "Meeting booking — auto-inserts your scheduling link into outreach emails", status: "DISCONNECTED", badge: "Optional", icon: "📅", validated: null },
];

export default function DemoIntegrationsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar organization={mockOrg} userRole="OWNER" userEmail="demo@flowfiy.com" userFullName="Demo User" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Integrations</h1>
            <p className="text-muted-foreground text-sm mt-1">Connect your tools to power the AI outbound pipeline</p>
          </div>

          <div className="space-y-3">
            {integrations.map((int) => (
              <div key={int.type} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
                    {int.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{int.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${int.badge === "Required" ? "bg-blue-500/10 text-blue-400" : int.badge === "Optional" ? "bg-secondary text-muted-foreground" : "bg-purple-500/10 text-purple-400"}`}>
                        {int.badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-md">{int.desc}</p>
                    {int.validated && (
                      <p className="text-xs text-muted-foreground/60 mt-1">Last validated {int.validated}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {int.status === "CONNECTED" ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400">Connected</span>
                      </div>
                      <button className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-400 font-medium mb-1">Your keys, your control</p>
            <p className="text-xs text-muted-foreground">All API keys are encrypted with AES-256-GCM before storage. Claude API costs go directly to your Anthropic account — Flowfiy charges only for platform access.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
