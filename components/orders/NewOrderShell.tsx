'use client'

import { useState } from 'react'
import { Mic, ClipboardList } from 'lucide-react'
import { OrderForm } from './OrderForm'
import { VoiceIntakePanel } from '@/components/ai/VoiceIntakePanel'
import { TranscriptReviewForm } from '@/components/ai/TranscriptReviewForm'
import type { Customer } from '@/types/app.types'
import { cn } from '@/lib/utils/cn'

type Mode = 'manual' | 'ai'
type AIStep = 'record' | 'review'

interface NewOrderShellProps {
  prefillCustomer?: Customer
  initialMode: Mode
}

export function NewOrderShell({ prefillCustomer, initialMode }: NewOrderShellProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [aiStep, setAiStep] = useState<AIStep>('record')

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setMode('manual')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'manual'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <ClipboardList className="w-4 h-4" />
          Manual Form
        </button>
        <button
          onClick={() => { setMode('ai'); setAiStep('record') }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'ai'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Mic className="w-4 h-4" />
          AI Voice Intake
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold">
            NEW
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {mode === 'manual' ? (
          <OrderForm prefillCustomer={prefillCustomer} />
        ) : aiStep === 'record' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI Voice Intake</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Speak the order details naturally — Gemini will extract and pre-fill the form for you to review.
              </p>
            </div>
            <VoiceIntakePanel onExtracted={() => setAiStep('review')} />
          </div>
        ) : (
          <TranscriptReviewForm onReset={() => setAiStep('record')} prefillCustomer={prefillCustomer} />
        )}
      </div>
    </div>
  )
}
