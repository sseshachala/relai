import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Authenticated → go to pipeline
  // Not authenticated → go to login
  if (user) redirect('/pipeline')
  else redirect('/login')
}
