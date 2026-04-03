import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchRecentThreads, fetchNewThreadsSince, threadToText, getHistoryId } from '@/lib/gmail'
import { analyseThread } from '@/lib/claude'
import { unstable_noStore as noStore } from 'next/cache'

export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: state }, { data: runs }] = await Promise.all([
    supabase.from('sync_state').select('*').eq('user_id', user.id).single(),
    supabase.from('sync_runs')
      .select('*, thread_snapshots(*)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({ state: state ?? null, runs: runs ?? [] })
}

export async function POST(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId      = session.user.id
  const accessToken = session.provider_token

  if (!accessToken) {
    return NextResponse.json({ error: 'No Google access token. Please sign out and sign back in.' }, { status: 400 })
  }

  // ── Guard: block if already syncing ──────────────────────────────
  const { data: existingState } = await supabase
    .from('sync_state').select('*').eq('user_id', userId).single()

  if (existingState?.is_syncing) {
    const started = existingState.sync_started_at
      ? new Date(existingState.sync_started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'recently'
    return NextResponse.json({ error: `Sync already in progress (started ${started}). Please wait.`, in_progress: true }, { status: 409 })
  }

  // ── Get user settings ─────────────────────────────────────────────
  const { data: settings } = await supabase
    .from('user_settings').select('*').eq('user_id', userId).single()
  const syncLimit      = settings?.sync_limit ?? 10
  const keywordFilters = (settings?.keyword_filters ?? []) as string[]
  const retentionDays  = settings?.retention_days ?? 30

  const body = await req.json().catch(() => ({}))
  const triggerType: 'manual' | 'cron' | 'onboarding' = body.trigger ?? 'manual'
  const isSample = triggerType === 'onboarding' || !existingState?.last_history_id

  // ── Mark sync as in progress ──────────────────────────────────────
  await supabase.from('sync_state').upsert({
    user_id:         userId,
    is_syncing:      true,
    sync_started_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // ── Create sync run record ────────────────────────────────────────
  const { data: syncRun } = await supabase.from('sync_runs').insert({
    user_id:  userId,
    status:   'running',
    trigger:  triggerType,
  }).select().single()

  const syncRunId = syncRun?.id ?? null
  let threadsProcessed = 0
  let dealsFound       = 0
  let contactsFound    = 0
  let hadErrors        = false

  try {
    // ── Fetch threads ───────────────────────────────────────────────
    let threads = isSample
      ? await fetchRecentThreads(accessToken, syncLimit)
      : await fetchNewThreadsSince(accessToken, existingState.last_history_id!)

    // Apply keyword filter if set
    if (keywordFilters.length > 0) {
      const lowerKeywords = keywordFilters.map(k => k.toLowerCase().trim())
      threads = threads.filter(t => {
        const text = (t.subject + ' ' + t.snippet + ' ' + t.messages.map(m => m.body).join(' ')).toLowerCase()
        return lowerKeywords.some(kw => text.includes(kw))
      })
    }

    // ── Process each thread ─────────────────────────────────────────
    for (const thread of threads) {
      threadsProcessed++
      const threadText = threadToText(thread)
      const participants = [...new Set(thread.messages.flatMap(m => [m.from, m.to].filter(Boolean)))]
      const dates = thread.messages.map(m => new Date(m.date)).filter(d => !isNaN(d.getTime()))
      const dateFrom = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : null
      const dateTo   = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : null

      try {
        // Store thread snapshot
        await supabase.from('thread_snapshots').upsert({
          user_id:           userId,
          sync_run_id:       syncRunId,
          thread_id:         thread.id,
          subject:           thread.subject,
          participants,
          date_from:         dateFrom,
          date_to:           dateTo,
          preview_text:      threadText.slice(0, 500),
          processing_status: 'success',
        }, { onConflict: 'user_id,thread_id' })

        // Run AI analysis
        const analysis = await analyseThread(threadText)

        if (analysis.is_deal) {
          await supabase.from('deals').upsert({
            user_id:     userId,
            thread_id:   thread.id,
            thread_text: threadText.slice(0, 2000),
            is_deal:     analysis.is_deal,
            deal_stage:  analysis.deal_stage,
            urgency:     analysis.urgency,
            confidence:  analysis.confidence,
            sentiment:   analysis.sentiment,
            next_action: analysis.next_action,
            summary:     analysis.summary,
          }, { onConflict: 'user_id,thread_id' })
          dealsFound++
        }

        let newContacts = 0
        for (const contact of analysis.contacts) {
          if (!contact.name && !contact.email) continue
          const { error } = await supabase.from('contacts').upsert({
            user_id:    userId,
            name:       contact.name,
            email:      contact.email,
            company:    contact.company,
            role:       contact.role,
            sentiment:  analysis.sentiment,
            last_topic: contact.last_topic,
          }, { onConflict: 'user_id,email', ignoreDuplicates: false })
          if (!error) newContacts++
        }
        contactsFound += newContacts

      } catch (threadErr) {
        hadErrors = true
        await supabase.from('thread_snapshots').upsert({
          user_id:           userId,
          sync_run_id:       syncRunId,
          thread_id:         thread.id,
          subject:           thread.subject,
          participants,
          processing_status: 'failed',
          error_message:     threadErr instanceof Error ? threadErr.message : 'Unknown error',
        }, { onConflict: 'user_id,thread_id' })
      }

      await sleep(300)
    }

    // ── Link calendar events to threads ─────────────────────────────
    await linkCalendarThreads(supabase, userId, retentionDays)

    // ── Enforce retention ────────────────────────────────────────────
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('thread_snapshots').delete()
      .eq('user_id', userId).lt('created_at', cutoff)

    // ── Update sync run ──────────────────────────────────────────────
    const finalStatus = hadErrors && threadsProcessed === 0 ? 'failed'
      : hadErrors ? 'partial' : 'success'

    await supabase.from('sync_runs').update({
      status:            finalStatus,
      threads_processed: threadsProcessed,
      deals_found:       dealsFound,
      contacts_found:    contactsFound,
      completed_at:      new Date().toISOString(),
    }).eq('id', syncRunId)

    // ── Update sync state ────────────────────────────────────────────
    const newHistoryId = await getHistoryId(accessToken)
    await supabase.from('sync_state').upsert({
      user_id:         userId,
      last_synced_at:  new Date().toISOString(),
      last_history_id: newHistoryId,
      threads_synced:  (existingState?.threads_synced ?? 0) + threadsProcessed,
      is_syncing:      false,
      sync_started_at: null,
    }, { onConflict: 'user_id' })

    // ── Auto-regenerate digest if new data found ─────────────────────
    if (dealsFound > 0 || contactsFound > 0) {
      await triggerDigestRegen(supabase, userId)
    }

    return NextResponse.json({
      success:  true,
      run_id:   syncRunId,
      status:   finalStatus,
      processed: threadsProcessed,
      deals:     dealsFound,
      contacts:  contactsFound,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    await supabase.from('sync_runs').update({
      status: 'failed', error_message: message, completed_at: new Date().toISOString(),
    }).eq('id', syncRunId)
    await supabase.from('sync_state').upsert({
      user_id: userId, is_syncing: false, sync_started_at: null,
    }, { onConflict: 'user_id' })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── Link calendar events to matching thread snapshots ─────────────────
async function linkCalendarThreads(supabase: ReturnType<typeof createClient>, userId: string, retentionDays: number) {
  const { data: events } = await supabase.from('calendar_events')
    .select('*').eq('user_id', userId)
  if (!events?.length) return

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
  const { data: snapshots } = await supabase.from('thread_snapshots')
    .select('id, thread_id, participants').eq('user_id', userId).gte('created_at', cutoff)
  if (!snapshots?.length) return

  for (const event of events) {
    const attendees = (event.attendee_emails ?? []) as string[]
    const matched = snapshots.filter(s =>
      (s.participants as string[]).some(p => attendees.some(a => p.toLowerCase().includes(a.toLowerCase())))
    ).map(s => s.thread_id)

    // Merge auto-linked with manually linked (preserve manual links)
    const existing = (event.linked_thread_ids ?? []) as string[]
    const merged   = [...new Set([...existing, ...matched])]

    if (merged.length !== existing.length) {
      await supabase.from('calendar_events')
        .update({ linked_thread_ids: merged }).eq('id', event.id)
    }
  }
}

// ── Trigger background digest regeneration ────────────────────────────
async function triggerDigestRegen(supabase: ReturnType<typeof createClient>, userId: string) {
  try {
    const { data: deals }    = await supabase.from('deals').select('deal_stage,urgency,next_action,summary').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    const { data: contacts } = await supabase.from('contacts').select('name,company,sentiment,last_topic').eq('user_id', userId).order('created_at', { ascending: false }).limit(15)
    if (!deals?.length && !contacts?.length) return

    const { generateDigest } = await import('@/lib/claude')
    const digest = await generateDigest({
      deals:    (deals ?? []).map(d => ({ stage: d.deal_stage, urgency: d.urgency, next_action: d.next_action, summary: d.summary || '', contact: 'Unknown', company: '' })),
      contacts: (contacts ?? []).map(c => ({ name: c.name, company: c.company, sentiment: c.sentiment, last_topic: c.last_topic })),
    })
    await supabase.from('digests').insert({ user_id: userId, content: digest, trigger: 'sync' })
  } catch { /* non-fatal — digest regen failure shouldn't break sync */ }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
