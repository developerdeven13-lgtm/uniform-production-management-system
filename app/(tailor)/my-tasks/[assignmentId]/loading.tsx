export default function TaskDetailLoading() {
  return (
    <div className="max-w-2xl animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Back link */}
      <div className="h-3 w-16 rounded bg-[#E8E6DE]" />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(140deg, #14321e 0%, #0f2416 100%)', borderRadius: 18, padding: '22px 24px' }}>
        <div className="h-10 w-44 rounded-xl bg-white/10 mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-28 rounded-full bg-white/10" />
          <div className="h-6 w-16 rounded-full bg-white/10" />
        </div>
        <div className="h-4 w-32 rounded bg-white/10" />
      </div>

      {/* Action buttons */}
      <div className="h-12 w-full rounded-[10px] bg-[#E0DDD4]" />

      {/* Media card */}
      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '0.5px solid #F1EFE8' }}>
          <div className="h-3 w-40 rounded bg-[#E8E6DE]" />
        </div>
        <div style={{ padding: '16px 18px' }}>
          <div className="h-10 w-full rounded-lg bg-[#F1EFE8] mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-[#E8E6DE]" />
            ))}
          </div>
        </div>
      </div>

      {/* Measurements */}
      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '0.5px solid #F1EFE8' }}>
          <div className="h-3 w-28 rounded bg-[#E8E6DE]" />
        </div>
        <div className="grid grid-cols-4 gap-px bg-[#D3D1C7]">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ padding: '14px 6px', background: '#F7F5EE', textAlign: 'center' }}>
              <div className="h-2 w-12 rounded mx-auto bg-[#E8E6DE] mb-2" />
              <div className="h-6 w-8 rounded mx-auto bg-[#D3D1C7]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
