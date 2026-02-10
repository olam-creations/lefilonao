export default function AoDetailLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Title + badge */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-8 w-96 rounded" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-10 w-24 rounded-xl" />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="skeleton w-20 h-4 rounded mb-3" />
            <div className="skeleton w-28 h-6 rounded" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="skeleton h-6 w-48 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
