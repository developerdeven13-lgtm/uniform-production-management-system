export default function UserDetailLoading() {
  return (
    <div className="max-w-2xl animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* User card skeleton */}
      <div>
        <div className="h-3 w-24 rounded bg-[#E8E6DE] mb-4" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="w-[52px] h-[52px] rounded-full bg-[#D3D1C7] shrink-0" />
          <div>
            <div className="h-5 w-36 rounded bg-[#D3D1C7] mb-2" />
            <div className="h-3 w-48 rounded bg-[#E8E6DE]" />
          </div>
        </div>
      </div>

      {/* Edit form skeleton */}
      <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: '0.5px solid #F1EFE8' }}>
            <div className="h-2.5 w-16 rounded-full bg-[#E8E6DE] mb-2" />
            <div className="h-4 w-32 rounded bg-[#E0DDD4]" />
          </div>
        ))}
      </div>

      {/* Permissions skeleton */}
      <div>
        <div className="h-2.5 w-24 rounded-full bg-[#E8E6DE] mb-3" />
        {[...Array(3)].map((_, gi) => (
          <div key={gi} style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ padding: '10px 16px', background: '#F7F5EE', borderBottom: '0.5px solid #F1EFE8' }}>
              <div className="h-2.5 w-20 rounded-full bg-[#E0DDD4]" />
            </div>
            {[...Array(4)].map((_, pi) => (
              <div key={pi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: pi < 3 ? '0.5px solid #F1EFE8' : 'none' }}>
                <div>
                  <div className="h-3.5 w-32 rounded bg-[#E0DDD4] mb-1.5" />
                  <div className="h-2.5 w-24 rounded bg-[#F1EFE8]" />
                </div>
                <div className="w-[42px] h-6 rounded-full bg-[#E8E6DE]" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
