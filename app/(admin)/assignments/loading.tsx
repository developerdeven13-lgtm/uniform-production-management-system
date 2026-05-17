export default function AssignmentsLoading() {
  return (
    <div className="space-y-5 max-w-7xl animate-pulse">

      {/* PageTitle skeleton */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        <div className="rounded-xl bg-[#D3D1C7]" style={{ width: 90, height: 72 }} />
        <div style={{ paddingBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div className="h-2.5 w-14 rounded-full bg-[#E8E6DE]" />
          <div className="h-5 w-28 rounded bg-[#E0DDD4]" />
        </div>
      </div>

      {/* Section label */}
      <div className="h-2.5 w-40 rounded-full bg-[#E8E6DE]" />

      {/* Glass-style assignment cards */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(14px)',
            border: '0.5px solid rgba(255,255,255,0.75)',
            borderRadius: 14,
            boxShadow: '0 2px 12px rgba(15,36,22,0.06)',
            padding: '16px 20px',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {/* Icon blob */}
              <div
                className="shrink-0 bg-[#E8E6DE] rounded-lg"
                style={{ width: 36, height: 36 }}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-20 rounded bg-[#D3D1C7]" />
                  {i % 3 === 0 && <div className="h-4 w-12 rounded-full bg-[#F7C1C1]" />}
                </div>
                <div className="h-3 w-36 rounded bg-[#E8E6DE]" />
                <div className="h-2.5 w-24 rounded bg-[#F1EFE8]" />
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:block h-2.5 w-16 rounded bg-[#E8E6DE]" />
              <div className="h-4 w-4 rounded bg-[#E8E6DE]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
