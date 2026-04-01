// Gmail + Google Calendar API helpers
// The access token comes from Supabase — it's stored automatically
// when the user signs in with Google OAuth

export interface EmailThread {
  id:       string
  subject:  string
  snippet:  string
  messages: EmailMessage[]
}

export interface EmailMessage {
  from:    string
  to:      string
  date:    string
  body:    string
}

export interface CalendarEvent {
  id:       string
  title:    string
  start:    string
  end:      string
  attendees: string[]
}

// ── Fetch last N email threads ────────────────────────────────────────
export async function fetchRecentThreads(
  accessToken: string,
  maxThreads  = 10
): Promise<EmailThread[]> {

  // Step 1 — get thread IDs (exclude newsletters, notifications)
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxThreads}&q=-category:promotions -category:social -category:updates`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!listRes.ok) throw new Error('Gmail API error: ' + listRes.status)
  const listData = await listRes.json()
  const threads  = listData.threads ?? []

  // Step 2 — fetch each thread in parallel (capped at 10)
  const threadDetails = await Promise.all(
    threads.slice(0, maxThreads).map((t: { id: string }) =>
      fetchThread(accessToken, t.id)
    )
  )

  return threadDetails.filter(Boolean) as EmailThread[]
}

// ── Fetch a single thread with all messages ───────────────────────────
export async function fetchThread(
  accessToken: string,
  threadId:    string
): Promise<EmailThread | null> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return null
    const data = await res.json()

    const messages: EmailMessage[] = (data.messages ?? []).map((msg: any) => {
      const headers = msg.payload?.headers ?? []
      const get     = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

      return {
        from: get('From'),
        to:   get('To'),
        date: get('Date'),
        body: extractBody(msg.payload),
      }
    })

    // Build subject from first message
    const firstHeaders = data.messages?.[0]?.payload?.headers ?? []
    const subject = firstHeaders.find((h: any) => h.name.toLowerCase() === 'subject')?.value ?? '(no subject)'

    return {
      id:       threadId,
      subject,
      snippet:  data.snippet ?? '',
      messages,
    }
  } catch {
    return null
  }
}

// ── Flatten thread into a plain text string for Claude ────────────────
export function threadToText(thread: EmailThread): string {
  return thread.messages.map(m =>
    `From: ${m.from}\nTo: ${m.to}\nDate: ${m.date}\nSubject: ${thread.subject}\n\n${m.body}`
  ).join('\n\n---\n\n')
}

// ── Fetch upcoming calendar events ────────────────────────────────────
export async function fetchCalendarEvents(
  accessToken: string,
  maxEvents   = 10
): Promise<CalendarEvent[]> {
  const now     = new Date().toISOString()
  const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${oneWeek}&maxResults=${maxEvents}&singleEvents=true&orderBy=startTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data.items ?? []).map((e: any) => ({
    id:        e.id,
    title:     e.summary ?? '(no title)',
    start:     e.start?.dateTime ?? e.start?.date ?? '',
    end:       e.end?.dateTime   ?? e.end?.date   ?? '',
    attendees: (e.attendees ?? []).map((a: any) => a.email).filter(Boolean),
  }))
}

// ── Get Gmail history ID for incremental sync ─────────────────────────
export async function getHistoryId(accessToken: string): Promise<string | null> {
  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.historyId ?? null
}

// ── Fetch only new threads since last sync ────────────────────────────
export async function fetchNewThreadsSince(
  accessToken:     string,
  sinceHistoryId:  string
): Promise<EmailThread[]> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${sinceHistoryId}&historyTypes=messageAdded`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) return []
  const data = await res.json()

  // Extract unique thread IDs from history
  const threadIds = new Set<string>()
  for (const record of data.history ?? []) {
    for (const msg of record.messagesAdded ?? []) {
      if (msg.message?.threadId) threadIds.add(msg.message.threadId)
    }
  }

  const threads = await Promise.all(
    [...threadIds].slice(0, 20).map(id => fetchThread(accessToken, id))
  )

  return threads.filter(Boolean) as EmailThread[]
}

// ── Extract plain text body from Gmail message payload ────────────────
function extractBody(payload: any): string {
  if (!payload) return ''

  // Direct text/plain part
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8').slice(0, 3000)
  }

  // Search parts recursively
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8').slice(0, 3000)
      }
    }
    // Fallback to HTML part if no plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8')
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
      }
    }
  }

  return payload.snippet ?? ''
}
