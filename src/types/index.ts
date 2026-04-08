// ── Deal ──────────────────────────────────────────────────────────────
export type DealStage = 'prospect' | 'active' | 'stalled' | 'closed' | 'dead'
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
  confidence:  number
  sentiment:   Sentiment
  next_action: string | null
  summary:     string
  contacts:    ContactInThread[]
}

export interface Deal extends DealAnalysis {
  id:           string
  user_id:      string
  thread_id:    string | null
  thread_text:  string | null
  created_at:   string
}


export interface DealContact {
  id:         string
  deal_id:    string
  contact_id: string
  role:       'primary' | 'stakeholder' | 'cc'
  created_at: string
  contact?:   Contact
}

export interface DealWithContacts extends Deal {
  deal_contacts?: DealContact[]
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

export interface SyncRun {
  id:                string
  user_id:           string
  status:            'running' | 'success' | 'partial' | 'failed'
  trigger:           'manual' | 'cron' | 'onboarding'
  threads_processed: number
  deals_found:       number
  contacts_found:    number
  error_message:     string | null
  started_at:        string
  completed_at:      string | null
  thread_snapshots?: ThreadSnapshot[]
}

export interface ThreadSnapshot {
  id:                string
  user_id:           string
  sync_run_id:       string | null
  thread_id:         string
  subject:           string | null
  participants:      string[]
  date_from:         string | null
  date_to:           string | null
  preview_text:      string | null
  processing_status: 'success' | 'failed' | 'skipped'
  error_message:     string | null
  created_at:        string
}

export interface CalendarEvent {
  id:                string
  user_id:           string
  event_id:          string
  title:             string | null
  start_time:        string
  end_time:          string
  attendee_emails:   string[]
  linked_thread_ids: string[]
  created_at:        string
  linked_snapshots?: ThreadSnapshot[]
}

export interface Digest {
  id:           string
  user_id:      string
  content:      string
  trigger:      'manual' | 'sync' | 'cron'
  generated_at: string
}

export interface UserSettings {
  user_id:              string
  timezone:             string
  digest_hour:          number
  digest_minute:        number
  email_digest_enabled: boolean
  sync_limit:           10 | 25 | 50 | 100
  keyword_filters:      string[]
  retention_days:       number
  updated_at:           string
}

export interface AnalyseRequest  { thread: string }
export interface AnalyseResponse { data: DealAnalysis; saved: boolean }
