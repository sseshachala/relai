// ── Deal ──────────────────────────────────────────────────────────────
export type DealStage = 'prospect' | 'active' | 'stalled' | 'closed'
export type Urgency   = 'high' | 'medium' | 'low'
export type Sentiment = 'positive' | 'neutral' | 'negative'

export interface ContactInThread {
  name:        string | null
  email:       string | null
  company:     string | null
  role:        string | null
  last_topic:  string | null
}

export interface DealAnalysis {
  is_deal:     boolean
  deal_stage:  DealStage | null
  urgency:     Urgency | null
  confidence:  number           // 0.0 – 1.0
  sentiment:   Sentiment
  next_action: string | null
  summary:     string
  contacts:    ContactInThread[]
}

// ── DB rows (matches Supabase tables) ─────────────────────────────────
export interface Deal extends DealAnalysis {
  id:           string
  user_id:      string
  thread_text:  string
  created_at:   string
}

export interface Contact {
  id:          string
  user_id:     string
  name:        string | null
  email:       string | null
  company:     string | null
  role:        string | null
  sentiment:   Sentiment | null
  last_topic:  string | null
  created_at:  string
}

// ── API request/response shapes ────────────────────────────────────────
export interface AnalyseRequest  { thread: string }
export interface AnalyseResponse { data: DealAnalysis; saved: boolean }

export interface DigestRequest   { userId: string }
export interface DigestResponse  { digest: string }
