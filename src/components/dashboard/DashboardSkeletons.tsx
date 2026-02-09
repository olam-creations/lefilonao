export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <div className="skeleton w-20 h-6 rounded-full" />
            <div className="skeleton w-16 h-6 rounded-md" />
          </div>
          <div className="skeleton w-3/4 h-5 mb-3 rounded" />
          <div className="flex gap-4">
            <div className="skeleton w-32 h-4 rounded" />
            <div className="skeleton w-24 h-4 rounded" />
          </div>
        </div>
        <div className="skeleton w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 skeleton" />
      <div className="skeleton w-24 h-3 mb-4 rounded" />
      <div className="skeleton w-16 h-8 mb-2 rounded" />
      <div className="skeleton w-28 h-3 rounded" />
    </div>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[0, 1, 2, 3].map((i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="glass rounded-xl p-6 mb-6">
      <div className="skeleton w-40 h-4 mb-4 rounded" />
      <div className="flex gap-6 items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton w-3 h-3 rounded-full" />
            <div className="skeleton w-16 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
      <div className="skeleton w-64 h-10 rounded-xl" />
      <div className="flex gap-2">
        <div className="skeleton w-16 h-8 rounded-lg" />
        <div className="skeleton w-20 h-8 rounded-lg" />
        <div className="skeleton w-16 h-8 rounded-lg" />
      </div>
    </div>
  );
}
