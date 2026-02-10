export default function OpportunitiesLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton h-8 w-48 rounded mb-2" />
          <div className="skeleton h-4 w-64 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton w-48 h-10 rounded-xl" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="skeleton w-12 h-8 rounded" />
              <div className="skeleton flex-1 h-5 rounded" />
              <div className="skeleton w-24 h-5 rounded" />
              <div className="skeleton w-20 h-5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
