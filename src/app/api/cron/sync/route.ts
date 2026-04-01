import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// This route is called by Vercel Cron every 15 minutes
// It loops through all users who have a sync_state and runs incremental sync

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (not a random visitor)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to read all users' sync states
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: syncStates } = await supabase
    .from('sync_state')
    .select('user_id, last_history_id')
    .not('last_history_id', 'is', null)

  if (!syncStates?.length) {
    return NextResponse.json({ message: 'No users to sync' })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  let synced = 0

  for (const state of syncStates) {
    try {
      // Trigger incremental sync for each user
      // In production you'd use a proper job queue (Inngest, Trigger.dev)
      // For MVP this simple sequential approach works fine
      await fetch(`${appUrl}/api/sync`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'x-user-id':     state.user_id,
          'x-cron-secret': process.env.CRON_SECRET!,
        },
        body: JSON.stringify({ mode: 'incremental', userId: state.user_id }),
      })
      synced++
    } catch (err) {
      console.error(`Sync failed for user ${state.user_id}:`, err)
    }
  }

  return NextResponse.json({ message: `Triggered sync for ${synced} users` })
}
