import type { Profile } from '@/types/app.types'
import { ROLE_LABELS } from '@/lib/permissions/roles'

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
  const loadStyle = {
    free:     { background: '#E1F5EE', color: '#085041' },
    moderate: { background: '#FAEEDA', color: '#633806' },
    busy:     { background: '#FCEBEB', color: '#791F1F' },
  }[load]
  const dotColor = {
    free: '#1D9E75',
    moderate: '#EF9F27',
    busy: '#E24B4A',
  }[load]
  const loadLabel = { free: 'Available', moderate: 'Moderate', busy: 'Busy' }[load]

  const initials = tailor.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px',
        borderRadius: 12,
        border: selected ? '1.5px solid #0f2416' : '0.5px solid #D3D1C7',
        background: selected ? '#F1EFE8' : '#fff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#5F5E5A', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2A' }}>{tailor.full_name}</p>
            <p style={{ fontSize: 10, color: '#888780' }}>{ROLE_LABELS[tailor.role]}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 500, padding: '3px 8px', borderRadius: 99, ...loadStyle }}>
            {loadLabel}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#2C2C2A', lineHeight: 1 }}>{activeCount}</p>
          <p style={{ fontSize: 10, color: '#888780', marginTop: 2 }}>Active</p>
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#888780', lineHeight: 1 }}>{completedCount}</p>
          <p style={{ fontSize: 10, color: '#888780', marginTop: 2 }}>Done</p>
        </div>
      </div>
    </button>
  )
}
