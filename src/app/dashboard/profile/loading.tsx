export default function ProfileLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="skeleton h-8 w-44 rounded mb-2" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="skeleton h-6 w-36 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-10 w-32 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
