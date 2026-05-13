export default function SettingsLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-20 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-52 bg-secondary/60 rounded" />
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className="h-5 w-36 bg-secondary rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-secondary/60 rounded-lg" />
              <div className="h-10 w-full bg-secondary/60 rounded-lg" />
            </div>
          </div>
        ))}
        <div className="h-10 w-32 bg-secondary rounded-lg ml-auto" />
      </div>
    </div>
  );
}
