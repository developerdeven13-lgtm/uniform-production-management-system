export default function DashboardLoading() {
  return (
    <div className="max-w-7xl w-full animate-pulse">

      {/* Hero stat */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 4 }}>
        <div
          className="rounded-xl bg-[#D3D1C7]"
          style={{ width: 120, height: 86, borderRadius: 12 }}
        />
        <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="h-2.5 w-16 rounded-full bg-[#E8E6DE]" />
          <div className="h-6 w-28 rounded bg-[#E0DDD4]" />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '0.5px', background: '#D3D1C7', margin: '16px 0' }} />

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '0.5px solid #D3D1C7',
          marginBottom: 24,
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              padding: '16px 0',
              paddingLeft: i > 0 ? 16 : 0,
              borderRight: i < 2 ? '0.5px solid #D3D1C7' : 'none',
            }}
          >
            <div className="h-8 w-12 rounded bg-[#D3D1C7] mb-2" />
            <div className="h-2.5 w-16 rounded-full bg-[#E8E6DE] mb-1" />
            <div className="h-2.5 w-12 rounded-full bg-[#F1EFE8]" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Recent orders card */}
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
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '0.5px solid #F1EFE8',
            }}
          >
            <div className="h-2.5 w-24 rounded-full bg-[#E8E6DE]" />
            <div className="h-2.5 w-14 rounded-full bg-[#F1EFE8]" />
          </div>
          {/* 5 skeleton rows */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                padding: '11px 18px',
                borderBottom: i < 4 ? '0.5px solid #F1EFE8' : 'none',
                gap: 10,
              }}
            >
              <div>
                <div className="h-3.5 w-24 rounded bg-[#E0DDD4] mb-1.5" />
                <div className="h-2.5 w-16 rounded bg-[#F1EFE8]" />
              </div>
              <div className="h-5 w-20 rounded-full bg-[#E8E6DE]" />
              <div className="h-2.5 w-16 rounded bg-[#F1EFE8]" />
            </div>
          ))}
        </div>

        {/* Pipeline card */}
        <div
          style={{
            background: '#fff',
            border: '0.5px solid #D3D1C7',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '0.5px solid #F1EFE8',
            }}
          >
            <div className="h-2.5 w-28 rounded-full bg-[#E8E6DE]" />
            <div className="h-2.5 w-20 rounded-full bg-[#F1EFE8]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8" style={{ padding: '20px 24px' }}>
            {[0, 1].map(col => (
              <div key={col} className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Circle + line */}
                    <div className="flex flex-col items-center shrink-0 w-10">
                      <div className="w-10 h-10 rounded-full bg-[#E8E6DE]" />
                      {i < 3 && <div className="w-0.5 flex-1 my-1 bg-[#F1EFE8]" style={{ minHeight: 24 }} />}
                    </div>
                    {/* Text */}
                    <div style={{ paddingTop: 4, paddingBottom: i < 3 ? 24 : 0 }}>
                      <div className="h-2 w-16 rounded-full bg-[#F1EFE8] mb-2" />
                      <div className="h-8 w-10 rounded bg-[#E0DDD4]" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
