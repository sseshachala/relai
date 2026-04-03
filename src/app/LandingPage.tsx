'use client'
import { createClient } from '@/lib/supabase/client'

const ACCENT  = '#2A5CFF'
const DARK    = '#0D0F10'
const SURFACE = '#161A1D'
const MUTED   = '#7A8085'
const GREEN   = '#00D4A0'
const BORDER  = '#2A2F33'

export default function LandingPage() {
  const supabase = createClient()

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div style={{ background: DARK, minHeight: '100vh', color: '#E8E6E1', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .6s ease forwards; }
        .fade-up-2 { animation: fadeUp .6s .15s ease both; }
        .fade-up-3 { animation: fadeUp .6s .3s ease both; }
        .cta-btn:hover { background: #1a4cef !important; transform: translateY(-1px); }
        .cta-btn { transition: all .2s !important; }
        .feature-card:hover { border-color: ${ACCENT} !important; transform: translateY(-2px); }
        .feature-card { transition: all .2s !important; }
        .step-num { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 0, background: DARK, zIndex: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>Relai</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#how" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>How it works</a>
          <a href="#features" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Features</a>
          <a href="#pricing" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Pricing</a>
          <button onClick={signIn} className="cta-btn" style={{ padding: '8px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Sign in
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '80px 20px 60px', maxWidth: 760, margin: '0 auto' }}>
        <div className="fade-up" style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: GREEN, marginBottom: 20, padding: '4px 14px', border: `1px solid rgba(0,212,160,.25)`, borderRadius: 20 }}>
          Now in early access
        </div>

        <h1 className="fade-up-2" style={{ fontSize: 'clamp(36px, 6vw, 60px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.03em', color: '#fff', marginBottom: 24 }}>
          Your CRM is always<br />
          <span style={{ color: ACCENT }}>out of date.</span><br />
          We fixed that.
        </h1>

        <p className="fade-up-3" style={{ fontSize: 18, color: MUTED, lineHeight: 1.75, marginBottom: 36, maxWidth: 520, margin: '0 auto 36px' }}>
          Relai reads your Gmail and Calendar to build your CRM automatically.
          No data entry. No setup. Every contact, deal, and follow-up — just there.
        </p>

        <div className="fade-up-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={signIn} className="cta-btn" style={{ padding: '14px 28px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GoogleIcon />
            Continue with Google — it's free
          </button>
        </div>

        <p style={{ fontSize: 12, color: MUTED, fontFamily: 'monospace' }}>
          Read-only Gmail access · No credit card · Cancel any time
        </p>
      </section>

      {/* ── Social proof bar ───────────────────────────────────────── */}
      <div style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '14px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {['Zero manual entry', 'Works with any Google domain', 'AI-powered deal detection', 'Your data stays yours'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUTED }}>
              <span style={{ color: GREEN, fontSize: 14 }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how" style={{ padding: '80px 20px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 10 }}>How it works</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>Three steps. Zero manual work.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { n: '01', title: 'Connect', body: 'Sign in with Google. One click. Gmail and Calendar access in 30 seconds. Read-only — we never send emails on your behalf.' },
            { n: '02', title: 'Watch it build', body: 'Relai analyses your recent emails with Claude AI. Contacts extracted, deals detected, sentiment classified. Your pipeline populates itself.' },
            { n: '03', title: 'Stay ahead', body: 'New emails sync every 15 minutes. Every morning your AI digest tells you exactly who needs attention today — before you even open your inbox.' },
          ].map(step => (
            <div key={step.n} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '24px 22px' }}>
              <div className="step-num" style={{ fontSize: 36, fontWeight: 800, color: ACCENT, marginBottom: 12, lineHeight: 1 }}>{step.n}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 10 }}>What you get</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>Four views. One truth.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { icon: '▣', title: 'Deal Pipeline', body: 'Kanban board that builds itself. Prospect → Active → Stalled → Closed. Every card sourced from email context, not your memory.' },
            { icon: '◎', title: 'Contacts', body: 'Every person you have emailed, automatically profiled. Name, company, role, sentiment, last topic. Updated every 15 minutes.' },
            { icon: '⬡', title: 'Meetings', body: 'Today\'s calendar with email context automatically linked. Walk into every call knowing what was last discussed.' },
            { icon: '≡', title: 'Daily Digest', body: 'One email every morning. Who needs a reply. Which deals are slipping. One relationship worth rekindling. Written like a real EA.' },
          ].map(f => (
            <div key={f.title} className="feature-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '22px 20px', cursor: 'default' }}>
              <div style={{ fontSize: 24, marginBottom: 12, color: ACCENT }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT, marginBottom: 10 }}>Pricing</div>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em', color: '#fff' }}>Simple. No surprises.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 700, margin: '0 auto' }}>
          {/* Free */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '28px 24px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: MUTED, marginBottom: 12 }}>Free trial</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>14 days, full access</div>
            {['10 emails per sync', '50 contacts', 'AI deal detection', 'Daily digest', '30-day retention'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: MUTED, marginBottom: 8 }}>
                <span style={{ color: GREEN }}>✓</span> {f}
              </div>
            ))}
            <button onClick={signIn} className="cta-btn" style={{ marginTop: 24, width: '100%', padding: '11px', background: 'transparent', color: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Start free
            </button>
          </div>

          {/* Pro */}
          <div style={{ background: SURFACE, border: `2px solid ${ACCENT}`, borderRadius: 16, padding: '28px 24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: ACCENT, color: '#fff', fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 12px', borderRadius: 20 }}>
              Most popular
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>Pro</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 4 }}>$19<span style={{ fontSize: 16, fontWeight: 400, color: MUTED }}>/mo</span></div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>Everything you need</div>
            {['Up to 100 emails per sync', 'Unlimited contacts', 'AI deal detection', 'Daily digest email', '90-day retention', 'Keyword filters', 'Calendar intelligence'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#E8E6E1', marginBottom: 8 }}>
                <span style={{ color: GREEN }}>✓</span> {f}
              </div>
            ))}
            <button onClick={signIn} className="cta-btn" style={{ marginTop: 24, width: '100%', padding: '11px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Start free trial
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '60px 20px 80px', borderTop: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.02em', color: '#fff', marginBottom: 12 }}>
          Ready to close more deals?
        </h2>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 32 }}>
          Connect your Gmail. Your pipeline builds itself in under 60 seconds.
        </p>
        <button onClick={signIn} className="cta-btn" style={{ padding: '14px 32px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <GoogleIcon />
          Get started free
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: MUTED }}>© 2026 Relai · prelai.org</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="/privacy" style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms"   style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>Terms of Use</a>
        </div>
      </footer>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
