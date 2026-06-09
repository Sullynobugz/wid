import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ParticipantNav from '@/components/lernen/ParticipantNav'
import { FloatingTranslator } from '@/components/lernen/FloatingTranslator'
import type { NativeLanguage } from '@/types'

export default async function LernenLayout({ children }: { children: React.ReactNode }) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, native_language')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const nativeLang = profile.native_language as NativeLanguage

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav
        userName={profile.full_name}
        nativeLang={nativeLang}
      />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      <FloatingTranslator nativeLang={nativeLang} />
    </div>
  )
}
