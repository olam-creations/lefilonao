export default function DashboardLoading() {
  return (
    <div className="animate-fade-in">
      {/* TopBar skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="skeleton w-48 h-7 rounded mb-2" />
          <div className="skeleton w-72 h-4 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton w-48 h-10 rounded-xl" />
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="skeleton w-20 h-4 rounded mb-3" />
            <div className="skeleton w-16 h-8 rounded mb-2" />
            <div className="skeleton w-24 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="skeleton w-40 h-6 rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
