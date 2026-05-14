import { getSidebarStats } from '@/lib/data/sidebar-stats'

export async function RightSidebarMobile() {
  const { totalOrders, delivered, urgent, completionRate, totalCustomers, tailorRows } =
    await getSidebarStats()

  return (
    <div className="xl:hidden mt-6 pb-2">
      {/* Section label */}
      <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#888780] mb-3">
        Overview
      </p>

      {/* Completion + Urgent */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-xl p-3.5" style={{ border: '0.5px solid #D3D1C7' }}>
          <div className="flex items-baseline gap-0.5 leading-none">
            <span
              className="font-bold tracking-[-1.5px] leading-none text-[#2C2C2A]"
              style={{ fontSize: 32 }}
            >
              {completionRate}
            </span>
            <span className="text-lg font-medium text-[#888780]">%</span>
          </div>
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#888780] mt-1.5">
            Completion
          </p>
          <div
            className="mt-2 h-[3px] rounded-full overflow-hidden"
            style={{ background: '#F1EFE8' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${completionRate}%`, background: '#1D9E75' }}
            />
          </div>
        </div>

        <div
          className="rounded-xl p-3.5"
          style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1' }}
        >
          <div
            className="font-bold tracking-[-1.5px] leading-none"
            style={{ fontSize: 32, color: '#791F1F' }}
          >
            {urgent}
          </div>
          <p
            className="text-[9px] uppercase tracking-[0.08em] mt-1.5"
            style={{ color: '#A32D2D' }}
          >
            Urgent now
          </p>
        </div>
      </div>

      {/* Customers + Total orders */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-xl p-3.5" style={{ border: '0.5px solid #D3D1C7' }}>
          <div
            className="font-bold tracking-[-1.5px] leading-none text-[#2C2C2A]"
            style={{ fontSize: 32 }}
          >
            {totalCustomers}
          </div>
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#888780] mt-1.5">
            Customers
          </p>
        </div>
        <div className="bg-white rounded-xl p-3.5" style={{ border: '0.5px solid #D3D1C7' }}>
          <div
            className="font-bold tracking-[-1.5px] leading-none text-[#2C2C2A]"
            style={{ fontSize: 32 }}
          >
            {delivered}
          </div>
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#888780] mt-1.5">
            Delivered
          </p>
        </div>
      </div>

      {/* Tailor workload */}
      {tailorRows.length > 0 && (
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#888780] mb-2">
            Tailor Workload
          </p>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #D3D1C7' }}>
            {tailorRows.map((tailor, i) => (
              <div
                key={tailor.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: i < tailorRows.length - 1 ? '0.5px solid #F1EFE8' : 'none',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-[#5F5E5A]"
                  style={{ background: '#F1EFE8' }}
                >
                  {tailor.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#2C2C2A] leading-tight">
                    {tailor.full_name}
                  </p>
                  <p className="text-[10px] text-[#888780] leading-tight">
                    {tailor.activeCount} active
                  </p>
                </div>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: tailor.dotColor }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
