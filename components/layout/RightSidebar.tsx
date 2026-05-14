import { getSidebarStats } from '@/lib/data/sidebar-stats'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#888780] mb-2.5">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-4" style={{ height: '0.5px', background: '#F1EFE8' }} />
}

export async function RightSidebar() {
  const { totalOrders, delivered, urgent, completionRate, totalCustomers, tailorRows } =
    await getSidebarStats()

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">

      {/* Completion */}
      <div>
        <Label>Completion</Label>
        <div className="flex items-baseline gap-1 leading-none">
          <span
            className="font-bold tracking-[-2px] leading-none text-[#2C2C2A]"
            style={{ fontSize: 44 }}
          >
            {completionRate}
          </span>
          <span className="text-2xl font-medium text-[#888780]">%</span>
        </div>
        <p className="text-[10px] text-[#888780] mt-1">
          {delivered} of {totalOrders} delivered
        </p>
        <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: '#F1EFE8' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${completionRate}%`, background: '#1D9E75' }}
          />
        </div>
      </div>

      <Divider />

      {/* Urgent */}
      <div>
        <Label>Urgent</Label>
        <div
          className="rounded-[10px] p-3"
          style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1' }}
        >
          <div
            className="font-bold tracking-[-2px] leading-none"
            style={{ fontSize: 36, color: '#791F1F' }}
          >
            {urgent}
          </div>
          <p
            className="text-[9px] font-medium uppercase tracking-[0.1em] mt-1"
            style={{ color: '#A32D2D' }}
          >
            Orders need<br />attention now
          </p>
        </div>
      </div>

      <Divider />

      {/* Customers */}
      <div>
        <Label>Customers</Label>
        <div
          className="font-bold tracking-[-1.5px] leading-none text-[#2C2C2A]"
          style={{ fontSize: 36 }}
        >
          {totalCustomers}
        </div>
        <p className="text-[10px] text-[#888780] mt-1">Registered clients</p>
      </div>

      <Divider />

      {/* Tailor workload */}
      <div className="flex-1">
        <Label>Tailor Workload</Label>
        {tailorRows.length === 0 ? (
          <p className="text-[10px] text-[#888780]">No tailors found</p>
        ) : (
          <div>
            {tailorRows.map((tailor, i) => (
              <div
                key={tailor.id}
                className="flex items-center gap-2 py-2"
                style={{
                  borderBottom: i < tailorRows.length - 1 ? '0.5px solid #F1EFE8' : 'none',
                }}
              >
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-[#5F5E5A]"
                  style={{ background: '#F1EFE8' }}
                >
                  {tailor.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#2C2C2A] truncate leading-tight">
                    {tailor.full_name.split(' ')[0]}
                  </p>
                  <p className="text-[9px] text-[#888780] leading-tight">
                    {tailor.activeCount} active
                  </p>
                </div>
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: tailor.dotColor }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
