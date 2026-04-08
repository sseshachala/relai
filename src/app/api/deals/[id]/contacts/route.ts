import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('deal_contacts')
    .select('id, role, contact_id, contacts(id, name, email, company, role, sentiment)')
    .eq('deal_id', params.id)

  return NextResponse.json({ contacts: data ?? [] })
}
