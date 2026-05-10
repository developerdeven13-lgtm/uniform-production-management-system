import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { geminiFlash } from '@/lib/ai/gemini-client'
import { ExtractedOrderFieldsSchema, getAmbiguousFields } from '@/lib/ai/extract-order-fields'
import { buildAudioExtractionPrompt, buildTextExtractionPrompt } from '@/lib/ai/voice-intake-prompt'
import { sanitizeTranscriptForPrompt } from '@/lib/ai/sanitize-ai-input'

const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
]
const MAX_AUDIO_SIZE = 10 * 1024 * 1024  // 10MB
const MAX_DURATION_HINT = 120            // seconds — enforced by UI, not server

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role (only admin / support staff / super_admin can use AI intake)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'support_staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'AI intake not configured — GOOGLE_GENERATIVE_AI_API_KEY is missing' },
      { status: 503 }
    )
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''

    // ── Mode 1: Audio file upload ─────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const audioFile = formData.get('audio') as File | null
      const transcript = formData.get('transcript') as string | null

      // If browser sent a Web Speech API transcript, use that (cheaper + faster)
      if (transcript && transcript.trim().length > 10) {
        return await extractFromText(transcript)
      }

      // Otherwise process the audio blob
      if (!audioFile) {
        return NextResponse.json({ error: 'No audio file or transcript provided' }, { status: 400 })
      }

      if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
        return NextResponse.json(
          { error: `Unsupported audio format: ${audioFile.type}. Use WebM, MP3, MP4, OGG, or WAV.` },
          { status: 400 }
        )
      }

      if (audioFile.size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: `Audio file too large (max ${MAX_AUDIO_SIZE / 1024 / 1024}MB)` },
          { status: 400 }
        )
      }

      const audioBuffer = await audioFile.arrayBuffer()

      // Pass audio bytes to Gemini — it transcribes and extracts in one step
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filePart: any = {
        type: 'file',
        data: Buffer.from(audioBuffer),
        mimeType: audioFile.type,
      }

      const { object } = await generateObject({
        model: geminiFlash,
        schema: ExtractedOrderFieldsSchema,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildAudioExtractionPrompt() },
              filePart,
            ],
          },
        ],
      })

      const ambiguous = getAmbiguousFields(object)
      return NextResponse.json({ fields: object, ambiguous })
    }

    // ── Mode 2: JSON body with text transcript ────────────────────
    const body = await request.json() as { transcript?: string }
    if (!body.transcript || body.transcript.trim().length < 5) {
      return NextResponse.json({ error: 'Transcript is too short' }, { status: 400 })
    }

    return await extractFromText(body.transcript)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI extraction failed'
    console.error('[AI Transcribe]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function extractFromText(transcript: string) {
  const safe = sanitizeTranscriptForPrompt(transcript)

  const { object } = await generateObject({
    model: geminiFlash,
    schema: ExtractedOrderFieldsSchema,
    prompt: buildTextExtractionPrompt(safe),
  })

  const ambiguous = getAmbiguousFields(object)
  return NextResponse.json({ fields: object, ambiguous, transcript: safe })
}
