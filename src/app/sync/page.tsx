import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import SyncSettings from './SyncSettings'

export const dynamic = 'force-dynamic'

export default async function SyncPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: deals },
    { data: contacts },
    { data: config },
    { data: threads },
    { data: events },
  ] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('id').eq('user_id', user.id),
    supabase.from('sync_config').select('*').eq('user_id', user.id).single(),
    supabase.from('email_threads')
      .select('id, subject, snippet, from_email, date, was_analysed, is_deal, deal_stage')
      .eq('user_id', user.id).order('date', { ascending: false }).limit(50),
    supabase.from('calendar_events')
      .select('id, title, start_time, end_time, attendees')
      .eq('user_id', user.id).order('start_time', { ascending: false }).limit(20),
  ])

  const defaultConfig = {
    enabled: true, lookback_days: 30, max_threads: 10,
    include_calendar: true, keywords: [], schedule_mins: 15,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Sync settings</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
            Configure what Relai pulls from your Gmail and Calendar, and how often.
          </p>
        </div>
        <SyncSettings
          initialConfig={config ?? defaultConfig}
          threads={threads ?? []}
          events={events ?? []}
        />
      </main>
    </div>
  )
}
