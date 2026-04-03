// Relai Logger
// - In development: logs everything to console + Supabase
// - In production:  logs warn/error to Supabase, suppresses debug/info console output
// - Call log() from any API route or server function

import { createClient } from '@supabase/supabase-js'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  userId?:   string
  orgId?:    string
  event:     string        // dot-namespaced: 'sync.start', 'ai.analyse', 'auth.login'
  message?:  string
  metadata?: Record<string, unknown>
}

const IS_DEV  = process.env.NODE_ENV !== 'production'
const IS_PROD = process.env.NODE_ENV === 'production'

// Use service role for logging so it works even without user session
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function log(level: LogLevel, entry: LogEntry) {
  const { userId, orgId, event, message, metadata } = entry

  // Console output — always in dev, only warn/error in prod
  if (IS_DEV || level === 'warn' || level === 'error') {
    const prefix = `[${level.toUpperCase()}] [${event}]`
    const meta   = metadata ? JSON.stringify(metadata) : ''
    if (level === 'error') console.error(prefix, message ?? '', meta)
    else if (level === 'warn') console.warn(prefix, message ?? '', meta)
    else console.log(prefix, message ?? '', meta)
  }

  // Write to Supabase logs table
  // In prod: skip debug logs to keep table lean
  if (IS_PROD && level === 'debug') return

  try {
    const supabase = getServiceClient()
    await supabase.from('logs').insert({
      user_id:  userId  ?? null,
      org_id:   orgId   ?? null,
      level,
      event,
      message:  message ?? null,
      metadata: metadata ?? null,
    })
  } catch (err) {
    // Never let logging failure crash the app
    if (IS_DEV) console.error('[Logger] Failed to write log:', err)
  }
}

// Convenience wrappers
export const logger = {
  debug: (event: string, entry: Omit<LogEntry, 'event'>) => log('debug', { event, ...entry }),
  info:  (event: string, entry: Omit<LogEntry, 'event'>) => log('info',  { event, ...entry }),
  warn:  (event: string, entry: Omit<LogEntry, 'event'>) => log('warn',  { event, ...entry }),
  error: (event: string, entry: Omit<LogEntry, 'event'>) => log('error', { event, ...entry }),
}
