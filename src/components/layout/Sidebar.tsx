'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SyncButton from '@/components/ui/SyncButton'

const PRIMARY_NAV = [
  { href: '/pipeline',  label: 'Pipeline',       icon: '▣' },
  { href: '/contacts',  label: 'Contacts',        icon: '◎' },
  { href: '/meetings',  label: 'Meetings',         icon: '⬡' },
  { href: '/analyse',   label: 'Analyse thread',  icon: '⤴' },
  { href: '/digest',    label: 'Daily digest',    icon: '≡' },
]

const SECONDARY_NAV = [
  { href: '/sync-logs', label: 'Sync logs',  icon: '⊙' },
  { href: '/settings',  label: 'Settings',   icon: '⚙' },
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
          <button onClick={() => window.location.reload()} title="Refresh"
            style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>
            ↺
          </button>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>
          AI Relationship CRM
        </div>
      </div>

      {/* Primary nav */}
      <nav style={{ flex: 1 }}>
        {PRIMARY_NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 20px', fontSize: 13, fontWeight: 500,
              color: active ? 'var(--accent)' : 'var(--muted)',
              background: active ? 'var(--accent-dim)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              textDecoration: 'none', transition: 'all .15s',
            }}>
              <span style={{ fontSize: 13, opacity: active ? 1 : 0.6 }}>{icon}</span>
              {label}
            </Link>
          )
        })}

        {/* Divider */}
        <div style={{ margin: '12px 20px', borderTop: '1px solid var(--border)' }} />

        {/* Secondary nav */}
        {SECONDARY_NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 20px', fontSize: 12, fontWeight: 400,
              color: active ? 'var(--accent)' : 'var(--muted)',
              background: active ? 'var(--accent-dim)' : 'transparent',
              borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              textDecoration: 'none', transition: 'all .15s',
            }}>
              <span style={{ fontSize: 12, opacity: active ? 1 : 0.5 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sync button */}
      <SyncButton />

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
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
          }}>Sign out</button>
        </div>
      </div>
    </aside>
  )
}
