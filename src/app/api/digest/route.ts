import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDigest } from '@/lib/claude'
import { unstable_noStore as noStore } from 'next/cache'

// Explicit types matching what Supabase returns from our schema
interface DealRow {
  deal_stage:  string | null
  urgency:     string | null
  next_action: string | null
  summary:     string | null
}

interface ContactRow {
  name:       string | null
  company:    string | null
  sentiment:  string | null
  last_topic: string | null
}

export async function POST(req: NextRequest) {
  noStore()

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: deals }, { data: contacts }] = await Promise.all([
      supabase
        .from('deals')
        .select('deal_stage, urgency, next_action, summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('contacts')
        .select('name, company, sentiment, last_topic')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    if (!deals?.length && !contacts?.length) {
      return NextResponse.json({ error: 'No data to digest yet' }, { status: 400 })
    }

    const payload = {
      deals: (deals as DealRow[] || []).map(d => ({
        stage:       d.deal_stage,
        urgency:     d.urgency,
        next_action: d.next_action,
        summary:     d.summary || '',
        contact:     'Unknown',
        company:     '',
      })),
      contacts: (contacts as ContactRow[] || []).map(c => ({
        name:       c.name,
        company:    c.company,
        sentiment:  c.sentiment,
        last_topic: c.last_topic,
      })),
    }

    const digest = await generateDigest(payload)

    // Optionally send via email
    const body = await req.json().catch(() => ({}))
    const sendEmail = body?.sendEmail === true

    if (sendEmail && user.email) {
      const resendKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'digest@prelai.org'

      if (!resendKey) {
        console.warn('RESEND_API_KEY not set — skipping email')
      } else {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        const dateLabel = new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
        await resend.emails.send({
          from:    fromEmail,
          to:      user.email,
          subject: `Your Relai digest — ${dateLabel}`,
          html: `<div style="font-family:Georgia,serif;max-width:560px;margin:40px auto;color:#1a1814;line-height:1.85;font-size:16px;">
            <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8680;margin-bottom:20px;">${dateLabel}</p>
            <p>${digest.replace(/\n\n/g, '</p><p>')}</p>
            <hr style="border:none;border-top:1px solid #eceae3;margin:32px 0;">
            <p style="font-size:12px;color:#8a8680;">Relai · <a href="https://prelai.org" style="color:#8a8680;">prelai.org</a></p>
          </div>`,
        })
      }
    }

    return NextResponse.json({ digest })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
