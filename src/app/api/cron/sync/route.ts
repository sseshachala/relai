import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all users who have synced before AND have a stored refresh token
  const { data: syncStates } = await supabase
    .from('sync_state')
    .select('user_id, last_history_id, encrypted_refresh_token')
    .not('encrypted_refresh_token', 'is', null)

  if (!syncStates?.length) {
    return NextResponse.json({ message: 'No users with refresh tokens to sync' })
  }

  let synced  = 0
  let skipped = 0
  let failed  = 0

  for (const state of syncStates) {
    try {
      // Decrypt the stored refresh token
      const refreshToken = await decrypt(state.encrypted_refresh_token!)

      // Exchange refresh token for a fresh Google access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id:     process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type:    'refresh_token',
        }),
      })

      if (!tokenRes.ok) {
        const err = await tokenRes.json()
        console.error(`Token refresh failed for user ${state.user_id}:`, err)

        // If token is revoked/invalid, clear it so we stop trying
        if (err.error === 'invalid_grant') {
          await supabase.from('sync_state')
            .update({ encrypted_refresh_token: null })
            .eq('user_id', state.user_id)
          console.log(`Cleared invalid refresh token for user ${state.user_id}`)
        }
        failed++
        continue
      }

      const tokenData = await tokenRes.json()
      const accessToken: string = tokenData.access_token

      // If Google issued a new refresh token, encrypt and store it
      if (tokenData.refresh_token) {
        const newEncrypted = await encrypt(tokenData.refresh_token)
        await supabase.from('sync_state')
          .update({ encrypted_refresh_token: newEncrypted })
          .eq('user_id', state.user_id)
      }

      // Now run the actual Gmail sync with the fresh access token
      await runSyncForUser(supabase, state.user_id, accessToken, state.last_history_id)
      synced++

    } catch (err) {
      console.error(`Sync failed for user ${state.user_id}:`, err)
      failed++
    }

    // Small delay between users to avoid hammering APIs
    await sleep(500)
  }

  return NextResponse.json({
    message: `Sync complete — ${synced} synced, ${skipped} skipped, ${failed} failed`,
    synced, skipped, failed,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runSyncForUser(
  supabase: any,
  userId: string,
  accessToken: string,
  lastHistoryId: string | null
) {
  const { fetchRecentThreads, fetchNewThreadsSince, threadToText, getHistoryId, fetchCalendarEvents } = await import('@/lib/gmail')
  const { analyseThread, generateDigest } = await import('@/lib/claude')
  const { encrypt } = await import('@/lib/crypto')

  // Get user settings
  const { data: settings } = await supabase
    .from('user_settings').select('*').eq('user_id', userId).single()
  const syncLimit      = settings?.sync_limit      ?? 10
  const keywordFilters = (settings?.keyword_filters ?? []) as string[]
  const retentionDays  = settings?.retention_days  ?? 30

  // Mark as syncing
  await supabase.from('sync_state').upsert({
    user_id:         userId,
    is_syncing:      true,
    sync_started_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Create sync run record
  const { data: syncRun } = await supabase.from('sync_runs').insert({
    user_id: userId, status: 'running', trigger: 'cron',
  }).select().single()
  const syncRunId = syncRun?.id ?? null

  let threadsProcessed = 0
  let dealsFound       = 0
  let contactsFound    = 0
  let hadErrors        = false

  try {
    // Fetch threads — incremental if we have a history ID, sample if first time
    let threads = lastHistoryId
      ? await fetchNewThreadsSince(accessToken, lastHistoryId)
      : await fetchRecentThreads(accessToken, syncLimit)

    // Apply keyword filter
    if (keywordFilters.length > 0) {
      const lower = keywordFilters.map(k => k.toLowerCase().trim())
      threads = threads.filter(t => {
        const text = (t.subject + ' ' + t.snippet).toLowerCase()
        return lower.some(kw => text.includes(kw))
      })
    }

    // Process each thread
    for (const thread of threads) {
      threadsProcessed++
      const threadText   = threadToText(thread)
      const participants = [...new Set(thread.messages.flatMap(m => [m.from, m.to].filter(Boolean)))]
      const dates        = thread.messages.map(m => new Date(m.date)).filter(d => !isNaN(d.getTime()))
      const dateFrom     = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null
      const dateTo       = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null

      try {
        await supabase.from('thread_snapshots').upsert({
          user_id: userId, sync_run_id: syncRunId,
          thread_id: thread.id, subject: thread.subject,
          participants, date_from: dateFrom, date_to: dateTo,
          preview_text: threadText.slice(0, 500),
          processing_status: 'success',
        }, { onConflict: 'user_id,thread_id' })

        const analysis = await analyseThread(threadText)

        if (analysis.is_deal) {
          await supabase.from('deals').upsert({
            user_id: userId, thread_id: thread.id,
            thread_text: threadText.slice(0, 2000),
            is_deal: analysis.is_deal, deal_stage: analysis.deal_stage,
            urgency: analysis.urgency, confidence: analysis.confidence,
            sentiment: analysis.sentiment, next_action: analysis.next_action,
            summary: analysis.summary,
          }, { onConflict: 'user_id,thread_id' })
          dealsFound++
        }

        for (const contact of analysis.contacts) {
          if (!contact.name && !contact.email) continue
          await supabase.from('contacts').upsert({
            user_id: userId, name: contact.name, email: contact.email,
            company: contact.company, role: contact.role,
            sentiment: analysis.sentiment, last_topic: contact.last_topic,
          }, { onConflict: 'user_id,email', ignoreDuplicates: false })
          contactsFound++
        }

      } catch (threadErr) {
        hadErrors = true
        await supabase.from('thread_snapshots').upsert({
          user_id: userId, sync_run_id: syncRunId,
          thread_id: thread.id, subject: thread.subject, participants,
          processing_status: 'failed',
          error_message: threadErr instanceof Error ? threadErr.message : 'Unknown',
        }, { onConflict: 'user_id,thread_id' })
      }

      await sleep(300)
    }

    // Sync calendar events
    try {
      const calEvents = await fetchCalendarEvents(accessToken, 20)
      for (const e of calEvents) {
        await supabase.from('calendar_events').upsert({
          user_id: userId, event_id: e.id, title: e.title,
          start_time: e.start, end_time: e.end,
          attendee_emails: e.attendees, linked_thread_ids: [],
        }, { onConflict: 'user_id,event_id' })
      }
      // Auto-link threads to calendar events
      await linkCalendarThreads(supabase, userId, retentionDays)
    } catch { /* non-fatal */ }

    // Enforce retention
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('thread_snapshots').delete().eq('user_id', userId).lt('created_at', cutoff)

    // Update sync run
    const status = hadErrors && threadsProcessed === 0 ? 'failed' : hadErrors ? 'partial' : 'success'
    await supabase.from('sync_runs').update({
      status, threads_processed: threadsProcessed,
      deals_found: dealsFound, contacts_found: contactsFound,
      completed_at: new Date().toISOString(),
    }).eq('id', syncRunId)

    // Update sync state
    const newHistoryId = await getHistoryId(accessToken)
    await supabase.from('sync_state').upsert({
      user_id:         userId,
      last_synced_at:  new Date().toISOString(),
      last_history_id: newHistoryId,
      threads_synced:  threadsProcessed,
      is_syncing:      false,
      sync_started_at: null,
    }, { onConflict: 'user_id' })

    // Auto-regenerate digest if new data found
    if (dealsFound > 0 || contactsFound > 0) {
      const { data: deals }    = await supabase.from('deals').select('deal_stage,urgency,next_action,summary').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
      const { data: contacts } = await supabase.from('contacts').select('name,company,sentiment,last_topic').eq('user_id', userId).order('created_at', { ascending: false }).limit(15)
      if (deals?.length || contacts?.length) {
        const digest = await generateDigest({
          deals:    (deals ?? []).map(d => ({ stage: d.deal_stage, urgency: d.urgency, next_action: d.next_action, summary: d.summary || '', contact: '', company: '' })),
          contacts: (contacts ?? []).map(c => ({ name: c.name, company: c.company, sentiment: c.sentiment, last_topic: c.last_topic })),
        })
        await supabase.from('digests').insert({ user_id: userId, content: digest, trigger: 'cron' })
      }
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    await supabase.from('sync_runs').update({
      status: 'failed', error_message: message, completed_at: new Date().toISOString(),
    }).eq('id', syncRunId)
    await supabase.from('sync_state').upsert({
      user_id: userId, is_syncing: false, sync_started_at: null,
    }, { onConflict: 'user_id' })
    throw err
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function linkCalendarThreads(
  supabase: any,
  userId: string,
  retentionDays: number
) {
  const { data: events }    = await supabase.from('calendar_events').select('*').eq('user_id', userId)
  if (!events?.length) return
  const cutoff              = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
  const { data: snapshots } = await supabase.from('thread_snapshots').select('id, thread_id, participants').eq('user_id', userId).gte('created_at', cutoff)
  if (!snapshots?.length) return

  for (const event of events) {
    const attendees = (event.attendee_emails ?? []) as string[]
    const matched   = snapshots
      .filter(s => (s.participants as string[]).some(p => attendees.some(a => p.toLowerCase().includes(a.toLowerCase()))))
      .map(s => s.thread_id)
    const existing  = (event.linked_thread_ids ?? []) as string[]
    const merged    = [...new Set([...existing, ...matched])]
    if (merged.length !== existing.length) {
      await supabase.from('calendar_events').update({ linked_thread_ids: merged }).eq('id', event.id)
    }
  }
}

// Need to import encrypt for potential token rotation
async function encrypt(token: string): Promise<string> {
  const { encrypt: enc } = await import('@/lib/crypto')
  return enc(token)
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
