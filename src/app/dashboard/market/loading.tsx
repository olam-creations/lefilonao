export default function MarketLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="skeleton h-8 w-56 rounded mb-2" />
        <div className="skeleton h-4 w-80 rounded" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="skeleton w-24 h-4 rounded mb-3" />
            <div className="skeleton w-16 h-8 rounded mb-2" />
            <div className="skeleton w-20 h-3 rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="skeleton h-48 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="skeleton h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
