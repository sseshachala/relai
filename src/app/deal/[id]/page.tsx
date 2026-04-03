import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STAGE_COLOR: Record<string, string> = {
  prospect: 'var(--accent)', active: 'var(--green)',
  stalled: 'var(--amber)', closed: 'var(--muted)',
}
const URG_COLOR: Record<string, string> = {
  high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)',
}

export default async function DealPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deal }, { data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('id').eq('user_id', user.id),
  ])

  if (!deal) notFound()

  const conf      = Math.round((deal.confidence ?? 0) * 100)
  const stageCol  = STAGE_COLOR[deal.deal_stage ?? ''] ?? 'var(--muted)'
  const urgCol    = URG_COLOR[deal.urgency ?? '']    ?? 'var(--muted)'
  const dateStr   = new Date(deal.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
          <Link href="/pipeline" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Pipeline</Link>
          <span>›</span>
          <span>{deal.summary?.slice(0, 40) || 'Deal'}</span>
        </div>

        <div style={{ maxWidth: 680 }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 6 }}>
              {deal.summary || 'Deal detail'}
            </h1>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{dateStr}</div>
          </div>

          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Stage',      value: deal.deal_stage ?? '—', color: stageCol },
              { label: 'Urgency',    value: deal.urgency ?? '—',    color: urgCol   },
              { label: 'Sentiment',  value: deal.sentiment ?? '—',  color: 'var(--text)' },
              { label: 'Confidence', value: `${conf}%`,             color: 'var(--accent)' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Confidence bar */}
          <div style={{ height: 3, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: '100%', width: `${conf}%`, background: 'var(--green)', borderRadius: 2 }} />
          </div>

          {/* Next action */}
          {deal.next_action && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Next action</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{deal.next_action}</div>
            </div>
          )}

          {/* Thread preview */}
          {deal.thread_text && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Email thread preview</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.7, color: 'var(--muted)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'hidden' }}>
                {deal.thread_text.slice(0, 600)}
                {deal.thread_text.length > 600 && '…'}
              </div>
            </div>
          )}

          {/* Back link */}
          <div style={{ marginTop: 24 }}>
            <Link href="/pipeline" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>← Back to pipeline</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
