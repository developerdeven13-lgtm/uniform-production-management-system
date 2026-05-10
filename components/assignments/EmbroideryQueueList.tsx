'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Layers, Calendar, CheckCircle, XCircle, Play, UserCheck } from 'lucide-react'
import { updateEmbroideryStatus, assignEmbroideryStaff } from '@/actions/embroidery'
import { formatDate } from '@/lib/utils/format-date'
import type { Profile } from '@/types/app.types'

interface EmbroideryItem {
  id: string
  status: string
  name_text: string | null
  placement: string | null
  special_instructions: string | null
  assigned_at: string | null
  assignee: { full_name: string } | null
  order_item: {
    has_embroidery: boolean
    order: {
      id: string
      order_number: string
      delivery_date: string | null
      customer: { full_name: string } | null
    } | null
  } | null
}

interface EmbroideryQueueListProps {
  queue: unknown[]
  embroideryStaff: Profile[]
}

function EmbroideryCard({ item, embroideryStaff }: { item: EmbroideryItem; embroideryStaff: Profile[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStaff, setSelectedStaff] = useState('')

  const order = item.order_item?.order

  const updateStatus = (status: 'in_progress' | 'completed' | 'rejected') => {
    startTransition(async () => {
      const result = await updateEmbroideryStatus(item.id, status)
      if (result.success) {
        toast.success(`Embroidery ${status === 'completed' ? 'marked complete' : status}`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleAssign = () => {
    if (!selectedStaff) return
    startTransition(async () => {
      const result = await assignEmbroideryStaff(item.id, selectedStaff)
      if (result.success) {
        toast.success('Embroidery staff assigned')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 font-mono text-sm">{order?.order_number}</p>
            <p className="text-xs text-slate-500">{order?.customer?.full_name}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          item.status === 'pending' ? 'bg-amber-100 text-amber-700' :
          item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {item.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        {item.name_text && (
          <p className="text-slate-700">
            <span className="font-medium text-slate-500">Name: </span>{item.name_text}
          </p>
        )}
        {item.placement && (
          <p className="text-slate-700">
            <span className="font-medium text-slate-500">Placement: </span>{item.placement}
          </p>
        )}
        {item.special_instructions && (
          <p className="text-slate-600 bg-amber-50 border border-amber-100 rounded px-2.5 py-1.5 text-xs">
            {item.special_instructions}
          </p>
        )}
        {order?.delivery_date && (
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due: {formatDate(order.delivery_date)}
          </p>
        )}
        {item.assignee && (
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Assigned to: {item.assignee.full_name}
          </p>
        )}
      </div>

      {/* Assign if pending and no assignee */}
      {item.status === 'pending' && !item.assignee && embroideryStaff.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedStaff}
            onChange={e => setSelectedStaff(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Assign to…</option>
            {embroideryStaff.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedStaff || isPending}
            className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            Assign
          </button>
        </div>
      )}

      {/* Status actions */}
      {item.status === 'in_progress' && (
        <div className="flex gap-2">
          <button
            onClick={() => updateStatus('completed')}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={isPending}
            className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {item.status === 'pending' && item.assignee && (
        <button
          onClick={() => updateStatus('in_progress')}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" />
          Start Embroidery
        </button>
      )}
    </div>
  )
}

export function EmbroideryQueueList({ queue, embroideryStaff }: EmbroideryQueueListProps) {
  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-14 text-center">
        <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Embroidery queue is empty.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {(queue as EmbroideryItem[]).map(item => (
        <EmbroideryCard key={item.id} item={item} embroideryStaff={embroideryStaff} />
      ))}
    </div>
  )
}
