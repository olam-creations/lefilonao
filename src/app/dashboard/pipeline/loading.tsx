export default function PipelineLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="skeleton h-8 w-40 rounded mb-2" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="skeleton h-6 w-28 rounded mb-4" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
