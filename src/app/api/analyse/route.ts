import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyseThread } from '@/lib/claude'
import { AnalyseRequest, AnalyseResponse } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'

export async function POST(req: NextRequest) {
  noStore()
  try {
    const { thread } = (await req.json()) as AnalyseRequest

    if (!thread?.trim()) {
      return NextResponse.json({ error: 'No thread provided' }, { status: 400 })
    }

    // Run AI analysis
    const data = await analyseThread(thread)

    // Get the current user (optional — works without auth too for MVP)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let saved = false

    if (user && data.is_deal) {
      // Save deal to DB
      const { error: dealError } = await supabase.from('deals').insert({
        user_id:     user.id,
        thread_text: thread,
        is_deal:     data.is_deal,
        deal_stage:  data.deal_stage,
        urgency:     data.urgency,
        confidence:  data.confidence,
        sentiment:   data.sentiment,
        next_action: data.next_action,
        summary:     data.summary,
      })

      if (!dealError) saved = true

      // Upsert contacts (deduplicate by email)
      for (const contact of data.contacts) {
        if (!contact.name && !contact.email) continue
        await supabase.from('contacts').upsert(
          {
            user_id:    user.id,
            name:       contact.name,
            email:      contact.email,
            company:    contact.company,
            role:       contact.role,
            sentiment:  data.sentiment,
            last_topic: contact.last_topic,
          },
          { onConflict: 'user_id,email', ignoreDuplicates: false }
        )
      }
    }

    return NextResponse.json({ data, saved } satisfies AnalyseResponse)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
