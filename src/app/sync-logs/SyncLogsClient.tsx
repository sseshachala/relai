'use client'
import { useState } from 'react'
import { SyncRun, ThreadSnapshot } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  success: 'var(--green)',
  partial: 'var(--amber)',
  failed:  'var(--red)',
  running: 'var(--accent)',
}
const STATUS_BG: Record<string, string> = {
  success: 'var(--green-dim)',
  partial: 'var(--amber-dim)',
  failed:  'var(--red-dim)',
  running: 'var(--accent-dim)',
}

export default function SyncLogsClient({ initialRuns }: { initialRuns: SyncRun[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (!initialRuns.length) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
        <p style={{ fontSize: 13, lineHeight: 1.7 }}>No sync runs yet. Click "Sync Gmail now" in the sidebar to get started.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {initialRuns.map(run => {
        const isExpanded = expanded === run.id
        const snapshots  = (run.thread_snapshots ?? []) as ThreadSnapshot[]
        const failed     = snapshots.filter(s => s.processing_status === 'failed')
        const duration   = run.completed_at
          ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
          : null

        return (
          <div key={run.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Run header */}
            <div
              onClick={() => setExpanded(isExpanded ? null : run.id)}
              style={{
                padding: '14px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
              {/* Status badge */}
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em',
                textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20,
                background: STATUS_BG[run.status] ?? 'var(--bg2)',
                color: STATUS_COLOR[run.status] ?? 'var(--muted)',
                flexShrink: 0,
              }}>
                {run.status}
              </span>

              {/* Date */}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                {new Date(run.started_at).toLocaleString('en-US', {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>

              {/* Trigger */}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                {run.trigger}
              </span>

              {/* Stats */}
              <div style={{ flex: 1, display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--muted)' }}>{run.threads_processed} threads</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{run.deals_found} deals</span>
                <span style={{ color: 'var(--accent)' }}>{run.contacts_found} contacts</span>
                {failed.length > 0 && (
                  <span style={{ color: 'var(--red)' }}>{failed.length} failed</span>
                )}
              </div>

              {/* Duration */}
              {duration !== null && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                  {duration}s
                </span>
              )}

              {/* Expand chevron */}
              <span style={{ color: 'var(--muted)', fontSize: 12, transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                ▾
              </span>
            </div>

            {/* Expandable thread detail */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '0 18px 14px' }}>
                {run.error_message && (
                  <div style={{ margin: '10px 0', padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 8, fontSize: 12, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                    Run error: {run.error_message}
                  </div>
                )}
                {snapshots.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 12 }}>No thread detail available for this run.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {snapshots.map((snap, i) => (
                      <div key={snap.id} style={{
                        padding: '10px 0', display: 'flex', alignItems: 'flex-start', gap: 12,
                        borderBottom: i < snapshots.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        {/* Status dot */}
                        <div style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                          background: snap.processing_status === 'success' ? 'var(--green)'
                            : snap.processing_status === 'failed' ? 'var(--red)' : 'var(--muted)',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                            {snap.subject || '(no subject)'}
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                            {snap.participants?.slice(0, 3).join(', ') || '—'}
                          </div>
                          {snap.error_message && (
                            <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3, fontFamily: 'var(--mono)' }}>
                              Error: {snap.error_message}
                            </div>
                          )}
                          {snap.preview_text && (
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, fontStyle: 'italic' }}>
                              {snap.preview_text.slice(0, 120)}…
                            </div>
                          )}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', flexShrink: 0 }}>
                          {snap.date_from ? new Date(snap.date_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
