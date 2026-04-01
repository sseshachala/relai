'use client'
import { useState, useRef } from 'react'
import { DealAnalysis } from '@/types'

const MAX_CHARS = 6000

const EXAMPLES = {
  hot: `From: Sarah Chen <sarah.chen@techwave.io>
To: alex@mycompany.com
Subject: RE: Enterprise proposal — ready to sign

Thanks for sending the proposal. Legal reviewed it and they're comfortable with the terms.

One question: does the $48,000/year include the implementation support mentioned on the call?

If yes, I can get the PO raised by end of week. Q2 budget closes Friday.

Sarah Chen, VP of Operations, TechWave`,

  stalled: `From: alex@mycompany.com
To: james.morton@buildright.co
Subject: Following up — third attempt

Hi James, following up again. We sent custom pricing on March 3rd and haven't heard back.

---
From: James Morton
Date: March 15

Alex, sorry for the silence. Things are hectic. I'll get back to you next week. James`,

  proposal: `From: alex@mycompany.com
To: priya.nair@scalestartup.com
Subject: Proposal — Growth Analytics Platform

Hi Priya, great meeting you. Here's the proposal.

Growth package: $2,800/month (unlimited users + API). Starter: $1,200/month.
One-time setup: $4,500.

Given your team size and API requirements, Growth is the right fit. Happy to jump on a call.`,

  noise: `From: newsletter@saasweekly.io
Subject: This week in SaaS

Hi there, here's what's trending: AI pricing models evolving fast, PLG vs SLG debate continues.
Thanks for subscribing. The SaaS Weekly Team`,
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function AnalyseForm() {
  const [thread,   setThread]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<DealAnalysis | null>(null)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charCount   = thread.length
  const overLimit   = charCount > MAX_CHARS

  function loadExample(key: keyof typeof EXAMPLES) {
    setThread(EXAMPLES[key])
    setResult(null); setError(null); setSaved(false)
  }

  function trimThread() {
    if (thread.length <= MAX_CHARS) return
    const half = Math.floor(MAX_CHARS / 2)
    setThread(thread.slice(0, half) + '\n\n[... middle omitted ...]\n\n' + thread.slice(-half))
  }

  async function analyse() {
    if (!thread.trim()) { textareaRef.current?.focus(); return }
    setLoading(true); setError(null); setResult(null); setSaved(false)
    try {
      const res  = await fetch('/api/analyse', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ thread }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setResult(json.data)
      setSaved(json.saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
      {/* Left — input */}
      <div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.keys(EXAMPLES).map(k => (
            <button key={k} onClick={() => loadExample(k as keyof typeof EXAMPLES)} style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 11px',
              borderRadius: 20, border: '1px solid var(--border2)',
              background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
            }}>
              {k === 'hot' ? 'Hot lead' : k === 'stalled' ? 'Stalled deal' : k === 'proposal' ? 'Proposal sent' : 'Not a deal'}
            </button>
          ))}
          {overLimit && (
            <button onClick={trimThread} style={{
              fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 11px',
              borderRadius: 20, border: '1px solid var(--amber)',
              background: 'transparent', color: 'var(--amber)', cursor: 'pointer', marginLeft: 'auto',
            }}>
              Trim to 6k
            </button>
          )}
        </div>

        <textarea
          ref={textareaRef}
          value={thread}
          onChange={e => { setThread(e.target.value); setResult(null); setError(null) }}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') analyse() }}
          placeholder={'Paste an email thread here...\n\nTip: click an example above, or use ⌘+Enter to analyse.'}
          style={{
            width: '100%', background: 'var(--bg)', border: `1px solid ${overLimit ? 'var(--amber)' : 'var(--border2)'}`,
            borderRadius: 10, color: 'var(--text)', fontFamily: 'var(--mono)',
            fontSize: 11.5, lineHeight: 1.75, padding: '14px 16px',
            resize: 'vertical', minHeight: 260, outline: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: overLimit ? 'var(--amber)' : 'var(--muted)' }}>
            {charCount.toLocaleString()} chars {overLimit ? '— over limit, will be trimmed' : ''}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>⌘+Enter</span>
        </div>

        <button
          onClick={analyse}
          disabled={loading || !thread.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', background: loading ? 'var(--bg2)' : 'var(--accent)',
            color: loading ? 'var(--muted)' : '#fff',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
            justifyContent: 'center',
          }}
        >
          {loading && <Spinner />}
          {loading ? 'Analysing…' : 'Analyse & save to pipeline'}
        </button>
      </div>

      {/* Right — result */}
      <div>
        {!result && !error && !loading && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
            <div style={{ width: 40, height: 40, border: '1px solid var(--border2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="#8a8680" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 240, margin: '0 auto' }}>Intelligence report appears here. Confirmed deals save automatically.</p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>
            <Spinner color="var(--accent)" /> Claude is reading your thread…
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(212,68,68,.25)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--red)' }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button onClick={analyse} style={{ padding: '7px 14px', border: '1px solid var(--border2)', borderRadius: 8, background: 'var(--surface)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)' }}>Try again</button>
            </div>
          </div>
        )}

        {result && (
          <ResultPanel data={result} saved={saved} />
        )}
      </div>
    </div>
  )
}

function ResultPanel({ data, saved }: { data: DealAnalysis; saved: boolean }) {
  const conf      = Math.round((data.confidence ?? 0) * 100)
  const isDeal    = data.is_deal
  const STAGE_COLORS: Record<string, string> = { prospect:'var(--accent)', active:'var(--green)', stalled:'var(--amber)', closed:'var(--muted)' }
  const URG_COLORS:   Record<string, string> = { high:'var(--red)', medium:'var(--amber)', low:'var(--green)' }
  const stageCol = data.deal_stage ? (STAGE_COLORS[data.deal_stage] ?? 'var(--muted)') : 'var(--muted)'
  const urgCol   = data.urgency    ? (URG_COLORS[data.urgency]      ?? 'var(--muted)') : 'var(--muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{
        borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: isDeal ? 'var(--green-dim)' : 'var(--bg2)',
        border: `1px solid ${isDeal ? 'rgba(26,158,106,.2)' : 'var(--border)'}`,
      }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', padding:'3px 9px', borderRadius:20, background: isDeal?'var(--green-dim)':'var(--bg2)', color:isDeal?'var(--green)':'var(--muted)', border:`1px solid ${isDeal?'rgba(26,158,106,.3)':'var(--border2)'}` }}>
          {isDeal ? 'Deal signal' : 'No deal'}
        </span>
        <span style={{ fontSize:13, fontWeight:600, flex:1 }}>
          {isDeal ? (data.deal_stage ? data.deal_stage.charAt(0).toUpperCase()+data.deal_stage.slice(1)+' stage' : 'Opportunity') : 'No commercial signal'}
        </span>
        <span style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--muted)' }}>{conf}%</span>
      </div>

      {/* Confidence bar */}
      <div style={{ height:3, background:'var(--bg2)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${conf}%`, background:'var(--green)', borderRadius:2, transition:'width .9s cubic-bezier(.16,1,.3,1)' }} />
      </div>

      {/* Metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          { label:'Stage',     value: data.deal_stage ?? '—', color: stageCol },
          { label:'Urgency',   value: data.urgency ?? '—',    color: urgCol   },
          { label:'Sentiment', value: data.sentiment,          color: 'var(--text)' },
        ].map(m => (
          <div key={m.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 13px' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:13, fontWeight:600, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'13px 15px' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>Summary</div>
          <div style={{ fontSize:13, lineHeight:1.6, fontFamily:'var(--serif)', fontStyle:'italic' }}>{data.summary}</div>
        </div>
      )}

      {/* Next action */}
      {data.next_action && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'13px 15px' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>Recommended next action</div>
          <div style={{ fontSize:13, lineHeight:1.6 }}>{data.next_action}</div>
        </div>
      )}

      {/* Contacts */}
      {data.contacts.length > 0 && (
        <div>
          <div style={{ fontFamily:'var(--mono)', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Contacts extracted</div>
          {data.contacts.map((c, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:30, height:30, borderRadius:8, background:'var(--accent-dim)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
                {initials(c.name)}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600 }}>{c.name ?? '?'}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--muted)' }}>
                  {[c.email, c.company, c.role].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved confirmation */}
      {saved && (
        <div style={{ background:'var(--green-dim)', border:'1px solid rgba(26,158,106,.2)', borderRadius:8, padding:'11px 13px', fontSize:12, color:'var(--green)' }}>
          Saved to pipeline → <strong>{data.deal_stage}</strong> column
        </div>
      )}
    </div>
  )
}

function Spinner({ color = '#fff' }: { color?: string }) {
  return (
    <div style={{
      width:14, height:14, border:`2px solid rgba(0,0,0,.1)`,
      borderTopColor: color, borderRadius:'50%',
      animation:'spin .7s linear infinite', flexShrink:0,
    }} />
  )
}
