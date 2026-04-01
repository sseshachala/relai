'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error'

export default function OnboardingPage() {
  const router = useRouter()
  const [status,    setStatus]    = useState<SyncStatus>('idle')
  const [progress,  setProgress]  = useState('')
  const [processed, setProcessed] = useState(0)
  const [saved,     setSaved]     = useState(0)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    // Auto-start sample sync on mount
    runSampleSync()
  }, [])

  async function runSampleSync() {
    setStatus('syncing')
    setProgress('Connecting to Gmail…')

    try {
      // Step 1 — show progress messages while syncing
      const messages = [
        'Connecting to Gmail…',
        'Fetching your recent email threads…',
        'Running AI analysis on each thread…',
        'Extracting contacts…',
        'Detecting deal signals…',
        'Building your pipeline…',
      ]

      let msgIndex = 0
      const ticker = setInterval(() => {
        msgIndex = Math.min(msgIndex + 1, messages.length - 1)
        setProgress(messages[msgIndex])
      }, 2000)

      // Step 2 — call the sync API
      const res  = await fetch('/api/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'sample' }),
      })

      clearInterval(ticker)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setProcessed(data.processed)
      setSaved(data.saved)
      setStatus('done')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center', maxWidth:420, padding:'0 20px' }}>

        <div style={{ fontSize:28, fontWeight:700, letterSpacing:'-.02em', marginBottom:8 }}>Relai</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:40 }}>
          Setting up your workspace
        </div>

        {/* Syncing state */}
        {status === 'syncing' && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:18, height:18, border:'2px solid var(--border2)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
              <span style={{ fontSize:14, color:'var(--muted)' }}>{progress}</span>
            </div>
            <div style={{ height:3, background:'var(--bg2)', borderRadius:2, overflow:'hidden', maxWidth:280, margin:'0 auto' }}>
              <div style={{ height:'100%', background:'var(--accent)', borderRadius:2, width:'60%', animation:'progress 3s ease-in-out infinite' }} />
            </div>
            <p style={{ fontSize:12, color:'var(--muted)', marginTop:20, lineHeight:1.7, fontFamily:'var(--mono)' }}>
              Scanning your last 10 email threads.<br/>This takes about 30 seconds.
            </p>
          </>
        )}

        {/* Done state */}
        {status === 'done' && (
          <>
            <div style={{ width:56, height:56, borderRadius:16, background:'var(--green-dim)', border:'1px solid rgba(26,158,106,.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 8" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-.02em', marginBottom:8 }}>
              Your pipeline is ready
            </h2>
            <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7, marginBottom:24 }}>
              Scanned {processed} email threads and found{' '}
              <strong style={{ color:'var(--green)' }}>{saved} deals</strong>. <br/>
              Contacts and sentiment were extracted automatically.
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28, textAlign:'left' }}>
              {[
                { label:'Threads scanned', value: processed },
                { label:'Deals found',     value: saved     },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:'var(--green)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/pipeline')}
              style={{
                width:'100%', padding:'13px 24px',
                background:'var(--accent)', color:'#fff',
                border:'none', borderRadius:10,
                fontFamily:'var(--sans)', fontSize:14, fontWeight:500,
                cursor:'pointer',
              }}
            >
              View my pipeline →
            </button>

            <p style={{ fontSize:11, color:'var(--muted)', marginTop:12, fontFamily:'var(--mono)' }}>
              New emails sync every 15 minutes automatically
            </p>
          </>
        )}

        {/* Error state */}
        {status === 'error' && (
          <>
            <div style={{ background:'var(--red-dim)', border:'1px solid rgba(212,68,68,.2)', borderRadius:10, padding:'16px', marginBottom:20, fontSize:13, color:'var(--red)' }}>
              {error}
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={runSampleSync} style={{ padding:'9px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--sans)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                Try again
              </button>
              <button onClick={() => router.push('/pipeline')} style={{ padding:'9px 18px', background:'transparent', border:'1px solid var(--border2)', borderRadius:8, fontFamily:'var(--sans)', fontSize:13, cursor:'pointer' }}>
                Skip for now
              </button>
            </div>
          </>
        )}

      </div>

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes progress { 0%,100% { width:30%; } 50% { width:80%; } }
      `}</style>
    </div>
  )
}
