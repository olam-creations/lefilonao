export default function WatchlistLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton h-8 w-44 rounded mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton w-10 h-10 rounded-xl" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="skeleton w-16 h-4 rounded mb-2" />
            <div className="skeleton w-10 h-7 rounded" />
          </div>
        ))}
      </div>

      {/* Buyer cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-1/2 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton w-8 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
