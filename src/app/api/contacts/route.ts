import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ contacts: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, email, company, role, sentiment, last_topic } = body

    if (!name && !email) {
      return NextResponse.json({ error: 'Name or email is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id:    user.id,
        name:       name    ?? null,
        email:      email   ?? null,
        company:    company ?? null,
        role:       role    ?? null,
        sentiment:  sentiment  ?? 'neutral',
        last_topic: last_topic ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ contact: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
