'use client'
import { useState, useEffect } from 'react'

type SyncState = 'idle' | 'syncing' | 'done' | 'blocked'

export default function SyncButton() {
  const [state,     setState]     = useState<SyncState>('idle')
  const [progress,  setProgress]  = useState('')
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [summary,   setSummary]   = useState<{ processed: number; deals: number; contacts: number } | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => { fetchState() }, [])

  async function fetchState() {
    try {
      const res  = await fetch('/api/sync')
      const data = await res.json()
      if (data.state?.last_synced_at) setLastSynced(data.state.last_synced_at)
      if (data.state?.is_syncing)     setState('blocked')
    } catch { /* ignore */ }
  }

  async function triggerSync() {
    if (state === 'syncing' || state === 'blocked') return
    setState('syncing'); setError(null); setSummary(null)

    const steps = [
      'Connecting to Gmail…',
      'Fetching email threads…',
      'Running AI analysis…',
      'Extracting contacts…',
      'Detecting deal signals…',
      'Linking calendar events…',
      'Updating pipeline…',
    ]
    let stepIdx = 0
    setProgress(steps[0])
    const ticker = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      setProgress(steps[stepIdx])
    }, 2500)

    try {
      const res  = await fetch('/api/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' }),
      })
      const data = await res.json()
      clearInterval(ticker)

      if (res.status === 409) {
        setState('blocked')
        setError(data.error)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setSummary({ processed: data.processed, deals: data.deals, contacts: data.contacts })
      setLastSynced(new Date().toISOString())
      setState('done')
      setTimeout(() => { setState('idle'); setSummary(null) }, 6000)
      window.location.reload()
    } catch (err) {
      clearInterval(ticker)
      setError(err instanceof Error ? err.message : 'Sync failed')
      setState('idle')
    }
  }

  const timeAgo = lastSynced ? formatTimeAgo(new Date(lastSynced)) : 'Never synced'

  return (
    <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)' }}>
      {/* Progress message */}
      {state === 'syncing' && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--amber)', marginBottom: 6, lineHeight: 1.5 }}>
          {progress}
        </div>
      )}

      {/* Summary after sync */}
      {summary && state === 'done' && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--green)', marginBottom: 6, lineHeight: 1.6 }}>
          ✓ {summary.processed} threads · {summary.deals} deals · {summary.contacts} contacts
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--red)', marginBottom: 6, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <button onClick={triggerSync} disabled={state === 'syncing' || state === 'blocked'}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '7px 10px',
          background: 'transparent',
          border: `1px solid ${state === 'done' ? 'var(--green)' : 'var(--border2)'}`,
          borderRadius: 8,
          fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500,
          color: state === 'syncing' || state === 'blocked' ? 'var(--muted)' : state === 'done' ? 'var(--green)' : 'var(--text)',
          cursor: state === 'syncing' || state === 'blocked' ? 'not-allowed' : 'pointer',
          transition: 'all .15s',
        }}>
        {state === 'syncing'
          ? <><Spinner />Syncing…</>
          : state === 'blocked'
          ? '⏳ Sync in progress'
          : state === 'done'
          ? '✓ Synced'
          : <>↺ Sync Gmail now</>
        }
      </button>

      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', marginTop: 5, textAlign: 'center' }}>
        {timeAgo}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1)  return 'Just synced'
  if (mins < 60) return `Synced ${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `Synced ${hrs}h ago`
  return `Synced ${Math.floor(hrs / 24)}d ago`
}

function Spinner() {
  return (
    <div style={{
      width: 10, height: 10,
      border: '1.5px solid var(--border2)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
      flexShrink: 0,
    }} />
  )
}
