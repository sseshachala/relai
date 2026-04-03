import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: config } = await supabase
    .from('sync_config')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Return defaults if no config yet
  return NextResponse.json({
    config: config ?? {
      enabled:          true,
      lookback_days:    30,
      max_threads:      10,
      include_calendar: true,
      keywords:         [],
      schedule_mins:    15,
    }
  })
}

export async function POST(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { error } = await supabase.from('sync_config').upsert({
    user_id:          user.id,
    enabled:          body.enabled          ?? true,
    lookback_days:    body.lookback_days    ?? 30,
    max_threads:      body.max_threads      ?? 10,
    include_calendar: body.include_calendar ?? true,
    keywords:         body.keywords         ?? [],
    schedule_mins:    body.schedule_mins    ?? 15,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
