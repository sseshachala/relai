'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Deal, Contact, DealStage, Urgency } from '@/types'

interface LinkedContact {
  id:   string
  role: 'primary' | 'stakeholder' | 'cc'
  contacts: { id: string; name: string | null; email: string | null; company: string | null } | null
}

interface Props {
  deal:       Deal | null          // null = new deal
  contacts:   Contact[]
  onClose:    () => void
  onSaved:    () => void
}

const STAGES: { value: DealStage; label: string; color: string }[] = [
  { value: 'prospect', label: 'Prospect', color: 'var(--accent)' },
  { value: 'active',   label: 'Active',   color: 'var(--green)'  },
  { value: 'stalled',  label: 'Stalled',  color: 'var(--amber)'  },
  { value: 'closed',   label: 'Closed',   color: 'var(--muted)'  },
  { value: 'dead',     label: 'Dead',     color: 'var(--red)'    },
]

const URGENCIES: { value: Urgency; label: string }[] = [
  { value: 'high',   label: 'High'   },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low'    },
]

export default function DealDrawer({ deal, contacts, onClose, onSaved }: Props) {
  const isNew = !deal

  const [summary,     setSummary]     = useState(deal?.summary     ?? '')
  const [stage,       setStage]       = useState<DealStage>(deal?.deal_stage ?? 'prospect')
  const [urgency,     setUrgency]     = useState<Urgency>(deal?.urgency     ?? 'medium')
  const [nextAction,  setNextAction]  = useState(deal?.next_action  ?? '')
  const [linkedIds,   setLinkedIds]   = useState<{ id: string; role: 'primary'|'stakeholder'|'cc' }[]>([])
  const [search,      setSearch]      = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [showDelete,  setShowDelete]  = useState(false)

  // Load existing linked contacts for edit mode
  useEffect(() => {
    if (!deal) return
    fetch(`/api/deals/${deal.id}/contacts`)
      .then(r => r.json())
      .then(data => {
        if (data.contacts) {
          setLinkedIds(data.contacts.map((c: LinkedContact) => ({
            id:   c.contacts?.id ?? '',
            role: c.role,
          })).filter((c: { id: string }) => c.id))
        }
      })
      .catch(() => {})
  }, [deal])

  const filteredContacts = contacts.filter(c => {
    if (linkedIds.find((l: { id: string }) => l.id === c.id)) return false
    const q = search.toLowerCase()
    return (c.name ?? '').toLowerCase().includes(q)
        || (c.email ?? '').toLowerCase().includes(q)
        || (c.company ?? '').toLowerCase().includes(q)
  }).slice(0, 8)

  function addContact(c: Contact) {
    const role = linkedIds.length === 0 ? 'primary' : 'stakeholder'
    setLinkedIds((prev: { id: string; role: "primary"|"stakeholder"|"cc" }[]) => [...prev, { id: c.id, role }])
    setSearch('')
  }

  function removeContact(id: string) {
    setLinkedIds((prev: { id: string; role: "primary"|"stakeholder"|"cc" }[]) => prev.filter((c: { id: string }) => c.id !== id))
  }

  function getContact(id: string) {
    return contacts.find(c => c.id === id)
  }

  async function save() {
    if (!summary.trim()) { setError('Summary is required'); return }
    setSaving(true); setError(null)
    try {
      const body = {
        summary,
        deal_stage:  stage,
        urgency,
        next_action: nextAction || null,
        contact_ids: linkedIds,
        ...(deal ? { id: deal.id } : {}),
      }
      const res = await fetch('/api/deals', {
        method:  deal ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deleteDeal() {
    if (!deal) return
    setSaving(true)
    try {
      await fetch('/api/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deal.id }),
      })
      onSaved(); onClose()
    } catch { setError('Delete failed') } finally { setSaving(false) }
  }

  async function markDead() {
    if (!deal) return
    setSaving(true)
    try {
      await fetch('/api/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deal.id, deal_stage: 'dead' }),
      })
      onSaved(); onClose()
    } catch { setError('Failed') } finally { setSaving(false) }
  }

  const S = {
    label: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 6, display: 'block' },
    input: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--text)', outline: 'none' },
    card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px', marginBottom: 14 },
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 440,
        background: 'var(--bg)', borderLeft: '1px solid var(--border)',
        zIndex: 50, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{isNew ? 'Add deal' : 'Edit deal'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', flex: 1 }}>

          {error && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(212,68,68,.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Summary */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Deal summary *</label>
            <textarea
              value={summary}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(e.target.value)}
              placeholder="e.g. FreshFields Q3 bulk organic order — 2 tons monthly"
              rows={3}
              style={{ ...S.input, resize: 'none', lineHeight: 1.6 }}
            />
          </div>

          {/* Stage + Urgency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={S.label}>Stage</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STAGES.map(s => (
                  <button key={s.value} onClick={() => setStage(s.value)} style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    background: stage === s.value ? 'var(--accent-dim)' : 'var(--bg)',
                    border: `1px solid ${stage === s.value ? s.color : 'var(--border2)'}`,
                    color: stage === s.value ? s.color : 'var(--muted)',
                    fontFamily: 'var(--sans)', fontWeight: stage === s.value ? 600 : 400,
                    transition: 'all .15s',
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Urgency</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {URGENCIES.map(u => {
                  const col = u.value === 'high' ? 'var(--red)' : u.value === 'medium' ? 'var(--amber)' : 'var(--green)'
                  return (
                    <button key={u.value} onClick={() => setUrgency(u.value)} style={{
                      padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      background: urgency === u.value ? 'var(--accent-dim)' : 'var(--bg)',
                      border: `1px solid ${urgency === u.value ? col : 'var(--border2)'}`,
                      color: urgency === u.value ? col : 'var(--muted)',
                      fontFamily: 'var(--sans)', fontWeight: urgency === u.value ? 600 : 400,
                      transition: 'all .15s',
                    }}>
                      {u.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Next action */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Next action</label>
            <input
              type="text"
              value={nextAction}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNextAction(e.target.value)}
              placeholder="e.g. Send proposal by Friday"
              style={S.input}
            />
          </div>

          {/* Contact picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Linked contacts</label>

            {/* Linked contact chips */}
            {linkedIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {linkedIds.map((l: { id: string; role: string }, i: number) => {
                  const c = getContact(l.id)
                  return (
                    <div key={l.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '4px 10px 4px 8px', fontSize: 12,
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--border2)', color: i === 0 ? '#fff' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                        {(c?.name ?? '?')[0].toUpperCase()}
                      </div>
                      <span style={{ color: 'var(--text)' }}>{c?.name ?? c?.email ?? 'Unknown'}</span>
                      {i === 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)' }}>primary</span>}
                      <button onClick={() => removeContact(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Search contacts to link…"
              style={{ ...S.input, marginBottom: search ? 6 : 0 }}
            />

            {/* Search results */}
            {search && filteredContacts.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {filteredContacts.map((c, i) => (
                  <div key={c.id} onClick={() => addContact(c)} style={{
                    padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                    onMouseOver={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'var(--bg2)')}
                    onMouseOut={(e: React.MouseEvent<HTMLDivElement>)  => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{c.name ?? c.email}</div>
                      {c.company && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{c.company}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--accent)' }}>+ Add</span>
                  </div>
                ))}
              </div>
            )}

            {search && filteredContacts.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                No contacts found. <a href="/contacts" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Add contact →</a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Save */}
          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '11px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)',
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving…' : isNew ? 'Add deal' : 'Save changes'}
          </button>

          {/* Edit-only actions */}
          {!isNew && (
            <div style={{ display: 'flex', gap: 8 }}>
              {stage !== 'dead' && (
                <button onClick={markDead} disabled={saving} style={{
                  flex: 1, padding: '9px', background: 'transparent',
                  border: '1px solid var(--red)', borderRadius: 8,
                  color: 'var(--red)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)',
                }}>
                  Mark as dead
                </button>
              )}
              {stage === 'dead' && (
                <button onClick={() => setStage('prospect')} style={{
                  flex: 1, padding: '9px', background: 'transparent',
                  border: '1px solid var(--green)', borderRadius: 8,
                  color: 'var(--green)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--sans)',
                }}>
                  Restore deal
                </button>
              )}
              <button
                onClick={() => showDelete ? deleteDeal() : setShowDelete(true)}
                style={{
                  flex: 1, padding: '9px', background: showDelete ? 'var(--red)' : 'transparent',
                  border: '1px solid var(--border2)', borderRadius: 8,
                  color: showDelete ? '#fff' : 'var(--muted)', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'var(--sans)',
                }}>
                {showDelete ? 'Confirm delete' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
