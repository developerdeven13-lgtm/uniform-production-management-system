export default function OrdersLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">

      {/* PageTitle skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div className="rounded-xl bg-[#D3D1C7]" style={{ width: 90, height: 72 }} />
          <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="h-2.5 w-10 rounded-full bg-[#E8E6DE]" />
            <div className="h-5 w-20 rounded bg-[#E0DDD4]" />
          </div>
        </div>
        <div className="h-9 w-28 rounded-[9px] bg-[#D3D1C7]" />
      </div>

      {/* Search + filters card */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #D3D1C7',
          borderRadius: 14,
          padding: '14px 16px',
        }}
      >
        {/* Search bar */}
        <div className="h-10 rounded-[9px] bg-[#F1EFE8] mb-3" />
        {/* Filter chips */}
        <div className="flex gap-2">
          {[40, 56, 16, 72, 64, 80, 68].map((w, i) => (
            <div
              key={i}
              className="h-6 rounded-full bg-[#E8E6DE] shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #D3D1C7',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '10px 18px',
            background: '#F7F5EE',
            borderBottom: '0.5px solid #F1EFE8',
          }}
        >
          {['w-14', 'w-28', 'w-20', 'w-6', 'w-20', 'w-20'].map((w, i) => (
            <div key={i} className={`h-2.5 ${w} rounded-full bg-[#E0DDD4]`} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: '13px 18px',
              borderBottom: i < 9 ? '0.5px solid #F1EFE8' : 'none',
            }}
          >
            {/* Order # */}
            <div className="w-14 space-y-1.5">
              <div className="h-3.5 w-14 rounded bg-[#E0DDD4]" />
            </div>
            {/* Customer */}
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[#E0DDD4]" />
              <div className="h-2.5 w-20 rounded bg-[#F1EFE8]" />
            </div>
            {/* Status */}
            <div className="h-5 w-20 rounded-full bg-[#E8E6DE]" />
            {/* Items */}
            <div className="h-3 w-6 rounded bg-[#E8E6DE]" />
            {/* Delivery */}
            <div className="h-3 w-20 rounded bg-[#F1EFE8]" />
            {/* Created */}
            <div className="h-3 w-20 rounded bg-[#F1EFE8]" />
          </div>
        ))}
      </div>
    </div>
  )
}
