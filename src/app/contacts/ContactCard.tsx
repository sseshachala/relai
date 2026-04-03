'use client'
import Link from 'next/link'

const SENT_COLOR: Record<string, string> = { positive: 'var(--green)', neutral: 'var(--muted)', negative: 'var(--red)' }
const SENT_BG:    Record<string, string> = { positive: 'var(--green-dim)', neutral: 'var(--bg2)', negative: 'var(--red-dim)' }

function initials(name: string | null) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  id:         string
  name:       string | null
  email:      string | null
  company:    string | null
  role:       string | null
  sentiment:  string | null
  last_topic: string | null
}

export default function ContactCard({ id, name, email, company, role, sentiment, last_topic }: Props) {
  const sent    = sentiment ?? 'neutral'
  const sentCol = SENT_COLOR[sent] ?? 'var(--muted)'
  const sentBg  = SENT_BG[sent]    ?? 'var(--bg2)'

  return (
    <Link href={`/contact/${id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}
        onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseOut={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {initials(name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {name || email || 'Unknown'}
            </div>
            {company && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                {company}{role ? ` · ${role}` : ''}
              </div>
            )}
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: sentBg, color: sentCol, flexShrink: 0 }}>
            {sent}
          </span>
        </div>
        {last_topic && (
          <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
            {last_topic.slice(0, 70)}{last_topic.length > 70 ? '…' : ''}
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
          View profile →
        </div>
      </div>
    </Link>
  )
}
