export default function MyTasksLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">
      {/* PageTitle */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <div className="rounded-xl bg-[#D3D1C7]" style={{ width: 72, height: 60 }} />
        <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="h-2.5 w-12 rounded-full bg-[#E8E6DE]" />
          <div className="h-5 w-16 rounded bg-[#E0DDD4]" />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #F1EFE8' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 rounded bg-[#D3D1C7]" />
                <div className="h-5 w-16 rounded-full bg-[#E8E6DE]" />
              </div>
              <div className="h-3 w-32 rounded bg-[#E8E6DE]" />
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div className="h-3.5 w-40 rounded bg-[#E0DDD4] mb-2" />
              <div className="h-3 w-24 rounded bg-[#F1EFE8]" />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '0.5px solid #F1EFE8' }}>
              <div className="h-9 w-full rounded-[9px] bg-[#E8E6DE]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
