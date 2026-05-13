// This file is the instant skeleton shown while any dashboard page's
// server data is loading. Next.js renders it immediately on navigation —
// the sidebar stays visible, only the content area pulses.
export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-40 bg-secondary rounded-lg mb-2" />
          <div className="h-4 w-64 bg-secondary/60 rounded" />
        </div>
        <div className="h-9 w-36 bg-secondary rounded-lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-secondary rounded" />
              <div className="h-4 w-4 bg-secondary rounded" />
            </div>
            <div className="h-8 w-16 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="h-5 w-32 bg-secondary rounded mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                <div>
                  <div className="h-4 w-40 bg-secondary rounded mb-1.5" />
                  <div className="h-3 w-24 bg-secondary/60 rounded" />
                </div>
                <div className="h-5 w-16 bg-secondary rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="h-5 w-20 bg-secondary rounded mb-4" />
          <div className="h-2 w-full bg-secondary rounded-full mb-4" />
          <div className="h-16 w-full bg-secondary/40 rounded-lg mb-3" />
          <div className="h-9 w-full bg-secondary rounded-lg" />
        </div>
      </div>
    </div>
  );
}
