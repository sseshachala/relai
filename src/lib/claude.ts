import Anthropic from '@anthropic-ai/sdk'
import { DealAnalysis } from '@/types'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

// ── Prompts ────────────────────────────────────────────────────────────
const ANALYSE_SYSTEM = `You are a deal intelligence engine for an AI-first CRM. 
Analyse the email thread and return ONLY valid JSON — no markdown, no explanation.

Schema:
{
  "is_deal": boolean,
  "deal_stage": "prospect"|"active"|"stalled"|"closed"|null,
  "urgency": "high"|"medium"|"low"|null,
  "confidence": number 0.0-1.0,
  "sentiment": "positive"|"neutral"|"negative",
  "next_action": string or null,
  "summary": string (one sentence, max 18 words),
  "contacts": [
    { "name": string|null, "email": string|null, "company": string|null, "role": string|null, "last_topic": string|null }
  ]
}

Rules:
- is_deal=true only for genuine commercial opportunities
- Never invent data — use null when unsure
- next_action must be specific and actionable, not generic`

const DIGEST_SYSTEM = `You are an executive assistant writing a daily relationship intelligence briefing.
Write in warm, direct prose — no bullet points, no headers, no lists.
Three parts: (1) who needs a reply urgently today, (2) deals at risk of going cold, (3) one relationship worth rekindling.
Under 150 words. Personal and specific to the data. Start directly — no greeting.`

// ── Smart truncation — keeps head + tail of long threads ───────────────
export function smartTruncate(text: string, maxChars = 6000): string {
  if (text.length <= maxChars) return text
  const half = Math.floor(maxChars / 2)
  return (
    text.slice(0, half) +
    '\n\n[... middle of thread omitted for analysis ...]\n\n' +
    text.slice(-half)
  )
}

// ── Core AI tasks ──────────────────────────────────────────────────────
export async function analyseThread(thread: string): Promise<DealAnalysis> {
  const truncated = smartTruncate(thread)
  const anthropic = getClient()

  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 1000,
    system:     ANALYSE_SYSTEM,
    messages:   [{ role: 'user', content: `Analyse this email thread:\n\n${truncated}` }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim()) as DealAnalysis
  } catch {
    throw new Error('Could not parse AI response — please try again.')
  }
}

export async function generateDigest(payload: {
  deals:    Array<{ stage: string | null; urgency: string | null; next_action: string | null; summary: string; contact: string; company: string }>
  contacts: Array<{ name: string | null; company: string | null; sentiment: string | null; last_topic: string | null }>
}): Promise<string> {
  const anthropic = getClient()
  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 500,
    system:     DIGEST_SYSTEM,
    messages:   [{ role: 'user', content: `Write today's briefing from this data:\n${JSON.stringify(payload)}` }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}
