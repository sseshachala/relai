import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDigest } from '@/lib/claude'
import { unstable_noStore as noStore } from 'next/cache'

export async function POST(req: NextRequest) {
  // Tell Next.js this route is always dynamic — never pre-render or cache it
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
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    if (!deals?.length && !contacts?.length) {
      return NextResponse.json({ error: 'No data to digest yet' }, { status: 400 })
    }

    const payload = {
      deals: (deals || []).map((d: Record<string, unknown>) => ({
        stage:       d.deal_stage,
        urgency:     d.urgency,
        next_action: d.next_action,
        summary:     (d.summary as string) || '',
        contact:     'Unknown',
        company:     '',
      })),
      contacts: (contacts || []).map((c: Record<string, unknown>) => ({
        name:       c.name       as string | null,
        company:    c.company    as string | null,
        sentiment:  c.sentiment  as string | null,
        last_topic: c.last_topic as string | null,
      })),
    }

    const digest = await generateDigest(payload)

    // Send email if requested and Resend is configured
    const body = await req.json().catch(() => ({}))
    const sendEmail = body?.sendEmail === true

    if (sendEmail && user.email) {
      const resendKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'digest@prelai.org'

      if (!resendKey) {
        console.warn('RESEND_API_KEY not set — skipping email send')
      } else {
        // Lazy import — only runs at request time, never at build time
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)

        const dateLabel = new Date().toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })

        await resend.emails.send({
          from:    fromEmail,
          to:      user.email,
          subject: `Your Relai digest — ${dateLabel}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:40px auto;color:#1a1814;line-height:1.85;font-size:16px;">
              <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8680;margin-bottom:20px;">${dateLabel}</p>
              <p>${digest.replace(/\n\n/g, '</p><p>')}</p>
              <hr style="border:none;border-top:1px solid #eceae3;margin:32px 0;">
              <p style="font-size:12px;color:#8a8680;">Relai · AI Relationship Intelligence · <a href="https://prelai.org" style="color:#8a8680;">prelai.org</a></p>
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
