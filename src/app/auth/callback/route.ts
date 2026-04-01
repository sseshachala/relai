import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this user has synced before
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: syncState } = await supabase
          .from('sync_state')
          .select('user_id')
          .eq('user_id', user.id)
          .single()

        // New user → onboarding sync. Returning user → pipeline
        const destination = syncState ? '/pipeline' : '/onboarding'
        return NextResponse.redirect(`${origin}${destination}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
