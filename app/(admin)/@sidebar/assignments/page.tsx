import { getTailorWorkload } from '@/actions/assignments'
import { TailorWorkloadCard } from '@/components/assignments/TailorWorkloadCard'
import { RightSidebar } from '@/components/layout/RightSidebar'

export default async function AssignmentsSidebar() {
  const workloadResult = await getTailorWorkload()
  const workload = workloadResult.success ? workloadResult.data : []

  if (!workload || workload.length === 0) return <RightSidebar />

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full gap-3">
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#888780',
        }}
      >
        Tailor Workload
      </p>
      {workload.map(({ tailor, activeCount, completedCount }) => (
        <TailorWorkloadCard
          key={tailor.id}
          tailor={tailor}
          activeCount={activeCount}
          completedCount={completedCount}
        />
      ))}
    </div>
  )
}
