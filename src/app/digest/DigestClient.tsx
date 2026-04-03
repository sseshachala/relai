'use client'
import { useState } from 'react'
import { Digest } from '@/types'

export default function DigestClient({
  initialDigest,
}: {
  initialDigest: Digest | null
}) {
  const [digest,    setDigest]    = useState<Digest | null>(initialDigest)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function generate() {
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/digest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate digest')
      setDigest(json.digest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={generate} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', background: loading ? 'var(--bg2)' : 'var(--accent)',
          color: loading ? 'var(--muted)' : '#fff',
          border: 'none', borderRadius: 8,
          fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading && <Spinner />}
          {loading ? 'Generating…' : digest ? 'Regenerate' : 'Generate digest'}
        </button>

        {digest && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
            Generated {formatRelative(new Date(digest.generated_at))}
            {digest.trigger !== 'manual' && ` (${digest.trigger})`}
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(212,68,68,.25)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--red)', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!digest && !loading && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
          <div style={{ width: 40, height: 40, border: '1px solid var(--border2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="#8a8680" strokeWidth="1.3" fill="none"/><path d="M6 8h8M6 11h5" stroke="#8a8680" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
            Sync some email threads first, then generate your personalised daily briefing.
          </p>
        </div>
      )}

      {digest && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px 32px', maxWidth: 640 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
            {today}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.9, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
            {digest.content}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 16 }}>
            <a href="/pipeline" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View pipeline →</a>
            <a href="/contacts" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View contacts →</a>
            <a href="/meetings" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Today's meetings →</a>
          </div>
        </div>
      )}
    </div>
  )
}

function formatRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Spinner() {
  return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
}
