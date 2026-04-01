import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function ContactsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  function initials(name: string | null) {
    if (!name) return '?'
    return name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft:210, flex:1, padding:'30px 34px' }}>
        <div style={{ marginBottom:26 }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-.02em' }}>Contacts</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>Auto-extracted from every thread you analyse.</p>
        </div>

        {(!contacts || contacts.length === 0) ? (
          <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--muted)' }}>
            <div style={{ width:40, height:40, border:'1px solid var(--border2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="#8a8680" strokeWidth="1.3"/><path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#8a8680" strokeWidth="1.3" fill="none"/></svg>
            </div>
            <p style={{ fontSize:13, lineHeight:1.7, maxWidth:260, margin:'0 auto' }}>
              No contacts yet. <a href="/analyse" style={{ color:'var(--accent)' }}>Analyse a thread</a> to auto-build contact profiles.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {contacts.map(c => {
              const sent     = c.sentiment ?? 'neutral'
              const meta     = [c.email, c.company, c.role].filter(Boolean).join(' · ')
              const dateStr  = new Date(c.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })
              const SENT_COLOR: Record<string, string> = { positive:'var(--green)', neutral:'var(--muted)', negative:'var(--red)' }
              const SENT_BG:    Record<string, string> = { positive:'var(--green-dim)', neutral:'var(--bg2)', negative:'var(--red-dim)' }
              const sentColor = SENT_COLOR[sent] ?? 'var(--muted)'
              const sentBg    = SENT_BG[sent]    ?? 'var(--bg2)'

              return (
                <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'13px 16px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:36, height:36, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0, background:'var(--accent-dim)', color:'var(--accent)' }}>
                    {initials(c.name)}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{c.name ?? 'Unknown'}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--muted)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{meta || '—'}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{dateStr}</div>
                    {c.last_topic && <div style={{ fontSize:11, fontFamily:'var(--serif)', fontStyle:'italic', color:'var(--text)', marginTop:2, maxWidth:180 }}>{c.last_topic}</div>}
                    <span style={{ display:'inline-block', fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', padding:'2px 8px', borderRadius:20, marginTop:4, background:sentBg, color:sentColor }}>
                      {sent}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
