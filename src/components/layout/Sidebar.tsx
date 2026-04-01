'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/pipeline', label: 'Pipeline',       icon: PipelineIcon },
  { href: '/contacts', label: 'Contacts',       icon: ContactsIcon },
  { href: '/analyse',  label: 'Analyse thread', icon: AnalyseIcon  },
  { href: '/digest',   label: 'Daily digest',   icon: DigestIcon   },
]

export default function Sidebar({
  dealCount,
  contactCount,
}: {
  dealCount:    number
  contactCount: number
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 10,
    }}>
      {/* Wordmark */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.02em' }}>Relai</div>
          <RefreshButton />
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>
          AI Relationship CRM
        </div>
      </div>

      {/* Nav */}
      <nav>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', fontSize: 13, fontWeight: 500,
              color: active ? 'var(--accent)' : 'var(--muted)',
              background: active ? 'var(--accent-dim)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              textDecoration: 'none', transition: 'all .15s',
            }}>
              <Icon />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        marginTop: 'auto', padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', lineHeight: 1.8,
      }}>
        <div><strong style={{ color: 'var(--green)' }}>{dealCount}</strong> deals tracked</div>
        <div><strong style={{ color: 'var(--green)' }}>{contactCount}</strong> contacts built</div>
        <div style={{ marginTop: 8 }}>
          <button onClick={signOut} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)',
            padding: 0, textDecoration: 'underline',
          }}>
            Sign out
          </button>
        </div>
        <div style={{ marginTop: 4, fontSize: 9, opacity: .6 }}>No manual entry · Claude</div>
      </div>
    </aside>
  )
}

// ── Refresh button ─────────────────────────────────────────────────────
function RefreshButton() {
  function handleRefresh() {
    window.location.reload()
  }
  return (
    <button
      onClick={handleRefresh}
      title="Refresh"
      style={{
        background: 'none', border: '1px solid var(--border2)',
        borderRadius: 6, padding: '4px 7px', cursor: 'pointer',
        color: 'var(--muted)', display: 'flex', alignItems: 'center',
        transition: 'all .15s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.color = 'var(--accent)'
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.background = 'var(--accent-dim)'
      }}
      onMouseOut={e => {
        e.currentTarget.style.color = 'var(--muted)'
        e.currentTarget.style.borderColor = 'var(--border2)'
        e.currentTarget.style.background = 'none'
      }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M1.5 7A5.5 5.5 0 0 1 12 4.5M12.5 7A5.5 5.5 0 0 1 2 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M10 2.5l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 7.5l-2 2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────
function PipelineIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="5" height="14" rx="2" fill="currentColor" opacity=".35"/><rect x="8" y="4" width="7" height="11" rx="2" fill="currentColor" opacity=".7"/></svg>
}
function ContactsIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" fill="currentColor" opacity=".7"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity=".5"/></svg>
}
function AnalyseIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 12L6 7l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
}
function DigestIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
}
