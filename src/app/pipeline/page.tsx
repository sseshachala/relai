import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import PipelineBoard from './PipelineBoard'

export default async function PipelinePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Deal pipeline</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Auto-built from email threads. Zero manual entry.</p>
          </div>
          <a href="/analyse" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 8,
            border: '1px solid var(--border2)', background: 'transparent',
            fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
            color: 'var(--text)', textDecoration: 'none',
          }}>
            + Analyse thread
          </a>
        </div>
        <PipelineBoard deals={deals ?? []} />
      </main>
    </div>
  )
}
