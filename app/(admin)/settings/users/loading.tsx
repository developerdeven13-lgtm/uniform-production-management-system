export default function UsersLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div className="rounded-xl bg-[#D3D1C7]" style={{ width: 80, height: 64 }} />
          <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="h-2.5 w-10 rounded-full bg-[#E8E6DE]" />
            <div className="h-5 w-16 rounded bg-[#E0DDD4]" />
          </div>
        </div>
        <div className="h-9 w-24 rounded-[9px] bg-[#D3D1C7]" />
      </div>

      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 24, padding: '10px 18px', background: '#F7F5EE', borderBottom: '0.5px solid #F1EFE8' }}>
          {[2, 1, 1, 1].map((flex, i) => (
            <div key={i} style={{ flex }} className="h-2.5 w-16 rounded-full bg-[#E0DDD4]" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '13px 18px', borderBottom: i < 7 ? '0.5px solid #F1EFE8' : 'none' }}>
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="w-7 h-7 rounded-full bg-[#E8E6DE] shrink-0" />
              <div className="h-3.5 w-28 rounded bg-[#E0DDD4]" />
            </div>
            <div style={{ flex: 1 }}><div className="h-5 w-20 rounded-full bg-[#E8E6DE]" /></div>
            <div style={{ flex: 1 }}><div className="h-3 w-32 rounded bg-[#F1EFE8]" /></div>
            <div style={{ flex: 1 }}><div className="h-5 w-14 rounded-full bg-[#E8E6DE]" /></div>
            <div className="h-3 w-14 rounded bg-[#E8E6DE]" />
          </div>
        ))}
      </div>
    </div>
  )
}
