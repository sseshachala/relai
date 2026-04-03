import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()

  // Return defaults if not set yet
  const defaults = {
    user_id:              user.id,
    timezone:             'America/Chicago',
    digest_hour:          7,
    digest_minute:        30,
    email_digest_enabled: true,
    sync_limit:           10,
    keyword_filters:      [],
    retention_days:       30,
  }

  return NextResponse.json({ settings: data ?? defaults })
}

export async function PATCH(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase.from('user_settings').upsert({
    user_id:    user.id,
    updated_at: new Date().toISOString(),
    ...body,
  }, { onConflict: 'user_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
