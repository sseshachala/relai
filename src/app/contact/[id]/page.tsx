import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'
import DealRow from './DealRow'

export const dynamic = 'force-dynamic'

const SENT_COLOR: Record<string, string> = { positive: 'var(--green)', neutral: 'var(--muted)', negative: 'var(--red)' }
const SENT_BG:    Record<string, string> = { positive: 'var(--green-dim)', neutral: 'var(--bg2)', negative: 'var(--red-dim)' }

function initials(name: string | null) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

type DealRowType = { id: string; summary: string | null; deal_stage: string | null; urgency: string | null; created_at: string }
type DealLink    = { role: string; deals: DealRowType[] }

export default async function ContactPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contact }, { data: allContacts }, { data: allDeals }, { data: dealLinks }] = await Promise.all([
    supabase.from('contacts').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('contacts').select('id').eq('user_id', user.id),
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('deal_contacts')
      .select('role, deals(id, summary, deal_stage, urgency, created_at)')
      .eq('contact_id', params.id),
  ])

  if (!contact) notFound()

  const relatedDeals: DealRowType[] = ((dealLinks ?? []) as unknown as DealLink[])
    .flatMap((dl: DealLink) => dl.deals ?? [])

  const sent    = contact.sentiment ?? 'neutral'
  const dateStr = new Date(contact.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={allDeals?.length ?? 0} contactCount={allContacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
          <Link href="/contacts" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Contacts</Link>
          <span>›</span>
          <span>{contact.name || contact.email}</span>
        </div>

        <div style={{ maxWidth: 680 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {initials(contact.name)}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 3 }}>{contact.name || 'Unknown'}</h1>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                {[contact.email, contact.company, contact.role].filter(Boolean).join(' · ')}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: SENT_BG[sent] ?? 'var(--bg2)', color: SENT_COLOR[sent] ?? 'var(--muted)' }}>
              {sent}
            </span>
          </div>

          {/* Meta grid */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'First seen', value: dateStr },
                { label: 'Sentiment',  value: sent },
                { label: 'Company',    value: contact.company ?? '—' },
                { label: 'Role',       value: contact.role    ?? '—' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Last topic */}
          {contact.last_topic && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Last discussed</div>
              <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'var(--serif)', fontStyle: 'italic', lineHeight: 1.6 }}>{contact.last_topic}</div>
            </div>
          )}

          {/* Related deals */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
              Deal history ({relatedDeals.length})
            </div>
            {relatedDeals.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No deals linked to this contact yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {relatedDeals.map((d: DealRowType) => (
                  <DealRow
                    key={d.id}
                    id={d.id}
                    summary={d.summary}
                    deal_stage={d.deal_stage}
                    created_at={d.created_at}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <Link href="/contacts" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>← Back to contacts</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
