import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SENT_COLOR: Record<string, string> = { positive: 'var(--green)', neutral: 'var(--muted)', negative: 'var(--red)' }
const SENT_BG:    Record<string, string> = { positive: 'var(--green-dim)', neutral: 'var(--bg2)', negative: 'var(--red-dim)' }

function initials(name: string | null) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default async function ContactsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px' }}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Contacts</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>
            Auto-extracted from your email threads. {contacts?.length ?? 0} contacts built.
          </p>
        </div>

        {!contacts?.length ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
              No contacts yet. Sync your Gmail to automatically extract contacts from your email threads.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {contacts.map(c => {
              const sent     = c.sentiment ?? 'neutral'
              const sentCol  = SENT_COLOR[sent] ?? 'var(--muted)'
              const sentBg   = SENT_BG[sent]    ?? 'var(--bg2)'
              return (
                <Link key={c.id} href={`/contact/${c.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s',
                  }}
                    onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseOut={(e: React.MouseEvent<HTMLDivElement>)  => (e.currentTarget.style.borderColor = 'var(--border)')}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {initials(c.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {c.name || c.email || 'Unknown'}
                        </div>
                        {c.company && (
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                            {c.company}{c.role ? ` · ${c.role}` : ''}
                          </div>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: sentBg, color: sentCol, flexShrink: 0 }}>
                        {sent}
                      </span>
                    </div>

                    {c.last_topic && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {c.last_topic.slice(0, 70)}{c.last_topic.length > 70 ? '…' : ''}
                      </div>
                    )}

                    <div style={{ marginTop: 8, fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                      View profile →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
