'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SyncStatus = 'idle' | 'syncing' | 'done' | 'error'

const STEPS = [
  'Connecting to Gmail…',
  'Fetching your recent email threads…',
  'Running AI analysis on each thread…',
  'Extracting contacts…',
  'Detecting deal signals…',
  'Linking calendar events…',
  'Building your pipeline…',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [status,    setStatus]    = useState<SyncStatus>('idle')
  const [stepIdx,   setStepIdx]   = useState(0)
  const [processed, setProcessed] = useState(0)
  const [deals,     setDeals]     = useState(0)
  const [contacts,  setContacts]  = useState(0)
  const [error,     setError]     = useState<string | null>(null)

  async function runSync() {
    setStatus('syncing'); setError(null); setStepIdx(0)

    const ticker = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, STEPS.length - 1))
    }, 2200)

    try {
      const res  = await fetch('/api/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ trigger: 'onboarding' }),
      })
      clearInterval(ticker)
      const data = await res.json()

      if (res.status === 409) {
        setError(data.error)
        setStatus('error')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setProcessed(data.processed)
      setDeals(data.deals)
      setContacts(data.contacts)
      setStatus('done')
    } catch (err) {
      clearInterval(ticker)
      setError(err instanceof Error ? err.message : 'Sync failed')
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 20px' }}>

        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 8 }}>Relai</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 40 }}>
          Let's build your pipeline
        </div>

        {/* Idle — waiting for user to click */}
        {status === 'idle' && (
          <>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>
              Relai will scan your recent Gmail threads, extract contacts, and detect deal signals automatically. This takes about 30 seconds.
            </p>
            <button onClick={runSync} style={{
              width: '100%', padding: '13px 24px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 10,
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              Sync my Gmail now →
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, fontFamily: 'var(--mono)' }}>
              Read-only access · No emails stored
            </p>
          </>
        )}

        {/* Syncing */}
        {status === 'syncing' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <Spinner />
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>{STEPS[stepIdx]}</span>
            </div>
            <div style={{ height: 3, background: 'var(--bg2)', borderRadius: 2, overflow: 'hidden', maxWidth: 280, margin: '0 auto' }}>
              <div style={{
                height: '100%', background: 'var(--accent)', borderRadius: 2,
                width: `${Math.round((stepIdx / (STEPS.length - 1)) * 100)}%`,
                transition: 'width .5s ease',
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 16, fontFamily: 'var(--mono)' }}>
              Step {stepIdx + 1} of {STEPS.length}
            </p>
          </>
        )}

        {/* Done */}
        {status === 'done' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--green-dim)', border: '1px solid rgba(26,158,106,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12L10 17L19 8" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 8 }}>
              Your pipeline is ready
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
              Scanned <strong style={{ color: 'var(--text)' }}>{processed} threads</strong> and found{' '}
              <strong style={{ color: 'var(--green)' }}>{deals} deals</strong> and{' '}
              <strong style={{ color: 'var(--accent)' }}>{contacts} contacts</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Threads scanned', value: processed, color: 'var(--text)' },
                { label: 'Deals found',     value: deals,     color: 'var(--green)' },
                { label: 'Contacts built',  value: contacts,  color: 'var(--accent)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => router.push('/pipeline')} style={{
              width: '100%', padding: '13px 24px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 10,
              fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>
              View my pipeline →
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, fontFamily: 'var(--mono)' }}>
              New emails sync automatically every 15 minutes
            </p>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(212,68,68,.2)', borderRadius: 10, padding: '16px', marginBottom: 20, fontSize: 13, color: 'var(--red)' }}>
              {error}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={runSync} style={{ padding: '9px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Try again
              </button>
              <button onClick={() => router.push('/pipeline')} style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer' }}>
                Skip for now
              </button>
            </div>
          </>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
  )
}
