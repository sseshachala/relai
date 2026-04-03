import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from './LandingPage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // If already logged in → go straight to pipeline
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/pipeline')

  return <LandingPage />
}
