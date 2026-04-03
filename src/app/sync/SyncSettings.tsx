'use client'
import React from 'react'
import { useState } from 'react'

interface SyncConfig {
  enabled:          boolean
  lookback_days:    number
  max_threads:      number
  include_calendar: boolean
  keywords:         string[]
  schedule_mins:    number
}

interface EmailThread {
  id:           string
  subject:      string | null
  snippet:      string | null
  from_email:   string | null
  date:         string | null
  was_analysed: boolean | null
  is_deal:      boolean | null
  deal_stage:   string | null
}

interface CalendarEvent {
  id:         string
  title:      string | null
  start_time: string | null
  end_time:   string | null
  attendees:  string[] | null
}

// ── Shared style helpers ──────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', padding: '20px 22px', marginBottom: 20,
}
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: '.07em', textTransform: 'uppercase' as const,
  color: 'var(--muted)', marginBottom: 8, display: 'block', fontFamily: 'var(--mono)',
}
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border2)', background: 'var(--bg)',
  color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none',
}
const row: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16,
}
const pill = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 9,
  letterSpacing: '.08em', textTransform: 'uppercase' as const,
  padding: '2px 8px', borderRadius: 20, background: bg, color,
})

export default function SyncSettings({
  initialConfig, threads, events,
}: {
  initialConfig: SyncConfig
  threads:       EmailThread[]
  events:        CalendarEvent[]
}) {
  const [config,       setConfig]       = useState<SyncConfig>(initialConfig)
  const [keywordInput, setKeywordInput] = useState(initialConfig.keywords.join(', '))
  const [saving,       setSaving]       = useState(false)
  const [syncing,      setSyncing]      = useState(false)
  const [saveMsg,      setSaveMsg]      = useState<string | null>(null)
  const [syncResult,   setSyncResult]   = useState<string | null>(null)
  const [activeTab,    setActiveTab]    = useState<'emails' | 'calendar'>('emails')

  async function saveConfig() {
    setSaving(true); setSaveMsg(null)
    try {
      const keywords = keywordInput.split(',').map((k: string) => k.trim()).filter(Boolean)
      const res  = await fetch('/api/sync-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, keywords }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfig((c: typeof config) => ({ ...c, keywords }))
      setSaveMsg('Settings saved')
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  async function runSync() {
    setSyncing(true); setSyncResult(null)
    try {
      const res  = await fetch('/api/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'sample' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult(data.message)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  function fmtDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function fmtDateShort(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      {/* ── Config card ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Sync configuration</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Auto-sync enabled</span>
            <div
              onClick={() => setConfig((c: typeof config) => ({ ...c, enabled: !c.enabled }))}
              style={{
                width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                background: config.enabled ? 'var(--green)' : 'var(--border2)',
                position: 'relative', transition: 'background .2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: config.enabled ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left .2s',
              }} />
            </div>
          </label>
        </div>

        <div style={row}>
          <div>
            <span style={label}>Look back</span>
            <select
              value={config.lookback_days}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((c: typeof config) => ({ ...c, lookback_days: +e.target.value }))}
              style={selectStyle}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div>
            <span style={label}>Threads per sync</span>
            <select
              value={config.max_threads}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((c: typeof config) => ({ ...c, max_threads: +e.target.value }))}
              style={selectStyle}
            >
              <option value={5}>5 threads</option>
              <option value={10}>10 threads</option>
              <option value={25}>25 threads</option>
              <option value={50}>50 threads</option>
            </select>
          </div>
          <div>
            <span style={label}>Sync frequency</span>
            <select
              value={config.schedule_mins}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((c: typeof config) => ({ ...c, schedule_mins: +e.target.value }))}
              style={selectStyle}
            >
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={360}>Every 6 hours</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={label}>Keyword filter (optional)</span>
          <input
            type="text"
            value={keywordInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeywordInput(e.target.value)}
            placeholder="proposal, contract, invoice, partnership — comma separated"
            style={{ ...selectStyle, width: '100%' }}
          />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--mono)' }}>
            Only threads containing these words will be analysed. Leave empty to analyse all threads.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.include_calendar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((c: typeof config) => ({ ...c, include_calendar: e.target.checked }))}
            />
            <span style={{ fontSize: 13 }}>Include Google Calendar events</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={saveConfig}
            disabled={saving}
            style={{
              padding: '9px 20px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 8, fontFamily: 'var(--sans)',
              fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? .6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>

          <button
            onClick={runSync}
            disabled={syncing}
            style={{
              padding: '9px 20px', background: 'transparent',
              border: '1px solid var(--border2)', borderRadius: 8,
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
              color: 'var(--text)', cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
            }}
          >
            {syncing && <Spinner />}
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>

          {saveMsg && (
            <span style={{ fontSize: 12, color: saveMsg.includes('aved') ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>
              {saveMsg}
            </span>
          )}
          {syncResult && (
            <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
              {syncResult}
            </span>
          )}
        </div>
      </div>

      {/* ── Data tables ── */}
      <div style={card}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
          {(['emails', 'calendar'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', border: 'none', background: 'transparent',
                fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                color: activeTab === tab ? 'var(--accent)' : 'var(--muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab === 'emails'
                ? `Email threads (${threads.length})`
                : `Calendar events (${events.length})`}
            </button>
          ))}
        </div>

        {/* Emails table */}
        {activeTab === 'emails' && (
          threads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
              No threads synced yet. Hit "Sync now" above to pull your first batch.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Subject', 'From', 'Date', 'Analysed', 'Deal signal', 'Stage'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {threads.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', fontWeight: 500 }}>
                        {t.subject || '(no subject)'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.from_email || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--muted)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {fmtDate(t.date)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {t.was_analysed
                          ? <span style={pill('var(--green)', 'var(--green-dim)')}>Yes</span>
                          : <span style={pill('var(--muted)', 'var(--bg2)')}>No</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {t.is_deal === true
                          ? <span style={pill('var(--green)', 'var(--green-dim)')}>Deal</span>
                          : t.is_deal === false
                          ? <span style={pill('var(--muted)', 'var(--bg2)')}>No signal</span>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {t.deal_stage
                          ? <span style={pill('var(--accent)', 'var(--accent-dim)')}>{t.deal_stage}</span>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Calendar table */}
        {activeTab === 'calendar' && (
          events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
              No calendar events synced yet. Make sure "Include Google Calendar" is enabled above.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Title', 'Start', 'End', 'Attendees'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title || '(no title)'}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--muted)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {fmtDate(e.start_time)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--muted)', whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {fmtDateShort(e.end_time)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(e.attendees ?? []).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 13, height: 13, border: '1.5px solid var(--border2)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      animation: 'spin .7s linear infinite', flexShrink: 0,
    }} />
  )
}
