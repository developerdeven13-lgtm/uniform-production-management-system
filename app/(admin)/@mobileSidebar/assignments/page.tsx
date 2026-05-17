import { getTailorWorkload } from '@/actions/assignments'
import { TailorWorkloadCard } from '@/components/assignments/TailorWorkloadCard'

export default async function AssignmentsMobileSidebar() {
  const workloadResult = await getTailorWorkload()
  const workload = workloadResult.success ? workloadResult.data : []

  if (!workload || workload.length === 0) return null

  return (
    <div className="xl:hidden mt-6 pb-2">
      <p
        style={{
          fontSize: 9,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#888780',
          marginBottom: 10,
        }}
      >
        Tailor Workload
      </p>
      {/* Height-capped list with scroll so it doesn't dominate the mobile view */}
      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
        {workload.map(({ tailor, activeCount, completedCount }) => (
          <TailorWorkloadCard
            key={tailor.id}
            tailor={tailor}
            activeCount={activeCount}
            completedCount={completedCount}
          />
        ))}
      </div>
    </div>
  )
}
