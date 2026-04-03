import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: threads }, { data: events }] = await Promise.all([
    supabase
      .from('email_threads')
      .select('id, subject, snippet, from_email, date, was_analysed, is_deal, deal_stage')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50),
    supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, attendees')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({ threads: threads ?? [], events: events ?? [] })
}
