'use client';

export function MarketStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 skeleton" />
          <div className="skeleton w-24 h-3 mb-4 rounded" />
          <div className="skeleton w-20 h-8 mb-2 rounded" />
          <div className="skeleton w-28 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="skeleton w-40 h-5 mb-6 rounded" />
      <div className={`skeleton w-full ${height} rounded-lg`} />
    </div>
  );
}

export function RankingChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="skeleton w-36 h-5 mb-5 rounded" />
      <div className="space-y-3">
        {[100, 85, 70, 55, 40, 30].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-6 h-6 rounded-full flex-shrink-0" />
            <div className="skeleton w-32 h-4 rounded flex-shrink-0" />
            <div className={`skeleton h-6 rounded`} style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AttributionsListSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="skeleton w-44 h-5 rounded" />
        <div className="skeleton w-28 h-8 rounded-lg" />
      </div>
      <div className="space-y-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-start gap-4 py-4 border-b border-slate-100 last:border-0">
            <div className="flex-1">
              <div className="skeleton w-3/4 h-4 mb-2 rounded" />
              <div className="flex gap-3">
                <div className="skeleton w-32 h-3 rounded" />
                <div className="skeleton w-20 h-3 rounded" />
              </div>
            </div>
            <div className="skeleton w-20 h-5 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
