export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Le Filon AO...</p>
      </div>
    </div>
  );
}
