export default function BillingLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-16 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-48 bg-secondary/60 rounded" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="h-5 w-32 bg-secondary rounded mb-4" />
        <div className="h-2 w-full bg-secondary rounded-full mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-secondary/40 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="h-4 w-20 bg-secondary rounded mb-3" />
            <div className="h-8 w-24 bg-secondary rounded-lg mb-3" />
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 w-full bg-secondary/60 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
