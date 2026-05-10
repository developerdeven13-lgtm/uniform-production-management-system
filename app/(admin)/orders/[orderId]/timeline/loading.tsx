export default function TimelineLoading() {
  return (
    <div className="max-w-2xl space-y-5 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="h-3 w-3 bg-slate-100 rounded" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
        <div className="h-3 w-3 bg-slate-100 rounded" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>

      <div className="space-y-1">
        <div className="h-7 w-40 bg-slate-200 rounded-lg" />
        <div className="h-4 w-24 bg-slate-100 rounded" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="relative">
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-slate-100 shrink-0 z-10" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-28 bg-slate-100 rounded-full" />
                    <div className="h-3 w-3 bg-slate-100 rounded" />
                    <div className="h-5 w-28 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-3 w-48 bg-slate-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
