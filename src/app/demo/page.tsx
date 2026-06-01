"use client";
// Temporary demo page — shows UI components with mock data. Delete before shipping.
import { Sidebar } from "@/components/layout/Sidebar";

const mockOrg = {
  id: "demo-org",
  name: "Acme Corp",
  slug: "acme-corp",
  plan: "GROWTH" as const,
  razorpayCustomerId: null,
  razorpaySubscriptionId: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  billingGateway: null,
  subscriptionStatus: "active",
  generationCount: 847,
  generationLimit: 7500,
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [],
  referralCode: null,
  referralCreditMonths: 0,
  referredByAffiliateId: null,
  monthlyTokensUsed: BigInt(0),
  tokenBudgetResetAt: null,
  apiMode: "CENTRAL" as const,
};

export default function DemoPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar organization={mockOrg} userRole="OWNER" userEmail="demo@flowfiy.com" userFullName="Demo User" />
      <main className="flex-1 overflow-y-auto p-8">
        <DashboardDemo />
      </main>
    </div>
  );
}

function DashboardDemo() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back — here&apos;s your outbound overview</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + Generate Leads
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Leads Generated", value: "1,247", color: "text-blue-400" },
          { label: "Qualified Leads", value: "389", color: "text-green-400" },
          { label: "Emails Sent", value: "214", color: "text-purple-400" },
          { label: "Meetings Booked", value: "12", color: "text-yellow-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-xs mb-3">{label}</p>
            <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent lists */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="font-medium mb-4">Recent Lead Lists</h2>
          <div className="space-y-2">
            {[
              { name: "B2B SaaS Founders — NYC", leads: 50, qualified: 18, status: "READY", score: "Ready" },
              { name: "E-commerce CTOs — Series B+", leads: 35, qualified: 12, status: "READY", score: "Ready" },
              { name: "FinTech Decision Makers", leads: 0, qualified: 0, status: "RESEARCHING", score: "Running" },
              { name: "Healthcare VP Eng", leads: 25, qualified: 8, status: "READY", score: "Ready" },
            ].map((list) => (
              <div key={list.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium">{list.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{list.leads} leads · {list.qualified} qualified</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  list.status === "READY" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                }`}>{list.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-medium mb-4">Usage</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Lead generations</span>
              <span className="font-mono text-xs">847 / 2,000</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-primary" style={{ width: "42%" }} />
            </div>
          </div>
          <div className="border border-border rounded-lg p-3 mb-3">
            <p className="text-xs font-medium">Growth Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">1,153 remaining this month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
