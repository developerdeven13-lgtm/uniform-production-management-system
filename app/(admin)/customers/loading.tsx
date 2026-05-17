export default function CustomersLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">

      {/* PageTitle skeleton */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div className="rounded-xl bg-[#D3D1C7]" style={{ width: 90, height: 72 }} />
          <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="h-2.5 w-10 rounded-full bg-[#E8E6DE]" />
            <div className="h-5 w-24 rounded bg-[#E0DDD4]" />
          </div>
        </div>
        <div className="h-9 w-28 rounded-[9px] bg-[#D3D1C7]" />
      </div>

      {/* Search */}
      <div
        className="h-11 rounded-[9px] bg-white"
        style={{ border: '0.5px solid #D3D1C7' }}
      />

      {/* Table */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #D3D1C7',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            padding: '10px 18px',
            borderBottom: '0.5px solid #F1EFE8',
            background: '#F7F5EE',
          }}
        >
          {['w-28', 'w-24', 'w-32', 'w-20', 'w-10'].map((w, i) => (
            <div
              key={i}
              className={`h-2.5 ${w} rounded-full bg-[#E0DDD4]`}
              style={{ flex: i < 4 ? '1 1 0' : '0 0 auto' }}
            />
          ))}
        </div>
        {/* 10 rows */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 18px',
              gap: 0,
              borderBottom: i < 9 ? '0.5px solid #F1EFE8' : 'none',
            }}
          >
            <div style={{ flex: '1 1 0' }}>
              <div className="h-3.5 w-32 rounded bg-[#E0DDD4]" />
            </div>
            <div style={{ flex: '1 1 0' }}>
              <div className="h-3 w-24 rounded bg-[#E8E6DE]" />
            </div>
            <div style={{ flex: '1 1 0' }}>
              <div className="h-3 w-28 rounded bg-[#F1EFE8]" />
            </div>
            <div style={{ flex: '1 1 0' }}>
              <div className="h-3 w-16 rounded bg-[#F1EFE8]" />
            </div>
            <div className="h-3 w-8 rounded bg-[#E8E6DE]" />
          </div>
        ))}
      </div>
    </div>
  )
}
