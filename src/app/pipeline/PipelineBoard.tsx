'use client'
import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Contact } from '@/types'
import DealDrawer from './DealDrawer'

// ── Types ─────────────────────────────────────────────────────────────
interface LinkedContact {
  contact_id: string
  role: string
  contacts: { id: string; name: string | null; email: string | null; company: string | null } | null
}

interface DealRow {
  id:           string
  summary:      string | null
  deal_stage:   string | null
  urgency:      string | null
  confidence:   number | null
  next_action:  string | null
  sentiment:    string | null
  thread_id:    string | null
  thread_text:  string | null
  created_at:   string
  user_id:      string
  is_deal:      boolean
  deal_contacts?: LinkedContact[]
}

// ── Constants ─────────────────────────────────────────────────────────
const STAGES: { key: string; label: string; accent: string }[] = [
  { key: 'prospect', label: 'Prospect', accent: 'var(--accent)' },
  { key: 'active',   label: 'Active',   accent: 'var(--green)'  },
  { key: 'stalled',  label: 'Stalled',  accent: 'var(--amber)'  },
  { key: 'closed',   label: 'Closed',   accent: 'var(--muted)'  },
]

const URG: Record<string, string> = {
  high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)',
}

function getPrimaryContact(deal: DealRow) {
  if (!deal.deal_contacts?.length) return null
  const primary = deal.deal_contacts.find(dc => dc.role === 'primary') ?? deal.deal_contacts[0]
  return primary?.contacts ?? null
}

// ── Deal Card ─────────────────────────────────────────────────────────
function DealCard({ deal, accent, onClick }: { deal: DealRow; accent: string; onClick: () => void; key?: string }) {
  const conf      = Math.round((deal.confidence ?? 0) * 100)
  const urg       = deal.urgency ?? 'low'
  const urgColor  = URG[urg] ?? 'var(--green)'
  const contact   = getPrimaryContact(deal)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        transition: 'border-color .15s, transform .1s',
      }}
      onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseOut={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Urgency + confidence */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: urgColor }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{urg}</span>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>{conf}%</span>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 6 }}>
        {(deal.summary ?? 'Deal').slice(0, 55)}{(deal.summary?.length ?? 0) > 55 ? '…' : ''}
      </div>

      {/* Contact */}
      {contact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>
            {(contact.name ?? contact.email ?? '?')[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {contact.name ?? contact.email}
            {contact.company ? ` · ${contact.company}` : ''}
          </span>
        </div>
      )}

      {/* Confidence bar */}
      <div style={{ height: 2, background: 'var(--bg2)', borderRadius: 1, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${conf}%`, background: accent, borderRadius: 1 }} />
      </div>

      {/* Next action */}
      {deal.next_action && (
        <div style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {deal.next_action.slice(0, 60)}{deal.next_action.length > 60 ? '…' : ''}
        </div>
      )}

      <div style={{ marginTop: 6, fontSize: 10, color: accent, fontFamily: 'var(--mono)' }}>Edit →</div>
    </div>
  )
}

// ── Pipeline Board ────────────────────────────────────────────────────
export default function PipelineBoard({
  deals,
  contacts,
}: {
  deals:    DealRow[]
  contacts: Contact[]
}) {
  const router = useRouter()
  const [drawerDeal,  setDrawerDeal]  = useState<DealRow | null | 'new'>(null)
  const [showDead,    setShowDead]    = useState(false)

  const liveDeals = deals.filter(d => d.deal_stage !== 'dead')
  const deadDeals = deals.filter(d => d.deal_stage === 'dead')

  const onSaved = useCallback(() => { router.refresh() }, [router])

  if (!deals.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
        <div style={{ width: 44, height: 44, border: '1px solid var(--border2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="16" rx="2" stroke="#8a8680" strokeWidth="1.3" fill="none"/><rect x="11" y="2" width="7" height="10" rx="2" stroke="#8a8680" strokeWidth="1.3" fill="none"/></svg>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 280, margin: '0 auto 20px' }}>
          No deals yet. Sync your Gmail to automatically detect commercial opportunities, or add one manually.
        </p>
        <button onClick={() => setDrawerDeal('new')} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          + Add deal
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>Pipeline</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
            {liveDeals.length} active deal{liveDeals.length !== 1 ? 's' : ''}
            {deadDeals.length > 0 && ` · ${deadDeals.length} dead`}
          </p>
        </div>
        <button onClick={() => setDrawerDeal('new')} style={{
          padding: '9px 18px', background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          + Add deal
        </button>
      </div>

      {/* Live columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start', minWidth: 700 }}>
        {STAGES.map(({ key, label, accent }) => {
          const col = liveDeals.filter(d => d.deal_stage === key)
          return (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--mono)' }}>{label}</span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{col.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.length === 0 ? (
                  <div style={{ height: 52, border: '1px dashed var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>empty</span>
                  </div>
                ) : (
                  col.map(deal => (
                    <DealCard key={deal.id} deal={deal} accent={accent} onClick={() => setDrawerDeal(deal)} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dead deals section */}
      {deadDeals.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => setShowDead(!showDead)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', marginBottom: 10 }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--mono)' }}>
              Dead · {deadDeals.length}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>{showDead ? '▴' : '▾'}</span>
          </button>

          {showDead && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, opacity: 0.55 }}>
              {deadDeals.map(deal => (
                <DealCard key={deal.id} deal={deal} accent="var(--red)" onClick={() => setDrawerDeal(deal)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      {drawerDeal !== null && (
        <DealDrawer
          deal={drawerDeal === 'new' ? null : drawerDeal as unknown as Parameters<typeof DealDrawer>[0]['deal']}
          contacts={contacts}
          onClose={() => setDrawerDeal(null)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
