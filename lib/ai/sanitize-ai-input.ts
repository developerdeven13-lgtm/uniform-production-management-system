export function sanitizeTranscriptForPrompt(raw: string): string {
  return raw
    .replace(/[`\\]/g, ' ')           // remove shell metacharacters
    .replace(/"{3,}/g, '""')          // collapse excessive quotes
    .replace(/\n{3,}/g, '\n\n')       // collapse excessive newlines
    .slice(0, 4000)                   // hard cap — prevents prompt ballooning
    .trim()
}
