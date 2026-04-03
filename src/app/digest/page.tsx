import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import DigestClient from './DigestClient'

export const dynamic = 'force-dynamic'

export default async function DigestPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('id').eq('user_id', user.id),
    supabase.from('contacts').select('id').eq('user_id', user.id),
  ])

  const hasData = (deals?.length ?? 0) > 0 || (contacts?.length ?? 0) > 0

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft:210, flex:1, padding:'30px 34px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:26 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-.02em' }}>Daily digest</h1>
            <p style={{ fontSize:13, color:'var(--muted)', marginTop:3 }}>AI-written briefing from your full pipeline and contacts.</p>
          </div>
        </div>
        <DigestClient hasData={hasData} />
      </main>
    </div>
  )
}
