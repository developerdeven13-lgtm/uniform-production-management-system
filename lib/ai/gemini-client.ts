import { google } from '@ai-sdk/google'

// Gemini Flash — fast, multimodal, supports audio input
export const geminiFlash = google('gemini-2.5-flash')

// Gemini Pro — for complex extraction if Flash confidence is low
export const geminiPro = google('gemini-1.5-pro')
