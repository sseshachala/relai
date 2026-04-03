// ── Types ─────────────────────────────────────────────────────────────
export interface EmailMessage {
  id:      string
  from:    string
  to:      string
  date:    string
  subject: string
  body:    string
}

export interface EmailThread {
  id:       string
  subject:  string
  snippet:  string
  messages: EmailMessage[]
}

export interface GCalEvent {
  id:        string
  title:     string
  start:     string
  end:       string
  attendees: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────
function header(headers: { name: string; value: string }[], name: string) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeBody(data: string) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractBody(payload: {
  mimeType?: string
  body?: { data?: string }
  parts?: { mimeType?: string; body?: { data?: string } }[]
}): string {
  if (payload.body?.data) return decodeBody(payload.body.data)
  if (payload.parts) {
    const text = payload.parts.find(p => p.mimeType === 'text/plain')
    if (text?.body?.data) return decodeBody(text.body.data)
    const html = payload.parts.find(p => p.mimeType === 'text/html')
    if (html?.body?.data) return decodeBody(html.body.data).replace(/<[^>]+>/g, ' ')
  }
  return ''
}

// ── Fetch a single thread ─────────────────────────────────────────────
export async function fetchThread(accessToken: string, threadId: string): Promise<EmailThread | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json()

  const messages = (data.messages ?? []).map((msg: {
    id: string
    payload: { headers: { name: string; value: string }[]; body?: { data?: string }; parts?: { mimeType?: string; body?: { data?: string } }[] }
    internalDate: string
  }) => {
    const h = msg.payload.headers
    return {
      id:      msg.id,
      from:    header(h, 'From'),
      to:      header(h, 'To'),
      date:    new Date(parseInt(msg.internalDate)).toISOString(),
      subject: header(h, 'Subject'),
      body:    extractBody(msg.payload).slice(0, 3000),
    }
  })

  return {
    id:       data.id,
    subject:  messages[0]?.subject ?? '',
    snippet:  data.snippet ?? '',
    messages,
  }
}

// ── Fetch N most recent threads ───────────────────────────────────────
export async function fetchRecentThreads(accessToken: string, limit = 10): Promise<EmailThread[]> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${limit}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  const ids: string[] = (data.threads ?? []).map((t: { id: string }) => t.id)

  const threads = await Promise.all(
    Array.from(ids).slice(0, limit).map(id => fetchThread(accessToken, id))
  )
  return threads.filter(Boolean) as EmailThread[]
}

// ── Fetch only new threads since a history checkpoint ─────────────────
export async function fetchNewThreadsSince(accessToken: string, historyId: string): Promise<EmailThread[]> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${historyId}&historyTypes=messageAdded&labelId=INBOX`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return []
    const data = await res.json()

    const threadIdSet = new Set<string>()
    for (const h of data.history ?? []) {
      for (const ma of h.messagesAdded ?? []) {
        if (ma.message?.threadId) threadIdSet.add(ma.message.threadId)
      }
    }

    if (!threadIdSet.size) return []
    const threads = await Promise.all(
      Array.from(threadIdSet).slice(0, 50).map(id => fetchThread(accessToken, id))
    )
    return threads.filter(Boolean) as EmailThread[]
  } catch {
    return []
  }
}

// ── Get current history ID (checkpoint for next incremental sync) ─────
export async function getHistoryId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/profile`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.historyId ?? null
  } catch {
    return null
  }
}

// ── Convert thread to plain text for Claude ───────────────────────────
export function threadToText(thread: EmailThread): string {
  return thread.messages.map(m =>
    `From: ${m.from}\nTo: ${m.to}\nDate: ${m.date}\nSubject: ${m.subject}\n\n${m.body}`
  ).join('\n\n---\n\n')
}

// ── Fetch calendar events ─────────────────────────────────────────────
export async function fetchCalendarEvents(accessToken: string, maxResults = 20): Promise<GCalEvent[]> {
  try {
    const now    = new Date().toISOString()
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${future}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.items ?? []).map((e: {
      id: string
      summary?: string
      start: { dateTime?: string; date?: string }
      end:   { dateTime?: string; date?: string }
      attendees?: { email: string }[]
    }) => ({
      id:        e.id,
      title:     e.summary ?? '(No title)',
      start:     e.start.dateTime ?? e.start.date ?? '',
      end:       e.end.dateTime   ?? e.end.date   ?? '',
      attendees: (e.attendees ?? []).map((a: { email: string }) => a.email).filter(Boolean),
    }))
  } catch {
    return []
  }
}
