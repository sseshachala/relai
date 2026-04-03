import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import ContactCard from './ContactCard'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type ContactRow = { id: string; name: string | null; email: string | null; company: string | null; role: string | null; sentiment: string | null; last_topic: string | null }

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
            {contacts.map((c: ContactRow) => <ContactCard
              key={c.id ?? ''}
              id={c.id ?? ''}
              name={c.name ?? null}
              email={c.email ?? null}
              company={c.company ?? null}
              role={c.role ?? null}
              sentiment={c.sentiment ?? null}
              last_topic={c.last_topic ?? null}
            />)}
          </div>
        )}
      </main>
    </div>
  )
}
