import { redirect } from 'next/navigation'
import { getParticipant } from '@/lib/participant'
import { ParticipantProvider } from '@/components/lernen/ParticipantProvider'
import ParticipantNav from '@/components/lernen/ParticipantNav'
import { FloatingTranslator } from '@/components/lernen/FloatingTranslator'

export default async function LernenLayout({ children }: { children: React.ReactNode }) {
  const participant = await getParticipant()
  if (!participant) redirect('/login')

  return (
    <ParticipantProvider
      value={{
        fullName: participant.fullName,
        nativeLang: participant.nativeLang,
        participantCode: participant.participantCode,
      }}
    >
      <div className="min-h-screen flex flex-col">
        <ParticipantNav userName={participant.fullName} />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <FloatingTranslator nativeLang={participant.nativeLang} />
      </div>
    </ParticipantProvider>
  )
}
