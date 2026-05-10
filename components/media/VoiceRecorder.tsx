'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Trash2, Upload, Loader2 } from 'lucide-react'

interface VoiceRecorderProps {
  onUpload: (file: File) => Promise<void>
  disabled?: boolean
}

type RecordingState = 'idle' | 'recording' | 'preview'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function VoiceRecorder({ onUpload, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(recorded)
        setBlob(recorded)
        setAudioUrl(url)
        setState('preview')
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start(100)
      setState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch {
      setError('Microphone access denied. Allow microphone access in your browser and try again.')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    mediaRecorderRef.current?.stop()
  }

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setState('idle')
  }

  const handleUpload = async () => {
    if (!blob) return
    setIsUploading(true)
    try {
      const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
      const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: blob.type })
      await onUpload(file)
      discard()
    } finally {
      setIsUploading(false)
    }
  }

  if (state === 'idle') {
    return (
      <div className="space-y-1.5">
        <button
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.3)', color: '#065f46' }}
        >
          <Mic className="w-4 h-4" />
          Record Voice Note
        </button>
        {error && (
          <p className="text-xs text-red-500 max-w-sm">{error}</p>
        )}
      </div>
    )
  }

  if (state === 'recording') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-700">Recording</span>
        </div>
        <span className="font-mono text-sm text-red-600 tabular-nums">{formatDuration(duration)}</span>
        <div className="flex-1" />
        <button
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Square className="w-3 h-3 fill-current" />
          Stop
        </button>
      </div>
    )
  }

  return (
    <div className="border border-emerald-200 rounded-xl overflow-hidden" style={{ background: 'rgba(52,211,153,0.04)' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <Mic className="w-3.5 h-3.5" />
          Voice note ready · {formatDuration(duration)}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={discard}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Discard recording"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ background: '#0f2e1e' }}
          >
            {isUploading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Upload className="w-3 h-3" />
            }
            {isUploading ? 'Uploading…' : 'Save Note'}
          </button>
        </div>
      </div>
      {audioUrl && (
        <div className="px-4 py-2.5">
          <audio controls src={audioUrl} className="w-full h-8" preload="auto" />
        </div>
      )}
    </div>
  )
}
