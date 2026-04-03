import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDigest } from '@/lib/claude'
import { unstable_noStore as noStore } from 'next/cache'

// GET — return cached digest
export async function GET() {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('digests')
    .select('*').eq('user_id', user.id)
    .order('generated_at', { ascending: false }).limit(1).single()

  return NextResponse.json({ digest: data ?? null })
}

// POST — generate new digest
export async function POST(req: NextRequest) {
  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: deals }, { data: contacts }] = await Promise.all([
    supabase.from('deals').select('deal_stage,urgency,next_action,summary').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('contacts').select('name,company,sentiment,last_topic').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
  ])

  if (!deals?.length && !contacts?.length) {
    return NextResponse.json({ error: 'No data to digest yet' }, { status: 400 })
  }

  const payload = {
    deals:    (deals ?? []).map(d => ({ stage: d.deal_stage, urgency: d.urgency, next_action: d.next_action, summary: d.summary || '', contact: 'Unknown', company: '' })),
    contacts: (contacts ?? []).map(c => ({ name: c.name, company: c.company, sentiment: c.sentiment, last_topic: c.last_topic })),
  }

  const content = await generateDigest(payload)

  const body = await req.json().catch(() => ({}))
  const trigger = body.trigger ?? 'manual'

  const { data: saved } = await supabase.from('digests')
    .insert({ user_id: user.id, content, trigger }).select().single()

  // Send email if enabled
  const { data: settings } = await supabase.from('user_settings').select('email_digest_enabled').eq('user_id', user.id).single()
  if (settings?.email_digest_enabled && body.sendEmail) {
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      await resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL || 'digest@prelai.org',
        to:      user.email!,
        subject: `Your Relai brief — ${dateLabel}`,
        html: `<div style="font-family:Georgia,serif;max-width:580px;margin:40px auto;color:#1a1814;line-height:1.9;font-size:16px;">
          <p style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8680;margin-bottom:20px;">${dateLabel}</p>
          <p>${content.replace(/\n\n/g, '</p><p>')}</p>
          <hr style="border:none;border-top:1px solid #eceae3;margin:32px 0;">
          <p style="font-size:13px;color:#8a8680;">
            <a href="https://prelai.org/pipeline" style="color:#2a5cff;text-decoration:none;">View pipeline →</a>
            &nbsp;&nbsp;
            <a href="https://prelai.org/contacts" style="color:#2a5cff;text-decoration:none;">View contacts →</a>
            &nbsp;&nbsp;
            <a href="https://prelai.org/meetings" style="color:#2a5cff;text-decoration:none;">Today's meetings →</a>
          </p>
          <p style="font-size:11px;color:#b4b2a9;margin-top:16px;">Relai · <a href="https://prelai.org" style="color:#b4b2a9;">prelai.org</a> · <a href="https://prelai.org/settings" style="color:#b4b2a9;">manage preferences</a></p>
        </div>`,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ digest: saved })
}
