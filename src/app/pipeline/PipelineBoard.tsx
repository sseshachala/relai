'use client'
import { useRouter } from 'next/navigation'
import { Deal } from '@/types'

const STAGES: { key: string; label: string }[] = [
  { key: 'prospect', label: 'Prospect' },
  { key: 'active',   label: 'Active'   },
  { key: 'stalled',  label: 'Stalled'  },
  { key: 'closed',   label: 'Closed'   },
]

const STAGE_ACCENT: Record<string, string> = {
  prospect: 'var(--accent)',
  active:   'var(--green)',
  stalled:  'var(--amber)',
  closed:   'var(--muted)',
}

const URG: Record<string, string> = {
  high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)',
}

export default function PipelineBoard({ deals }: { deals: Deal[] }) {
  const router = useRouter()

  if (!deals.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
        <div style={{ width: 44, height: 44, border: '1px solid var(--border2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="16" rx="2" stroke="#8a8680" strokeWidth="1.3" fill="none"/><rect x="11" y="2" width="7" height="10" rx="2" stroke="#8a8680" strokeWidth="1.3" fill="none"/></svg>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
          No deals yet. Sync your Gmail to automatically detect commercial opportunities.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
      {STAGES.map(({ key, label }) => {
        const col      = deals.filter(d => d.deal_stage === key)
        const accent   = STAGE_ACCENT[key]
        return (
          <div key={key}>
            {/* Column header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, padding: '0 2px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--mono)' }}>
                  {label}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                {col.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.length === 0 ? (
                <div style={{ height: 52, border: '1px dashed var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>empty</span>
                </div>
              ) : (
                col.map(deal => {
                  const conf     = Math.round((deal.confidence ?? 0) * 100)
                  const urg      = deal.urgency ?? 'low'
                  const urgColor = URG[urg] ?? 'var(--green)'
                  return (
                    <div
                      key={deal.id}
                      onClick={() => router.push(`/deal/${deal.id}`)}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'border-color .15s, transform .1s',
                      }}
                      onMouseOver={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = accent;
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
                      }}
                      onMouseOut={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                      }}
                    >
                      {/* Urgency + confidence */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: urgColor, flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                            {urg}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>
                          {conf}%
                        </span>
                      </div>

                      {/* Summary */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8 }}>
                        {deal.summary?.slice(0, 55) || 'Deal'}
                        {(deal.summary?.length ?? 0) > 55 ? '…' : ''}
                      </div>

                      {/* Confidence bar */}
                      <div style={{ height: 2, background: 'var(--bg2)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', width: `${conf}%`, background: accent, borderRadius: 1 }} />
                      </div>

                      {/* Next action */}
                      {deal.next_action && (
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                          {deal.next_action.slice(0, 60)}{deal.next_action.length > 60 ? '…' : ''}
                        </div>
                      )}

                      {/* View link */}
                      <div style={{ marginTop: 8, fontSize: 10, color: accent, fontFamily: 'var(--mono)' }}>
                        View details →
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
