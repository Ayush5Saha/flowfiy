export default function IntegrationsLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-28 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-64 bg-secondary/60 rounded" />
      </div>
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary shrink-0" />
              <div>
                <div className="h-4 w-32 bg-secondary rounded mb-1.5" />
                <div className="h-3 w-48 bg-secondary/60 rounded" />
              </div>
            </div>
            <div className="h-8 w-24 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
