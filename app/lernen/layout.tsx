import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ParticipantNav from '@/components/lernen/ParticipantNav'
import type { NativeLanguage } from '@/types'

export default async function LernenLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, native_language')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav
        userName={profile.full_name}
        nativeLang={profile.native_language as NativeLanguage}
      />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
