export default function LeadListLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 bg-secondary rounded-lg" />
        <div className="h-5 w-32 bg-secondary rounded" />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-secondary rounded-lg mb-2" />
          <div className="h-4 w-36 bg-secondary/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-secondary rounded-lg" />
          <div className="h-9 w-28 bg-secondary rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="h-3 w-16 bg-secondary rounded mb-2" />
            <div className="h-7 w-12 bg-secondary rounded" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border flex gap-3">
          <div className="h-8 w-56 bg-secondary rounded-lg" />
          <div className="h-8 w-24 bg-secondary rounded-lg" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-secondary rounded mb-1.5" />
              <div className="h-3 w-24 bg-secondary/60 rounded" />
            </div>
            <div className="h-4 w-28 bg-secondary/60 rounded" />
            <div className="h-5 w-16 bg-secondary rounded-full" />
            <div className="h-8 w-20 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
