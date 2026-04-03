import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Runs every 30 minutes — checks which users are due for their digest email
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all users with email digest enabled
  const { data: allSettings } = await supabase
    .from('user_settings')
    .select('user_id, timezone, digest_hour, digest_minute, email_digest_enabled')
    .eq('email_digest_enabled', true)

  if (!allSettings?.length) return NextResponse.json({ message: 'No users to digest' })

  const now = new Date()
  let sent = 0

  for (const s of allSettings) {
    try {
      // Get current time in user's timezone
      const userNow = new Date(now.toLocaleString('en-US', { timeZone: s.timezone }))
      const userHour   = userNow.getHours()
      const userMinute = userNow.getMinutes()

      // Check if this 30-min window matches their digest time
      // e.g. digest_hour=7, digest_minute=30 → matches when userHour=7 and userMinute is 30-59
      const windowStart = s.digest_hour * 60 + s.digest_minute
      const currentMin  = userHour * 60 + userMinute
      if (Math.abs(currentMin - windowStart) > 29) continue

      // Trigger digest generation and email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!
      await fetch(`${appUrl}/api/digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-user': s.user_id,
          'x-cron-secret': process.env.CRON_SECRET!,
        },
        body: JSON.stringify({ trigger: 'cron', sendEmail: true }),
      })
      sent++
    } catch { /* continue to next user */ }
  }

  return NextResponse.json({ message: `Digest sent to ${sent} users` })
}
