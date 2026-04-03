import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }, { data: settings }] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('id').eq('user_id', user.id),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ])

  const defaults = {
    timezone: 'America/Chicago', digest_hour: 7, digest_minute: 30,
    email_digest_enabled: true, sync_limit: 10, keyword_filters: [], retention_days: 30,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Changes save automatically.</p>
        </div>
        <SettingsClient initialSettings={{ ...defaults, ...(settings ?? {}) }} />
      </main>
    </div>
  )
}
