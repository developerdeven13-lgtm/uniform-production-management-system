export default function EmbroideryQueueLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">

      {/* PageTitle skeleton */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <div className="rounded-xl bg-[#D3D1C7]" style={{ width: 90, height: 72 }} />
        <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="h-2.5 w-10 rounded-full bg-[#E8E6DE]" />
          <div className="h-5 w-24 rounded bg-[#E0DDD4]" />
        </div>
      </div>

      {/* Card grid — 1 col mobile, 2 col sm, 3 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              border: '0.5px solid #D3D1C7',
              borderRadius: 14,
              padding: 20,
            }}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8E6DE] shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-20 rounded bg-[#D3D1C7]" />
                  <div className="h-2.5 w-14 rounded bg-[#E8E6DE]" />
                </div>
              </div>
              <div className="h-5 w-16 rounded-full bg-[#E8E6DE]" />
            </div>

            {/* Card body lines */}
            <div className="space-y-2 mb-4">
              <div className="h-2.5 w-full rounded bg-[#F1EFE8]" />
              <div className="h-2.5 w-3/4 rounded bg-[#F1EFE8]" />
              <div className="h-2.5 w-1/2 rounded bg-[#F1EFE8]" />
            </div>

            {/* Action button */}
            <div className="h-9 w-full rounded-lg bg-[#E8E6DE]" />
          </div>
        ))}
      </div>
    </div>
  )
}
