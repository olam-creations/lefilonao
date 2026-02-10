export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="skeleton h-8 w-40 rounded mb-2" />
        <div className="skeleton h-4 w-64 rounded" />
      </div>

      {/* Settings sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-10 w-full rounded-lg" />
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
