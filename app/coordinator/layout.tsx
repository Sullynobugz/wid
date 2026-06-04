import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CoordinatorNav from '@/components/coordinator/CoordinatorNav'

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id, organizations(name)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const orgs = profile.organizations as { name: string } | { name: string }[] | null
  const orgName = Array.isArray(orgs) ? (orgs[0]?.name ?? '') : (orgs?.name ?? '')

  return (
    <div className="min-h-screen flex flex-col">
      <CoordinatorNav userName={profile.full_name} orgName={orgName} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
