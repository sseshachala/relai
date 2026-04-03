'use client'
import React from 'react'
import Link from 'next/link'

interface Props {
  id:         string
  summary:    string | null
  deal_stage: string | null
  created_at: string
  key?:       string  // React key — not used in component
}

export default function DealRow({ id, summary, deal_stage, created_at }: Props) {
  return (
    <Link href={`/deal/${id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color .15s' }}
        onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseOut={(e: React.MouseEvent<HTMLDivElement>)  => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {summary?.slice(0, 60) || 'Deal'}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
            {new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg2)', color: 'var(--muted)' }}>
          {deal_stage ?? '—'}
        </span>
        <span style={{ color: 'var(--accent)', fontSize: 12 }}>→</span>
      </div>
    </Link>
  )
}
