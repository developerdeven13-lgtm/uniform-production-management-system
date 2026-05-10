export default function OrdersLoading() {
  return (
    <div className="space-y-5 max-w-6xl animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-7 w-20 bg-slate-100 rounded-full" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex gap-8" style={{ background: '#f8faf9' }}>
          {['w-16', 'w-28', 'w-20', 'w-8', 'w-20', 'w-20'].map((w, i) => (
            <div key={i} className={`h-3 ${w} bg-slate-200 rounded`} />
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-8">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-3 w-20 bg-slate-50 rounded" />
              </div>
              <div className="h-5 w-24 bg-slate-100 rounded-full" />
              <div className="h-4 w-6 bg-slate-100 rounded hidden sm:block" />
              <div className="h-4 w-20 bg-slate-100 rounded hidden md:block" />
              <div className="h-4 w-20 bg-slate-100 rounded hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
