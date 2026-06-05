import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CoordinatorNav from '@/components/coordinator/CoordinatorNav'

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()

  console.log('[coordinator/layout] user:', user?.id ?? 'null')

  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile, error } = await db
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single()

  console.log('[coordinator/layout] profile:', profile?.role ?? 'null', 'error:', error?.message ?? 'none')

  const allowedRoles = ['coordinator', 'global_admin']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <div style={{ padding: 32, fontFamily: 'monospace' }}>
        <p><strong>Debug:</strong> user_id = {user.id}</p>
        <p>profile = {JSON.stringify(profile)}</p>
        <p>error = {error?.message ?? 'none'}</p>
        <p>Bitte dieses SQL in Supabase ausführen und Ergebnis teilen:</p>
        <pre>select id, role from profiles where id = &apos;{user.id}&apos;;</pre>
      </div>
    )
  }

  const isGlobalAdmin = profile.role === 'global_admin'

  // Org-Name separat laden
  const { data: org } = await db
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single()

  const orgName = org?.name ?? ''

  return (
    <div className="min-h-screen flex flex-col">
      <CoordinatorNav userName={profile.full_name} orgName={orgName} isGlobalAdmin={isGlobalAdmin} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
