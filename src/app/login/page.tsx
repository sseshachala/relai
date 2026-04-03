'use client'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function LoginContent() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const error        = searchParams.get('error')

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
      },
    })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center', maxWidth:360, padding:'0 20px' }}>
        <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-.02em', marginBottom:8 }}>Relai</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:40 }}>
          AI Relationship Intelligence
        </div>

        {error && (
          <div style={{ background:'var(--red-dim)', border:'1px solid rgba(212,68,68,.2)', borderRadius:10, padding:'12px 16px', marginBottom:24, fontSize:13, color:'var(--red)', fontFamily:'var(--mono)' }}>
            Auth error: {error}
          </div>
        )}

        <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:32 }}>
          Connect your Gmail and Calendar. Relai builds your CRM automatically — no manual entry.
        </p>

        <button
          onClick={signInWithGoogle}
          style={{
            width:'100%', padding:'13px 24px',
            background:'var(--accent)', color:'#fff',
            border:'none', borderRadius:10,
            fontFamily:'var(--sans)', fontSize:14, fontWeight:500,
            cursor:'pointer',
          }}
        >
          Continue with Google
        </button>

        <p style={{ fontSize:11, color:'var(--muted)', marginTop:16, fontFamily:'var(--mono)' }}>
          Read-only access · Your data never leaves your account
        </p>

        <div style={{ marginTop:20, display:'flex', gap:20, justifyContent:'center' }}>
          <a href="/privacy" style={{ fontSize:11, color:'#8a8680', textDecoration:'none' }}>Privacy Policy</a>
          <a href="/terms"   style={{ fontSize:11, color:'#8a8680', textDecoration:'none' }}>Terms of Use</a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

