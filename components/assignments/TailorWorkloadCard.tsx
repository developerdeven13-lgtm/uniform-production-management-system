import type { Profile } from '@/types/app.types'
import { ROLE_LABELS } from '@/lib/permissions/roles'
import { cn } from '@/lib/utils/cn'

interface TailorWorkloadCardProps {
  tailor: Profile
  activeCount: number
  completedCount: number
  selected?: boolean
  onClick?: () => void
}

export function TailorWorkloadCard({
  tailor,
  activeCount,
  completedCount,
  selected,
  onClick,
}: TailorWorkloadCardProps) {
  const load = activeCount === 0 ? 'free' : activeCount <= 3 ? 'moderate' : 'busy'
  const loadColor = {
    free: 'text-green-600 bg-green-50 border-green-200',
    moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    busy: 'text-red-600 bg-red-50 border-red-200',
  }[load]
  const loadLabel = { free: 'Available', moderate: 'Moderate', busy: 'Busy' }[load]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all',
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-sm font-bold text-slate-600">
            {tailor.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">{tailor.full_name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[tailor.role]}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${loadColor}`}>
          {loadLabel}
        </span>
      </div>
      <div className="flex gap-4 mt-3">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{activeCount}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-400">{completedCount}</p>
          <p className="text-xs text-slate-500">Done</p>
        </div>
      </div>
    </button>
  )
}
