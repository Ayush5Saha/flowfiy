export default function AnalyticsLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-24 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-56 bg-secondary/60 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="h-3 w-20 bg-secondary rounded mb-3" />
            <div className="h-8 w-14 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 h-64" />
        <div className="bg-card border border-border rounded-xl p-5 h-64" />
      </div>
    </div>
  );
}
