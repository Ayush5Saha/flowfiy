export default function ProfileLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-20 bg-secondary rounded-lg mb-2" />
        <div className="h-4 w-56 bg-secondary/60 rounded" />
      </div>

      {/* Avatar card */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-secondary shrink-0" />
        <div className="flex-1">
          <div className="h-5 w-40 bg-secondary rounded mb-2" />
          <div className="h-4 w-52 bg-secondary/60 rounded mb-3" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-secondary rounded-full" />
            <div className="h-5 w-14 bg-secondary rounded-full" />
          </div>
        </div>
      </div>

      {/* Sections */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className="h-4 w-36 bg-secondary rounded mb-4" />
          <div className="space-y-3">
            <div className="h-9 w-full bg-secondary/60 rounded-lg" />
            {i < 2 && <div className="h-9 w-full bg-secondary/60 rounded-lg" />}
          </div>
          <div className="h-9 w-32 bg-secondary rounded-lg mt-4" />
        </div>
      ))}
    </div>
  );
}
