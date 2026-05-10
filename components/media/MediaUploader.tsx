'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, X, Image as ImageIcon, Mic, Loader2, CheckCircle } from 'lucide-react'
import { uploadMedia } from '@/actions/media'
import type { MediaAttachment } from '@/types/app.types'

interface MediaUploaderProps {
  orderId?: string
  orderItemId?: string
  onUploaded?: (attachment: MediaAttachment) => void
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

interface QueuedFile {
  file: File
  preview?: string
  state: UploadState
  error?: string
}

export function MediaUploader({ orderId, orderItemId, onUploaded }: MediaUploaderProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav',
  ].join(',')

  const enqueue = useCallback((files: FileList | File[]) => {
    const newItems: QueuedFile[] = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      state: 'idle',
    }))
    setQueue(prev => [...prev, ...newItems])
    newItems.forEach((_, i) => uploadFile(queue.length + i, newItems[i]!.file))
  }, [queue.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFile = async (index: number, file: File) => {
    setQueue(prev => prev.map((q, i) => i === index ? { ...q, state: 'uploading' } : q))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('media_type', file.type.startsWith('audio/') ? 'voice_note' : 'image')
    if (orderId) formData.append('order_id', orderId)
    if (orderItemId) formData.append('order_item_id', orderItemId)

    const result = await uploadMedia(formData)

    if (result.success) {
      setQueue(prev => prev.map((q, i) => i === index ? { ...q, state: 'done' } : q))
      onUploaded?.(result.data)
      toast.success(`${file.name} uploaded`)
    } else {
      setQueue(prev => prev.map((q, i) => i === index ? { ...q, state: 'error', error: result.error } : q))
      toast.error(result.error)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) enqueue(e.dataTransfer.files)
  }

  const remove = (i: number) => {
    setQueue(prev => {
      const item = prev[i]
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">Drop files here or click to browse</p>
        <p className="text-xs text-slate-500 mt-1">Images (JPEG, PNG, WebP) · Voice notes (MP3, WebM) · Max 10MB / 25MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={e => e.target.files && enqueue(e.target.files)}
        />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white">
              {item.preview ? (
                <img src={item.preview} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5 text-slate-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{item.file.name}</p>
                <p className="text-xs text-slate-500">
                  {(item.file.size / 1024).toFixed(0)}KB
                  {item.state === 'error' && (
                    <span className="text-red-600 ml-2">{item.error}</span>
                  )}
                </p>
              </div>

              <div className="shrink-0">
                {item.state === 'uploading' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                {item.state === 'done' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {(item.state === 'idle' || item.state === 'error') && (
                  <button onClick={e => { e.stopPropagation(); remove(i) }} className="p-1 text-slate-400 hover:text-red-500 rounded">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
