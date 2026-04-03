import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import SyncLogsClient from './SyncLogsClient'

export const dynamic = 'force-dynamic'

export default async function SyncLogsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }, { data: runs }] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('id').eq('user_id', user.id),
    supabase.from('sync_runs')
      .select('*, thread_snapshots(*)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(30),
  ])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Sync logs</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>History of every sync run and what was found.</p>
        </div>
        <SyncLogsClient initialRuns={runs ?? []} />
      </main>
    </div>
  )
}
