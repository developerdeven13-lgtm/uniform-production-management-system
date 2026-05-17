export default function SettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl animate-pulse">
      {/* Header */}
      <div>
        <div className="h-10 w-32 rounded-xl bg-[#D3D1C7] mb-3" />
        <div className="h-3 w-64 rounded-full bg-[#E8E6DE]" />
      </div>

      {/* Groups */}
      {[3, 3].map((count, gi) => (
        <div key={gi}>
          <div className="h-2.5 w-16 rounded-full bg-[#E8E6DE] mb-3" />
          <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: i < count - 1 ? '0.5px solid #F1EFE8' : 'none' }}
              >
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8E6DE] shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 w-32 rounded bg-[#E0DDD4] mb-2" />
                  <div className="h-3 w-48 rounded bg-[#F1EFE8]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
