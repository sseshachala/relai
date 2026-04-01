'use client'
import { useState } from 'react'

export default function DigestClient({ hasData }: { hasData: boolean }) {
  const [digest,  setDigest]  = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function generate() {
    setLoading(true); setError(null); setDigest(null)
    try {
      const res  = await fetch('/api/digest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to generate digest')
      setDigest(json.digest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading || !hasData}
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'9px 18px', background: loading||!hasData ? 'var(--bg2)' : 'var(--accent)',
          color: loading||!hasData ? 'var(--muted)' : '#fff',
          border:'none', borderRadius:8,
          fontFamily:'var(--sans)', fontSize:13, fontWeight:500,
          cursor: loading||!hasData ? 'not-allowed' : 'pointer',
          marginBottom:24,
        }}
      >
        {loading && <Spinner />}
        {loading ? 'Writing your briefing…' : 'Generate digest'}
      </button>

      {!hasData && !digest && (
        <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--muted)' }}>
          <div style={{ width:40, height:40, border:'1px solid var(--border2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="#8a8680" strokeWidth="1.3" fill="none"/><path d="M6 8h8M6 11h5" stroke="#8a8680" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontSize:13, lineHeight:1.7, maxWidth:260, margin:'0 auto' }}>
            Analyse at least one thread first, then generate your personalised daily briefing.
          </p>
        </div>
      )}

      {error && (
        <div style={{ background:'var(--red-dim)', border:'1px solid rgba(212,68,68,.25)', borderRadius:10, padding:'14px 16px', fontSize:13, color:'var(--red)' }}>
          {error}
        </div>
      )}

      {digest && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'28px 32px', maxWidth:620 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:14 }}>
            {today}
          </div>
          <div style={{ fontFamily:'var(--serif)', fontSize:15, lineHeight:1.9, color:'var(--text)', whiteSpace:'pre-wrap' }}>
            {digest}
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }} />
}
