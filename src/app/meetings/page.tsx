import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MeetingsClient from './MeetingsClient'
import type { CalendarEvent } from '@/types'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }, { data: events }] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('id').eq('user_id', user.id),
    supabase.from('calendar_events').select('*')
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
      .order('start_time', { ascending: true }),
  ])

  // Enrich with linked thread snapshots
  const enriched = await Promise.all((events ?? []).map(async (event: Record<string, unknown>) => {
    const linkedIds = (event.linked_thread_ids ?? []) as string[]
    if (!linkedIds.length) return { ...event, linked_snapshots: [] }
    const { data: snapshots } = await supabase
      .from('thread_snapshots').select('*').eq('user_id', user.id).in('thread_id', linkedIds)
    return { ...event, linked_snapshots: snapshots ?? [] }
  }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Meetings</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Today and next 48 hours — with email context automatically linked.</p>
        </div>
        <MeetingsClient events={enriched as unknown as CalendarEvent[]} />
      </main>
    </div>
  )
}
