'use client'
import { useState, useEffect } from 'react'

export default function SyncButton() {
  const [syncing,    setSyncing]    = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [message,    setMessage]    = useState<string | null>(null)

  useEffect(() => {
    fetchSyncState()
  }, [])

  async function fetchSyncState() {
    const res  = await fetch('/api/sync')
    const data = await res.json()
    if (data.state?.last_synced_at) {
      setLastSynced(data.state.last_synced_at)
    }
  }

  async function triggerSync() {
    setSyncing(true); setMessage(null)
    try {
      const res  = await fetch('/api/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode: 'incremental' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`${data.processed} threads · ${data.saved} new deals`)
      setLastSynced(new Date().toISOString())
      // Reload page to show new data
      window.location.reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const timeAgo = lastSynced
    ? formatTimeAgo(new Date(lastSynced))
    : 'Never synced'

  return (
    <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
      <button
        onClick={triggerSync}
        disabled={syncing}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          padding:'8px 12px', background:'transparent',
          border:'1px solid var(--border2)', borderRadius:8,
          fontFamily:'var(--sans)', fontSize:11, fontWeight:500,
          color: syncing ? 'var(--muted)' : 'var(--text)',
          cursor: syncing ? 'not-allowed' : 'pointer',
          transition:'all .15s',
        }}
        onMouseOver={e => { if (!syncing) { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}}
        onMouseOut={e  => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.color='var(--text)' }}
      >
        {syncing
          ? <><Spinner />Syncing…</>
          : <><SyncIcon />Sync Gmail now</>
        }
      </button>
      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--muted)', marginTop:6, textAlign:'center' }}>
        {message ?? timeAgo}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1)  return 'Just synced'
  if (mins < 60) return `Synced ${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `Synced ${hrs}h ago`
}

function Spinner() {
  return <div style={{ width:12, height:12, border:'1.5px solid var(--border2)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
}

function SyncIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M1.5 7A5.5 5.5 0 0 1 12 4.5M12.5 7A5.5 5.5 0 0 1 2 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 2.5l2 2-2 2M4 7.5l-2 2 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
