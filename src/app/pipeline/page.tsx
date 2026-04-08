import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import PipelineBoard from './PipelineBoard'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals')
      .select(`*, deal_contacts(id, role, contact_id, contacts(id, name, email, company))`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
  ])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar dealCount={deals?.length ?? 0} contactCount={contacts?.length ?? 0} />
      <main style={{ marginLeft: 210, flex: 1, padding: '30px 34px', overflowX: 'auto' }}>
        <PipelineBoard deals={deals ?? []} contacts={contacts ?? []} />
      </main>
    </div>
  )
}
