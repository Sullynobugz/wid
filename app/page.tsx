import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function Home() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  redirect(profile?.role === 'coordinator' ? '/coordinator' : '/lernen')
}
