import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

// GET /api/deals — list all deals with linked contacts
export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      deal_contacts (
        id, role, contact_id,
        contacts ( id, name, email, company, role, sentiment )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deals: data ?? [] })
}

// POST /api/deals — create a deal with optional contact links
export async function POST(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { contact_ids, ...dealFields } = body

  const { data: deal, error } = await supabase
    .from('deals')
    .insert({ ...dealFields, user_id: user.id, is_deal: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Link contacts if provided
  if (contact_ids?.length) {
    await linkContacts(supabase, deal.id, contact_ids)
  }

  return NextResponse.json({ deal })
}

// PATCH /api/deals — update a deal and its contact links
export async function PATCH(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, contact_ids, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing deal id' }, { status: 400 })

  const { data: deal, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace contact links if provided
  if (contact_ids !== undefined) {
    await supabase.from('deal_contacts').delete().eq('deal_id', id)
    if (contact_ids.length) {
      await linkContacts(supabase, id, contact_ids)
    }
  }

  return NextResponse.json({ deal })
}

// DELETE /api/deals — permanently delete a deal
export async function DELETE(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing deal id' }, { status: 400 })

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ── Helper ─────────────────────────────────────────────────────────────
async function linkContacts(
  supabase: ReturnType<typeof createClient>,
  dealId: string,
  contactIds: { id: string; role?: string }[]
) {
  const rows = contactIds.map((c, i) => ({
    deal_id:    dealId,
    contact_id: c.id,
    role:       c.role ?? (i === 0 ? 'primary' : 'stakeholder'),
  }))
  await supabase.from('deal_contacts').upsert(rows, { onConflict: 'deal_id,contact_id' })
}
