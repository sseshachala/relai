import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCalendarEvents } from '@/lib/gmail'
import { unstable_noStore as noStore } from 'next/cache'

export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Get stored calendar events with linked thread snapshots
  const { data: events } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', new Date().toISOString())
    .lte('start_time', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
    .order('start_time', { ascending: true })

  if (!events?.length) {
    // Try fetching from Google if we have a token
    if (session.provider_token) {
      try {
        const calEvents = await fetchCalendarEvents(session.provider_token, 20)
        for (const e of calEvents) {
          await supabase.from('calendar_events').upsert({
            user_id:        userId,
            event_id:       e.id,
            title:          e.title,
            start_time:     e.start,
            end_time:       e.end,
            attendee_emails: e.attendees,
            linked_thread_ids: [],
          }, { onConflict: 'user_id,event_id' })
        }
        // Re-fetch after upsert
        const { data: fresh } = await supabase
          .from('calendar_events').select('*').eq('user_id', userId)
          .gte('start_time', new Date().toISOString())
          .lte('start_time', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
          .order('start_time', { ascending: true })
        return NextResponse.json({ events: fresh ?? [] })
      } catch { return NextResponse.json({ events: [] }) }
    }
    return NextResponse.json({ events: [] })
  }

  // Enrich with linked thread snapshots
  const enriched = await Promise.all((events ?? []).map(async event => {
    const linkedIds = (event.linked_thread_ids ?? []) as string[]
    if (!linkedIds.length) return { ...event, linked_snapshots: [] }
    const { data: snapshots } = await supabase
      .from('thread_snapshots').select('*').eq('user_id', userId).in('thread_id', linkedIds)
    return { ...event, linked_snapshots: snapshots ?? [] }
  }))

  return NextResponse.json({ events: enriched })
}

// Manually link a thread to a meeting
export async function PATCH(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id, thread_id, action } = await req.json()

  const { data: event } = await supabase.from('calendar_events')
    .select('linked_thread_ids').eq('user_id', user.id).eq('event_id', event_id).single()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const current = (event.linked_thread_ids ?? []) as string[]
  const updated = action === 'remove'
    ? current.filter(id => id !== thread_id)
    : [...new Set([...current, thread_id])]

  await supabase.from('calendar_events')
    .update({ linked_thread_ids: updated }).eq('user_id', user.id).eq('event_id', event_id)

  return NextResponse.json({ success: true, linked_thread_ids: updated })
}
