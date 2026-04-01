import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDigest } from '@/lib/claude'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's deals and contacts
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
      deals: (deals || []).map(d => ({
        stage:       d.deal_stage,
        urgency:     d.urgency,
        next_action: d.next_action,
        summary:     d.summary,
        contact:     d.contacts?.[0]?.name || 'Unknown',
        company:     d.contacts?.[0]?.company || '',
      })),
      contacts: (contacts || []).map(c => ({
        name:       c.name,
        company:    c.company,
        sentiment:  c.sentiment,
        last_topic: c.last_topic,
      })),
    }

    const digest = await generateDigest(payload)

    // Optionally send via email
    const { sendEmail } = await req.json().catch(() => ({ sendEmail: false }))

    if (sendEmail && user.email) {
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL!,
        to:      user.email,
        subject: `Your Relai digest — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
        html:    `<div style="font-family:Georgia,serif;max-width:560px;margin:40px auto;color:#1a1814;line-height:1.85;font-size:16px;">
          <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8680;margin-bottom:20px;">
            ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p>${digest.replace(/\n\n/g, '</p><p>')}</p>
          <hr style="border:none;border-top:1px solid #eceae3;margin:32px 0;">
          <p style="font-size:12px;color:#8a8680;">Relai · AI Relationship Intelligence</p>
        </div>`,
      })
    }

    return NextResponse.json({ digest })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
