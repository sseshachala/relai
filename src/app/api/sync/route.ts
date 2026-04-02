import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentThreads, fetchNewThreadsSince, fetchCalendarEvents, threadToText, getHistoryId } from '@/lib/gmail'
import { analyseThread } from '@/lib/claude'
import { unstable_noStore as noStore } from 'next/cache'

// ── GET /api/sync — check sync status ────────────────────────────────
export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: state } = await supabase
    .from('sync_state')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ state: state ?? null })
}

// ── POST /api/sync — trigger a sync ──────────────────────────────────
export async function POST(req: NextRequest) {
  noStore()
  const supabase = createClient()

  // Get user + their Google access token from Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = session.provider_token  // Google OAuth token
  const userId      = session.user.id

  if (!accessToken) {
    return NextResponse.json({
      error: 'No Google access token. Please sign out and sign back in.'
    }, { status: 400 })
  }

  // Check if this is a sample sync (first time) or incremental
  const { data: existingState } = await supabase
    .from('sync_state')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { mode } = await req.json().catch(() => ({ mode: 'sample' }))
  const isSample = mode === 'sample' || !existingState?.last_history_id

  let threads = []
  let processed = 0
  let saved = 0

  try {
    // ── Fetch threads ───────────────────────────────────────────────
    if (isSample) {
      // First sync — fetch last 10 threads
      threads = await fetchRecentThreads(accessToken, 10)
    } else {
      // Incremental — only fetch new since last sync
      threads = await fetchNewThreadsSince(accessToken, existingState.last_history_id)
    }

    // ── Process each thread through Claude ─────────────────────────
    for (const thread of threads) {
      try {
        processed++
        const threadText = threadToText(thread)
        const analysis   = await analyseThread(threadText)

        // Save deal if commercial signal found
        if (analysis.is_deal) {
          const { error: dealErr } = await supabase.from('deals').insert({
            user_id:     userId,
            thread_text: threadText,
            ...analysis,
            // Remove nested contacts from deal row
            contacts:    undefined,
          })
          if (!dealErr) saved++
        }

        // Upsert contacts regardless of deal status
        for (const contact of analysis.contacts) {
          if (!contact.name && !contact.email) continue
          await supabase.from('contacts').upsert(
            {
              user_id:    userId,
              name:       contact.name,
              email:      contact.email,
              company:    contact.company,
              role:       contact.role,
              sentiment:  analysis.sentiment,
              last_topic: contact.last_topic,
            },
            { onConflict: 'user_id,email', ignoreDuplicates: false }
          )
        }

        // Small delay to avoid hitting Claude rate limits
        await sleep(300)

      } catch (threadErr) {
        // Log but don't fail the whole sync over one bad thread
        console.error('Thread processing error:', threadErr)
      }
    }

    // ── Update sync state ───────────────────────────────────────────
    const newHistoryId = await getHistoryId(accessToken)

    await supabase.from('sync_state').upsert({
      user_id:         userId,
      last_synced_at:  new Date().toISOString(),
      last_history_id: newHistoryId,
      threads_synced:  (existingState?.threads_synced ?? 0) + processed,
    }, { onConflict: 'user_id' })

    return NextResponse.json({
      success:   true,
      mode:      isSample ? 'sample' : 'incremental',
      processed,
      saved,
      message:   `Processed ${processed} threads, found ${saved} deals`,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
