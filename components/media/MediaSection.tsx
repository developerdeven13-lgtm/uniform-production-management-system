'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload, X, Image as ImageIcon, Mic, Loader2,
  Trash2, Download, FileAudio, ZoomIn,
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
  const router = useRouter()
  const [media, setMedia] = useState<MediaWithUrl[]>(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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

  return (
    <div className="space-y-4">
      {/* Upload zone + voice recorder */}
      {canUpload && (
        <div className="space-y-3">
          {/* Drag & drop zone */}
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
                  Images (JPEG, PNG, WebP) · Audio files (MP3, WebM, WAV) · Max 10 MB / 25 MB
                </p>
              </>
            )}
          </div>

          {/* In-browser voice recorder */}
          <VoiceRecorder
            disabled={uploading}
            onUpload={async (file) => { await handleFiles([file]) }}
          />
        </div>
      )}

      {/* Images gallery */}
      {images.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Reference Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map(m => (
              <div
                key={m.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
              >
                {m.signedUrl ? (
                  <img
                    src={m.signedUrl}
                    alt={m.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {m.signedUrl && (
                    <button
                      onClick={() => setLightboxUrl(m.signedUrl)}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-slate-700 transition-colors"
                      title="View full size"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  )}
                  {m.signedUrl && (
                    <a
                      href={m.signedUrl}
                      download={m.file_name}
                      className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-slate-700 transition-colors"
                      title="Download"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m.id, m.file_name)}
                      disabled={deletingId === m.id}
                      className="p-1.5 bg-red-500 rounded-lg hover:bg-red-600 text-white transition-colors"
                      title="Delete"
                    >
                      {deletingId === m.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>

                {/* File name tooltip */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] text-white truncate">{m.file_name}</p>
                  <p className="text-[9px] text-white/60">{formatBytes(m.file_size_bytes)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice notes */}
      {voiceNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Notes ({voiceNotes.length})
          </h3>
          <div className="space-y-2">
            {voiceNotes.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileAudio className="w-5 h-5 text-purple-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{m.file_name}</p>
                  <p className="text-xs text-slate-400">
                    {formatBytes(m.file_size_bytes)}
                    {m.uploaderName && <span> · by {m.uploaderName}</span>}
                    {' · '}{formatRelativeTime(m.created_at)}
                  </p>
                  {m.signedUrl && (
                    <audio
                      controls
                      src={m.signedUrl}
                      className="mt-2 w-full h-8"
                      preload="none"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {m.signedUrl && (
                    <a
                      href={m.signedUrl}
                      download={m.file_name}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m.id, m.file_name)}
                      disabled={deletingId === m.id}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      {deletingId === m.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {media.length === 0 && !canUpload && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No media attached to this order.
        </div>
      )}

      {media.length === 0 && canUpload && (
        <p className="text-center text-xs text-slate-400">
          No files uploaded yet. Use the area above to add reference images or voice notes.
        </p>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
