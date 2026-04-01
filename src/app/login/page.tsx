'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
      },
    })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-.02em', marginBottom:8 }}>Relai</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:40 }}>
          AI Relationship Intelligence
        </div>
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
            cursor:'pointer', transition:'background .15s'
          }}
          onMouseOver={e=>(e.currentTarget.style.background='#1a4cef')}
          onMouseOut={e=>(e.currentTarget.style.background='var(--accent)')}
        >
          Continue with Google
        </button>
        <p style={{ fontSize:11, color:'var(--muted)', marginTop:16, fontFamily:'var(--mono)' }}>
          Read-only access · Your data never leaves your account
        </p>
      </div>
    </div>
  )
}
