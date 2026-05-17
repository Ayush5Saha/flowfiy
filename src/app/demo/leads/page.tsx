"use client";
import { Sidebar } from "@/components/layout/Sidebar";

const mockOrg = {
  id: "demo-org", name: "Acme Corp", slug: "acme-corp", plan: "GROWTH" as const,
  razorpayCustomerId: null, razorpaySubscriptionId: null, subscriptionStatus: "active",
  generationCount: 847, generationLimit: 2000, createdAt: new Date(), updatedAt: new Date(), members: [],
};

const leads = [
  { id: "1", firstName: "Sarah", lastName: "Chen", title: "VP of Engineering", company: "Streamline Labs", email: "s.chen@streamlinelabs.io", score: 87, status: "QUALIFIED", industry: "SaaS", size: "51-200" },
  { id: "2", firstName: "Marcus", lastName: "Rivera", title: "CTO", company: "Nexus AI", email: "m.rivera@nexus.ai", score: 91, status: "QUALIFIED", industry: "AI/ML", size: "11-50" },
  { id: "3", firstName: "Priya", lastName: "Sharma", title: "Head of Engineering", company: "FinFlow", email: "p.sharma@finflow.com", score: 73, status: "QUALIFIED", industry: "FinTech", size: "201-500" },
  { id: "4", firstName: "Jordan", lastName: "Blake", title: "Director of Product", company: "CloudBridge", email: "j.blake@cloudbridge.io", score: 45, status: "DISQUALIFIED", industry: "Cloud", size: "501-1000" },
  { id: "5", firstName: "Emma", lastName: "Walsh", title: "CTO", company: "DevPulse", email: "e.walsh@devpulse.co", score: 82, status: "QUALIFIED", industry: "DevTools", size: "11-50" },
  { id: "6", firstName: "Kai", lastName: "Tanaka", title: "VP Engineering", company: "ScaleOps", email: "k.tanaka@scaleops.com", score: 79, status: "QUALIFIED", industry: "SaaS", size: "51-200" },
];

export default function DemoLeadsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar organization={mockOrg} userRole="OWNER" userEmail="demo@flowfiy.com" userFullName="Demo User" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Leads</span>
                <span>/</span>
                <span>B2B SaaS Founders — NYC</span>
              </div>
              <h1 className="text-xl font-semibold">B2B SaaS Founders — NYC</h1>
              <p className="text-muted-foreground text-sm">ICP-matched, Flowfiy-researched leads ready for outreach</p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: 50, color: "text-foreground" },
              { label: "Qualified", value: 38, color: "text-green-400" },
              { label: "Disqualified", value: 12, color: "text-muted-foreground" },
              { label: "Contacted", value: 7, color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <div>
                  <p className={`font-mono text-sm font-medium ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-4 bg-secondary/50 rounded-lg p-1 w-fit">
            {["All (50)", "Qualified (38)", "Disqualified (12)"].map((tab, i) => (
              <button key={tab} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${i === 0 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            {/* Lead table */}
            <div className="flex-1 space-y-1">
              {leads.map((lead) => (
                <div key={lead.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${lead.id === "1" ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80 hover:bg-secondary/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-muted-foreground">{lead.title} · {lead.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{lead.industry}</span>
                    <div className={`text-xs font-mono px-2 py-0.5 rounded ${lead.score >= 70 ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                      {lead.score}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === "QUALIFIED" ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}>
                      {lead.status === "QUALIFIED" ? "Qualified" : "Disqualified"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Outreach panel */}
            <div className="w-72 bg-card border border-border rounded-xl p-4 flex-shrink-0">
              <div className="mb-3">
                <div className="font-medium text-sm">Sarah Chen</div>
                <div className="text-xs text-muted-foreground">VP of Engineering · Streamline Labs</div>
              </div>
              <div className="flex gap-1 mb-3">
                {["Outreach", "Research"].map((tab, i) => (
                  <button key={tab} className={`flex-1 py-1 text-xs rounded font-medium ${i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{tab}</button>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subject</p>
                  <p className="text-xs bg-secondary rounded p-2 leading-relaxed">Quick question about engineering velocity at Streamline Labs</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-xs bg-secondary rounded p-2 leading-relaxed text-muted-foreground">
                    Hi Sarah,<br/><br/>
                    I noticed Streamline Labs recently expanded your engineering team to 80+ engineers — impressive growth.<br/><br/>
                    We help VP Engs at Series B SaaS companies cut sprint planning overhead by 40% using AI-automated standup synthesis...<br/><br/>
                    Worth a 15-min call?
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 text-xs border border-border rounded hover:bg-secondary transition-colors">Copy</button>
                  <button className="flex-1 py-1.5 text-xs bg-primary text-primary-foreground rounded">Approve</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
