'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Flag, CheckCircle, Clock, AlertTriangle, Mic, Image as ImageIcon, ChevronDown, ChevronUp, X } from 'lucide-react'
import { updateFlagStatus } from '@/actions/flags'
import { formatDateTime } from '@/lib/utils/format-date'
import type { OrderFlag, FlagStatus } from '@/types/app.types'

const STATUS_CONFIG: Record<FlagStatus, { label: string; bg: string; color: string; border: string }> = {
  open:         { label: 'Open',         bg: '#FCEBEB', color: '#791F1F', border: '#F7C1C1' },
  acknowledged: { label: 'Acknowledged', bg: '#FAEEDA', color: '#633806', border: '#F5D199' },
  resolved:     { label: 'Resolved',     bg: '#E1F5EE', color: '#085041', border: '#A0DEC5' },
}

function FlagMediaPlayer({ url, type, name }: { url: string; type: string; name: string }) {
  const [lightbox, setLightbox] = useState(false)

  if (type === 'voice_note') {
    return (
      <div style={{ background: '#F7F5EE', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mic style={{ width: 14, height: 14, color: '#888780', flexShrink: 0 }} />
        <audio controls src={url} style={{ height: 28, flex: 1, maxWidth: 200 }} />
      </div>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setLightbox(true)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
        <img
          src={url}
          alt={name}
          style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '0.5px solid #D3D1C7' }}
        />
      </button>
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(false)}
        >
          <button type="button" onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X style={{ width: 24, height: 24 }} />
          </button>
          <img src={url} alt={name} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}
    </>
  )
}

function FlagCard({ flag, canResolve }: { flag: OrderFlag; canResolve: boolean }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [resolutionNote, setResolutionNote] = useState('')
  const [showResolveForm, setShowResolveForm] = useState(false)

  const statusConf = STATUS_CONFIG[flag.status]

  const handleAcknowledge = () => {
    startTransition(async () => {
      const res = await updateFlagStatus(flag.id, 'acknowledged')
      if (res.success) { toast.success('Flag acknowledged'); router.refresh() }
      else toast.error(res.error)
    })
  }

  const handleResolve = () => {
    startTransition(async () => {
      const res = await updateFlagStatus(flag.id, 'resolved', resolutionNote)
      if (res.success) { toast.success('Flag resolved'); setShowResolveForm(false); router.refresh() }
      else toast.error(res.error)
    })
  }

  const images = (flag.media ?? []).filter(m => m.media_type === 'image')
  const voices = (flag.media ?? []).filter(m => m.media_type === 'voice_note')

  return (
    <div style={{ background: '#fff', border: '0.5px solid #D3D1C7', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A' }}>{flag.title}</span>
            <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: statusConf.bg, color: statusConf.color, border: `0.5px solid ${statusConf.border}` }}>
              {statusConf.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#888780', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flag style={{ width: 10, height: 10 }} />
              {flag.raiser?.full_name ?? '—'}
            </span>
            <span>{formatDateTime(flag.created_at)}</span>
            {images.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ImageIcon style={{ width: 10, height: 10 }} />{images.length}</span>}
            {voices.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mic style={{ width: 10, height: 10 }} />{voices.length}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp style={{ width: 16, height: 16, color: '#888780', flexShrink: 0 }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#888780', flexShrink: 0 }} />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '0.5px solid #F1EFE8' }}>
          {flag.description && (
            <p style={{ fontSize: 13, color: '#5F5E5A', lineHeight: 1.6, margin: '12px 0' }}>
              {flag.description}
            </p>
          )}

          {/* Voice notes */}
          {voices.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 6 }}>Voice Notes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {voices.map(m => (
                  <FlagMediaPlayer key={m.id} url={m.signedUrl ?? ''} type={m.media_type} name={m.file_name} />
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888780', marginBottom: 6 }}>Photos</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {images.map(m => (
                  <FlagMediaPlayer key={m.id} url={m.signedUrl ?? ''} type={m.media_type} name={m.file_name} />
                ))}
              </div>
            </div>
          )}

          {/* Resolution note */}
          {flag.status === 'resolved' && flag.resolution_note && (
            <div style={{ background: '#E1F5EE', border: '0.5px solid #A0DEC5', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Resolution</p>
              <p style={{ fontSize: 12, color: '#0f2416' }}>{flag.resolution_note}</p>
              {flag.resolver && <p style={{ fontSize: 11, color: '#888780', marginTop: 4 }}>— {flag.resolver.full_name}</p>}
            </div>
          )}

          {/* Actions */}
          {canResolve && flag.status !== 'resolved' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {flag.status === 'open' && (
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '0.5px solid #F5D199', background: '#FAEEDA', color: '#633806', cursor: 'pointer' }}
                >
                  <Clock style={{ width: 12, height: 12 }} /> Acknowledge
                </button>
              )}
              {!showResolveForm ? (
                <button
                  type="button"
                  onClick={() => setShowResolveForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '0.5px solid #A0DEC5', background: '#E1F5EE', color: '#085041', cursor: 'pointer' }}
                >
                  <CheckCircle style={{ width: 12, height: 12 }} /> Mark Resolved
                </button>
              ) : (
                <div style={{ width: '100%' }}>
                  <textarea
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Resolution note (optional)…"
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #D3D1C7', fontSize: 12, color: '#2C2C2A', background: '#F7F5EE', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={handleResolve} disabled={isPending} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#0f2416', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Confirm Resolve
                    </button>
                    <button type="button" onClick={() => setShowResolveForm(false)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, background: '#F1EFE8', color: '#5F5E5A', border: '0.5px solid #D3D1C7', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface FlagListProps {
  flags: OrderFlag[]
  canResolve: boolean
}

export function FlagList({ flags, canResolve }: FlagListProps) {
  const openFlags = flags.filter(f => f.status !== 'resolved')
  const resolvedFlags = flags.filter(f => f.status === 'resolved')

  if (flags.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#888780' }}>No flags raised on this order.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {openFlags.map(f => <FlagCard key={f.id} flag={f} canResolve={canResolve} />)}
      {resolvedFlags.length > 0 && openFlags.length > 0 && (
        <div style={{ height: '0.5px', background: '#F1EFE8', margin: '4px 0' }} />
      )}
      {resolvedFlags.map(f => <FlagCard key={f.id} flag={f} canResolve={canResolve} />)}
    </div>
  )
}
