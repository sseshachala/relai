'use client'
import { Deal } from '@/types'

const STAGES = [
  { key: 'prospect', label: 'Prospect', color: 'var(--accent)',  bg: 'var(--accent-dim)' },
  { key: 'active',   label: 'Active',   color: 'var(--green)',   bg: 'var(--green-dim)'  },
  { key: 'stalled',  label: 'Stalled',  color: 'var(--amber)',   bg: 'var(--amber-dim)'  },
  { key: 'closed',   label: 'Closed',   color: 'var(--muted)',   bg: 'var(--bg2)'        },
] as const

export default function PipelineBoard({ deals }: { deals: Deal[] }) {
  const total   = deals.length
  const active  = deals.filter(d => d.deal_stage === 'active').length
  const needs   = deals.filter(d => d.deal_stage === 'stalled' || d.deal_stage === 'prospect').length
  const avgConf = total > 0 ? Math.round(deals.reduce((a, d) => a + (d.confidence ?? 0), 0) / total * 100) : null

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total deals',    value: total,                    sub: 'tracked'        },
          { label: 'Active',         value: active,   color:'var(--green)', sub: 'in negotiation' },
          { label: 'Need attention', value: needs,    color:'var(--amber)', sub: 'stalled or new'  },
          { label: 'Avg confidence', value: avgConf ? avgConf + '%' : '—', sub: 'AI certainty'  },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em', color: s.color ?? 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
          <div style={{ width: 40, height: 40, border: '1px solid var(--border2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M10 4l6 6-6 6" stroke="#8a8680" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 260, margin: '0 auto' }}>No deals yet. Go to <a href="/analyse" style={{ color: 'var(--accent)' }}>Analyse thread</a> and paste an email conversation.</p>
        </div>
      )}

      {/* Kanban */}
      {total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {STAGES.map(stage => {
            const stageDeal = deals.filter(d => d.deal_stage === stage.key)
            return (
              <div key={stage.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 8, background: stage.bg, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: stage.color }}>{stage.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{stageDeal.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stageDeal.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const urg  = deal.urgency ?? 'low'
  const conf = Math.round((deal.confidence ?? 0) * 100)
  const URG: Record<string, string> = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' }
  const urgColor = URG[urg] ?? 'var(--green)'

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
      transition: 'all .15s',
    }}
    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
    onMouseOut={e  => { e.currentTarget.style.borderColor = 'var(--border)';  e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
        {deal.summary?.slice(0, 40) || 'Deal'}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
        {new Date(deal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: urgColor, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{urg}</span>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{conf}%</span>
      </div>
      {deal.next_action && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--mono)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          → {deal.next_action.slice(0, 60)}{deal.next_action.length > 60 ? '…' : ''}
        </div>
      )}
    </div>
  )
}
