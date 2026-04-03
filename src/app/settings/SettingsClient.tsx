'use client'
import React from 'react'
import { useState, useCallback } from 'react'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
]

interface Settings {
  timezone:             string
  digest_hour:          number
  digest_minute:        number
  email_digest_enabled: boolean
  sync_limit:           number
  keyword_filters:      string[]
  retention_days:       number
}

export default function SettingsClient({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings]         = useState<Settings>(initialSettings)
  const [savedField, setSavedField]     = useState<string | null>(null)
  const [keywords,   setKeywords]       = useState(initialSettings.keyword_filters?.join(', ') ?? '')

  const save = useCallback(async (field: string, value: unknown) => {
    setSavedField(field)
    await fetch('/api/settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ [field]: value }),
    })
    setTimeout(() => setSavedField(null), 2000)
  }, [])

  function update(field: keyof Settings, value: unknown) {
    setSettings((s: Settings) => ({ ...s, [field]: value }))
    save(field, value)
  }

  const hours   = Array.from({ length: 24 }, (_, i) => i)
  const minutes = [0, 15, 30, 45]

  const S = {
    card: {
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 22px', marginBottom: 14,
    } as React.CSSProperties,
    label: {
      fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4,
    } as React.CSSProperties,
    sub: {
      fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5,
    } as React.CSSProperties,
    select: {
      background: 'var(--bg)', border: '1px solid var(--border2)',
      borderRadius: 8, padding: '8px 12px', fontSize: 13,
      color: 'var(--text)', fontFamily: 'var(--sans)', cursor: 'pointer',
    } as React.CSSProperties,
    saved: {
      fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', marginLeft: 10,
    } as React.CSSProperties,
  }

  return (
    <div style={{ maxWidth: 580 }}>

      {/* Timezone */}
      <div style={S.card}>
        <div style={S.label}>Timezone {savedField === 'timezone' && <span style={S.saved}>Saved</span>}</div>
        <div style={S.sub}>Used for daily digest email delivery time.</div>
        <select value={settings.timezone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('timezone', e.target.value)} style={S.select}>
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Daily digest email */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={S.label}>
            Daily digest email {savedField === 'email_digest_enabled' && <span style={S.saved}>Saved</span>}
          </div>
          <Toggle
            value={settings.email_digest_enabled}
            onChange={v => update('email_digest_enabled', v)}
          />
        </div>
        <div style={S.sub}>Receive your daily briefing by email each morning.</div>

        {settings.email_digest_enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Send at</span>
            <select
              value={settings.digest_hour}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('digest_hour', parseInt(e.target.value))}
              style={S.select}>
              {hours.map(h => (
                <option key={h} value={h}>
                  {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                </option>
              ))}
            </select>
            <select
              value={settings.digest_minute}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('digest_minute', parseInt(e.target.value))}
              style={S.select}>
              {minutes.map(m => (
                <option key={m} value={m}>{m === 0 ? ':00' : `:${m}`}</option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {settings.timezone.split('/')[1]?.replace('_', ' ')}
            </span>
            {savedField === 'digest_hour' || savedField === 'digest_minute'
              ? <span style={S.saved}>Saved</span> : null}
          </div>
        )}
      </div>

      {/* Sync limit */}
      <div style={S.card}>
        <div style={S.label}>Emails per sync {savedField === 'sync_limit' && <span style={S.saved}>Saved</span>}</div>
        <div style={S.sub}>How many email threads to pull each time you sync. Higher = more coverage, more AI cost.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[10, 25, 50, 100].map(limit => (
            <button
              key={limit}
              onClick={() => update('sync_limit', limit)}
              style={{
                padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                background: settings.sync_limit === limit ? 'var(--accent)' : 'var(--bg)',
                color:      settings.sync_limit === limit ? '#fff' : 'var(--muted)',
                border:     `1px solid ${settings.sync_limit === limit ? 'var(--accent)' : 'var(--border2)'}`,
                fontFamily: 'var(--sans)', fontWeight: 500,
                transition: 'all .15s',
              }}>
              {limit}
            </button>
          ))}
        </div>
      </div>

      {/* Keyword filters */}
      <div style={S.card}>
        <div style={S.label}>Keyword filter {savedField === 'keyword_filters' && <span style={S.saved}>Saved</span>}</div>
        <div style={S.sub}>Only sync emails containing these keywords. Leave empty to sync all. Comma-separated.</div>
        <textarea
          value={keywords}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setKeywords(e.target.value)}
          onBlur={() => {
            const filters = keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
            update('keyword_filters', filters)
          }}
          placeholder="proposal, contract, invoice, quote, agreement, pricing"
          style={{
            width: '100%', background: 'var(--bg)',
            border: '1px solid var(--border2)', borderRadius: 8,
            padding: '10px 12px', fontSize: 13, fontFamily: 'var(--mono)',
            color: 'var(--text)', resize: 'none', height: 72, outline: 'none',
          }}
        />
      </div>

      {/* Data retention */}
      <div style={S.card}>
        <div style={S.label}>Data retention {savedField === 'retention_days' && <span style={S.saved}>Saved</span>}</div>
        <div style={S.sub}>How long to keep email snapshots. Older snapshots are deleted automatically.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ days: 30, label: '30 days', hint: 'Free' }, { days: 90, label: '90 days', hint: 'Pro' }, { days: 365, label: '1 year', hint: 'Power' }].map(opt => (
            <button
              key={opt.days}
              onClick={() => update('retention_days', opt.days)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                background: settings.retention_days === opt.days ? 'var(--accent)' : 'var(--bg)',
                color:      settings.retention_days === opt.days ? '#fff' : 'var(--muted)',
                border:     `1px solid ${settings.retention_days === opt.days ? 'var(--accent)' : 'var(--border2)'}`,
                fontFamily: 'var(--sans)', fontWeight: 500, transition: 'all .15s',
              }}>
              {opt.label}
              <span style={{ fontSize: 10, opacity: .7, marginLeft: 5 }}>({opt.hint})</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--border2)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 19 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left .2s',
      }} />
    </button>
  )
}
