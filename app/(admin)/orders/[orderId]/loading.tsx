export default function OrderDetailLoading() {
  return (
    <div className="max-w-4xl space-y-5 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-slate-200 rounded" />
        <div className="h-3 w-3 bg-slate-100 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-32 bg-slate-200 rounded-lg" />
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-lg shrink-0" />
      </div>

      {/* Status stepper */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-5 space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="flex items-center gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
              {i < 5 && <div className="flex-1 h-px bg-slate-100" />}
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 w-28 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Customer + Order details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-slate-100 rounded" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-28 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="h-5 w-20 bg-slate-200 rounded" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-100 rounded" />
                  <div className="h-3 w-24 bg-slate-50 rounded" />
                </div>
              </div>
              <div className="h-5 w-24 bg-slate-100 rounded-full" />
            </div>
            <div className="px-5 py-3 bg-slate-50">
              <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="text-center space-y-1">
                    <div className="h-2.5 w-10 bg-slate-200 rounded mx-auto" />
                    <div className="h-4 w-8 bg-slate-100 rounded mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
