'use client'

import React, { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Flag, X, Mic, Square, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react'
import { raiseFlag } from '@/actions/flags'

interface Props {
  orderId: string
  orderItemId?: string
  orderNumber: string
  itemLabel?: string
}

export function RaiseFlagModal({ orderId, orderItemId, orderNumber, itemLabel }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)

  // Voice recording
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const imageInputRef = useRef<HTMLInputElement>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setVoiceBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages(prev => [...prev, ...files].slice(0, 5))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Please enter a title'); return }

    startTransition(async () => {
      const fd = new FormData()
      fd.append('order_id', orderId)
      if (orderItemId) fd.append('order_item_id', orderItemId)
      fd.append('title', title.trim())
      fd.append('description', description.trim())

      images.forEach(f => fd.append('media', f))
      if (voiceBlob) {
        fd.append('media', new File([voiceBlob], 'voice-note.webm', { type: 'audio/webm' }))
      }

      const result = await raiseFlag(fd)
      if (result.success) {
        toast.success('Flag raised — admins have been notified')
        setOpen(false)
        setTitle(''); setDescription(''); setImages([]); setVoiceBlob(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 12px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 500,
          border: '0.5px solid #F7C1C1',
          background: '#FCEBEB',
          color: '#791F1F',
          cursor: 'pointer',
        }}
      >
        <Flag style={{ width: 11, height: 11 }} />
        Raise Flag
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(15,36,22,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 24px 64px rgba(15,36,22,0.18)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '0.5px solid #F1EFE8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle style={{ width: 15, height: 15, color: '#791F1F' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f2416' }}>Raise Flag</p>
                  <p style={{ fontSize: 11, color: '#888780' }}>
                    {orderNumber}{itemLabel ? ` · ${itemLabel}` : ''}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={{ color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Issue Title *
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Measurements missing, Wrong fabric colour…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '0.5px solid #D3D1C7', fontSize: 13, color: '#2C2C2A', background: '#F7F5EE', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue in more detail…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '0.5px solid #D3D1C7', fontSize: 13, color: '#2C2C2A', background: '#F7F5EE', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Media */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {/* Image upload */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 10, border: '0.5px dashed #D3D1C7', background: '#F7F5EE', cursor: 'pointer', fontSize: 11, color: '#5F5E5A' }}
                >
                  <ImageIcon style={{ width: 18, height: 18, color: '#888780' }} />
                  {images.length > 0 ? `${images.length} photo${images.length > 1 ? 's' : ''}` : 'Add Photos'}
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />

                {/* Voice note */}
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '12px 8px', borderRadius: 10, border: '0.5px dashed',
                    borderColor: recording ? '#F7C1C1' : '#D3D1C7',
                    background: recording ? '#FCEBEB' : voiceBlob ? '#E1F5EE' : '#F7F5EE',
                    cursor: 'pointer', fontSize: 11,
                    color: recording ? '#791F1F' : voiceBlob ? '#085041' : '#5F5E5A',
                  }}
                >
                  {recording
                    ? <Square style={{ width: 18, height: 18 }} />
                    : <Mic style={{ width: 18, height: 18, color: recording ? '#791F1F' : voiceBlob ? '#1D9E75' : '#888780' }} />
                  }
                  {recording ? 'Stop' : voiceBlob ? 'Re-record' : 'Voice Note'}
                </button>
              </div>

              {/* Image previews */}
              {images.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img
                        src={URL.createObjectURL(img)}
                        alt=""
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '0.5px solid #D3D1C7' }}
                      />
                      <button
                        type="button"
                        onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#2C2C2A', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X style={{ width: 10, height: 10 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 16px', borderRadius: 10, background: isPending || !title.trim() ? '#D3D1C7' : '#791F1F', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: isPending || !title.trim() ? 'not-allowed' : 'pointer' }}
              >
                {isPending ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Flag style={{ width: 14, height: 14 }} />}
                {isPending ? 'Submitting…' : 'Submit Flag'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
