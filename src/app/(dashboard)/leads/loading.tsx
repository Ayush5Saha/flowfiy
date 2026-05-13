export default function LeadsLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-20 bg-secondary rounded-lg mb-2" />
          <div className="h-4 w-48 bg-secondary/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-secondary rounded-lg" />
          <div className="h-9 w-36 bg-secondary rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-secondary shrink-0" />
              <div>
                <div className="h-4 w-48 bg-secondary rounded mb-1.5" />
                <div className="h-3 w-36 bg-secondary/60 rounded" />
              </div>
            </div>
            <div className="h-5 w-16 bg-secondary rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
