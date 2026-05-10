'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Square, Send, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useOrderDraftStore } from '@/store/order-draft-store'
import type { ExtractedOrderFields } from '@/lib/ai/extract-order-fields'
import { cn } from '@/lib/utils/cn'

type RecordingState = 'idle' | 'recording' | 'stopped' | 'processing' | 'done'

interface VoiceIntakePanelProps {
  onExtracted: () => void   // called when AI extraction succeeds — parent switches to review form
}

export function VoiceIntakePanel({ onExtracted }: VoiceIntakePanelProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState('')    // Web Speech API live transcript
  const [amplitudes, setAmplitudes] = useState<number[]>(new Array(30).fill(0))
  const [speechSupported, setSpeechSupported] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)

  const { setFromAI } = useOrderDraftStore()

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  // Waveform animation
  const animateWaveform = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const step = Math.floor(data.length / 30)
    const newAmps = Array.from({ length: 30 }, (_, i) => (data[i * step] ?? 0) / 255)
    setAmplitudes(newAmps)
    animFrameRef.current = requestAnimationFrame(animateWaveform)
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up Web Audio for waveform
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      ctx.createMediaStreamSource(stream).connect(analyser)
      analyserRef.current = analyser
      animFrameRef.current = requestAnimationFrame(animateWaveform)

      // MediaRecorder for the audio blob
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.start(250)
      mediaRecorderRef.current = recorder

      // Web Speech API for live transcript
      if (speechSupported) {
        const SR = (window.SpeechRecognition ?? window.webkitSpeechRecognition)!
        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = navigator.language || 'en-IN'
        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let text = ''
          for (let i = 0; i < e.results.length; i++) {
            text += e.results[i]![0]!.transcript + ' '
          }
          setTranscript(text.trim())
        }
        recognition.start()
        recognitionRef.current = recognition
      }

      // Duration timer — auto-stop at 120s
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= 120) { stopRecording(); return d }
          return d + 1
        })
      }, 1000)

      setState('recording')
    } catch {
      toast.error('Microphone access denied. Please allow microphone access to use voice intake.')
    }
  }

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    setAmplitudes(new Array(30).fill(0))
    setState('stopped')
  }, [])

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0 && !transcript) {
      toast.error('No audio recorded')
      return
    }

    setState('processing')

    try {
      const formData = new FormData()

      // Prefer Web Speech transcript (cheaper) — fall back to raw audio
      if (transcript.trim().length > 10) {
        formData.append('transcript', transcript)
      } else {
        // Strip codec suffix — browsers may report "audio/webm;codecs=opus"
        const rawMime = audioChunksRef.current[0]?.type ?? 'audio/webm'
        const mimeType = rawMime.split(';')[0]!.trim()
        const ext = mimeType.split('/')[1] ?? 'webm'
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        formData.append('audio', blob, `recording.${ext}`)
      }

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json() as { error: string }
        throw new Error(err.error ?? 'AI processing failed')
      }

      const data = await res.json() as {
        fields: ExtractedOrderFields
        ambiguous: string[]
        transcript?: string
      }

      setFromAI(data.fields, data.ambiguous, data.transcript ?? transcript)
      setState('done')
      toast.success('Order details extracted — please review before submitting')
      onExtracted()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed'
      toast.error(message)
      setState('stopped')
    }
  }

  const reset = () => {
    audioChunksRef.current = []
    setTranscript('')
    setDuration(0)
    setAmplitudes(new Array(30).fill(0))
    setState('idle')
  }

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            state === 'recording' ? 'bg-red-500 animate-pulse' :
            state === 'processing' ? 'bg-amber-400 animate-pulse' :
            state === 'done' ? 'bg-green-500' : 'bg-slate-300'
          )} />
          <span className="text-sm font-medium text-slate-700">
            {state === 'idle' ? 'Ready to record' :
             state === 'recording' ? `Recording… ${formatDuration(duration)}` :
             state === 'stopped' ? 'Recording complete' :
             state === 'processing' ? 'Extracting order details…' :
             'Extraction complete'}
          </span>
        </div>
        {state === 'recording' && (
          <span className="text-xs text-slate-400">{formatDuration(120 - duration)} remaining</span>
        )}
      </div>

      {/* Waveform */}
      <div className="h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-0.5 px-4 overflow-hidden">
        {state === 'recording' ? (
          amplitudes.map((amp, i) => (
            <div
              key={i}
              className="w-1.5 bg-blue-500 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(4, amp * 56)}px` }}
            />
          ))
        ) : state === 'processing' ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm">Gemini is reading your recording…</span>
          </div>
        ) : (
          <div className="text-slate-400 text-sm text-center px-4">
            {state === 'idle'
              ? 'Speak naturally: "One female scrub medium size navy blue, hospital logo, Dr. Sita Sharma…"'
              : state === 'stopped'
                ? 'Recording ready — click Extract to process'
                : 'Done!'}
          </div>
        )}
      </div>

      {/* Live transcript */}
      {transcript && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 mb-1.5">Live transcript</p>
          <p className="text-sm text-slate-700 leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        {state === 'idle' && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-sm"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        )}

        {state === 'recording' && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-900 transition-colors"
          >
            <Square className="w-4 h-4 fill-white" />
            Stop Recording
          </button>
        )}

        {state === 'stopped' && (
          <>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Re-record
            </button>
            <button
              onClick={processRecording}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Extract Order Details
            </button>
          </>
        )}

        {state === 'processing' && (
          <div className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </div>
        )}
      </div>

      {/* Tips */}
      {state === 'idle' && (
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">Tips for best results</p>
          <ul className="text-xs text-blue-600 space-y-1 list-disc pl-4">
            <li>State the product type first: &ldquo;One female scrub set…&rdquo;</li>
            <li>Say measurements clearly: &ldquo;chest 34, waist 28, sleeve 20&rdquo;</li>
            <li>Spell out names: &ldquo;D-R Sita Sharma&rdquo;</li>
            <li>Mention embroidery explicitly: &ldquo;with name embroidery Dr. Sita Sharma&rdquo;</li>
          </ul>
        </div>
      )}
    </div>
  )
}
