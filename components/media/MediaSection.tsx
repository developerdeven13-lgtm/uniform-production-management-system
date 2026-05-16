'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload, X, Image as ImageIcon, Mic, Loader2,
  Trash2, FileAudio, ZoomIn, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { uploadMedia, deleteMedia, getOrderMedia } from '@/actions/media'
import type { MediaWithUrl } from '@/actions/media'
import { formatRelativeTime } from '@/lib/utils/format-date'
import { cn } from '@/lib/utils/cn'
import { VoiceRecorder } from './VoiceRecorder'

interface MediaSectionProps {
  orderId: string
  initialMedia: MediaWithUrl[]
  canUpload: boolean
  canDelete: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ALLOWED_ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav',
].join(',')

export function MediaSection({
  orderId,
  initialMedia,
  canUpload,
  canDelete,
}: MediaSectionProps) {
  const [media, setMedia] = useState<MediaWithUrl[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const refreshMedia = useCallback(async () => {
    const result = await getOrderMedia(orderId)
    if (result.success) setMedia(result.data)
  }, [orderId])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploading(true)
    let successCount = 0

    for (const file of fileArray) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('order_id', orderId)
      formData.append('media_type', file.type.startsWith('audio/') ? 'voice_note' : 'image')

      const result = await uploadMedia(formData)
      if (result.success) {
        successCount++
      } else {
        toast.error(`${file.name}: ${result.error}`)
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`)
      await refreshMedia()
    }
    setUploading(false)
  }, [orderId, refreshMedia])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDelete = async (mediaId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return
    setDeletingId(mediaId)
    const result = await deleteMedia(mediaId)
    if (result.success) {
      setMedia(prev => prev.filter(m => m.id !== mediaId))
      toast.success('File deleted')
    } else {
      toast.error(result.error)
    }
    setDeletingId(null)
  }

  const images = media.filter(m => m.media_type === 'image')
  const voiceNotes = media.filter(m => m.media_type === 'voice_note')

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return
    const itemWidth = carouselRef.current.clientWidth * 0.75 + 12
    carouselRef.current.scrollBy({ left: dir === 'left' ? -itemWidth : itemWidth, behavior: 'smooth' })
  }

  const lightboxImages = images.filter(m => m.signedUrl)
  const activeLightboxImg = lightboxIndex !== null ? lightboxImages[lightboxIndex] : null

  return (
    <div className="space-y-5">
      {/* Upload zone + voice recorder */}
      {canUpload && (
        <div className="space-y-3">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              'border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
            )}
            onClick={() => document.getElementById(`file-input-${orderId}`)?.click()}
          >
            <input
              id={`file-input-${orderId}`}
              type="file"
              accept={ALLOWED_ACCEPT}
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#10b981' }} />
                <p className="text-sm font-medium" style={{ color: '#065f46' }}>Uploading…</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)' }}>
                    <ImageIcon className="w-5 h-5" style={{ color: '#059669' }} />
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)' }}>
                    <Upload className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Drop files here or <span style={{ color: '#059669' }}>click to browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Images (JPEG, PNG, WebP) · Audio (MP3, WebM, WAV) · Max 10 MB / 25 MB
                </p>
              </>
            )}
          </div>

          <VoiceRecorder
            disabled={uploading}
            onUpload={async (file) => { await handleFiles([file]) }}
          />
        </div>
      )}

      {/* Image carousel */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <ImageIcon className="w-3.5 h-3.5" />
              Reference Images
              <span style={{ fontWeight: 400, color: '#B4B2A9', textTransform: 'none', letterSpacing: 0 }}>({images.length})</span>
            </h3>
            {images.length > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: '#F7F5EE', border: '0.5px solid #D3D1C7', color: '#5F5E5A' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: '#F7F5EE', border: '0.5px solid #D3D1C7', color: '#5F5E5A' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((m, idx) => {
              const lightboxIdx = lightboxImages.findIndex(li => li.id === m.id)
              return (
                <div
                  key={m.id}
                  className="group relative shrink-0 rounded-xl overflow-hidden"
                  style={{
                    width: 'calc(75% - 6px)',
                    maxWidth: 240,
                    aspectRatio: '4/3',
                    scrollSnapAlign: 'start',
                    background: '#F1EFE8',
                    border: '0.5px solid #D3D1C7',
                    cursor: 'pointer',
                  }}
                  onClick={() => lightboxIdx >= 0 && setLightboxIndex(lightboxIdx)}
                >
                  {m.signedUrl ? (
                    <img
                      src={m.signedUrl}
                      alt={m.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8" style={{ color: '#D3D1C7' }} />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }}>
                    <div className="w-full flex items-center justify-between px-2 pb-2">
                      <div className="min-w-0 mr-2">
                        <p className="text-[10px] text-white truncate font-medium">{m.file_name}</p>
                        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{formatBytes(m.file_size_bytes)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {m.signedUrl && (
                          <button
                            className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors"
                            onClick={e => { e.stopPropagation(); lightboxIdx >= 0 && setLightboxIndex(lightboxIdx) }}
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white transition-colors"
                            style={{ background: 'rgba(163,45,45,0.85)' }}
                            onClick={e => { e.stopPropagation(); handleDelete(m.id, m.file_name) }}
                            disabled={deletingId === m.id}
                          >
                            {deletingId === m.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-medium tabular-nums" style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}>
                    {idx + 1}/{images.length}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1 mt-2">
              {images.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{ width: 5, height: 5, background: '#D3D1C7' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voice notes */}
      {voiceNotes.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 11, fontWeight: 600, color: '#5F5E5A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            <Mic className="w-3.5 h-3.5" />
            Voice Notes
            <span style={{ fontWeight: 400, color: '#B4B2A9', textTransform: 'none', letterSpacing: 0 }}>({voiceNotes.length})</span>
          </h3>
          <div className="space-y-2">
            {voiceNotes.map(m => (
              <div
                key={m.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '0.5px solid #D3D1C7', background: '#FAFAF8' }}
              >
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: m.signedUrl ? '0.5px solid #F1EFE8' : undefined }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#EEEDFE' }}
                  >
                    <FileAudio className="w-4 h-4" style={{ color: '#3C3489' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#2C2C2A' }}>{m.file_name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#888780' }}>
                      {formatBytes(m.file_size_bytes)}
                      {m.uploaderName && <span> · {m.uploaderName}</span>}
                      {' · '}{formatRelativeTime(m.created_at)}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m.id, m.file_name)}
                      disabled={deletingId === m.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      style={{ color: '#888780' }}
                      title="Delete"
                    >
                      {deletingId === m.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  )}
                </div>

                {/* Audio player */}
                {m.signedUrl && (
                  <div className="px-3 py-2.5">
                    <audio
                      controls
                      src={m.signedUrl}
                      className="w-full"
                      style={{ height: 32 }}
                      preload="none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty states */}
      {media.length === 0 && !canUpload && (
        <div className="text-center py-8" style={{ color: '#B4B2A9', fontSize: 13 }}>
          No media attached to this order.
        </div>
      )}
      {media.length === 0 && canUpload && (
        <p className="text-center text-xs" style={{ color: '#B4B2A9' }}>
          No files uploaded yet. Use the area above to add reference images or voice notes.
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && activeLightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          {lightboxImages.length > 1 && lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i - 1 : 0) }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next */}
          {lightboxImages.length > 1 && lightboxIndex < lightboxImages.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => i !== null ? i + 1 : 0) }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <img
            src={activeLightboxImg.signedUrl!}
            alt={activeLightboxImg.file_name}
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
            onClick={e => e.stopPropagation()}
          />

          {/* Counter */}
          {lightboxImages.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium tabular-nums"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
