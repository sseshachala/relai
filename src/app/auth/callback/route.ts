import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = createClient()
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !sessionData.session) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  const user         = sessionData.session.user
  const refreshToken = sessionData.session.provider_refresh_token

  // Store encrypted refresh token if Google provided one
  if (refreshToken) {
    try {
      const encryptedToken = await encrypt(refreshToken)

      // Use service role to write directly — avoids RLS complications at callback time
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await serviceClient.from('sync_state').upsert({
        user_id:                  user.id,
        encrypted_refresh_token:  encryptedToken,
        is_syncing:               false,
      }, { onConflict: 'user_id' })

    } catch (err) {
      // Non-fatal — log but don't block login
      console.error('Failed to store refresh token:', err)
    }
  }

  // Route to onboarding or pipeline
  const { data: syncState } = await supabase
    .from('sync_state')
    .select('user_id, last_history_id')
    .eq('user_id', user.id)
    .single()

  const destination = syncState?.last_history_id ? '/pipeline' : '/onboarding'
  return NextResponse.redirect(`${origin}${destination}`)
}
