import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { topics } from '@/data/content'
import { words } from '@/data/words'
import type { NativeLanguage } from '@/types'
import LessonClient from './LessonClient'

interface Props {
  params: Promise<{ topic: string }>
}

export default async function TopicPage({ params }: Props) {
  const { topic: topicId } = await params

  const topic = topics.find(t => t.id === topicId)
  if (!topic) notFound()

  const topicWords = words.filter(w => w.topicId === topicId)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('native_language')
    .eq('id', user.id)
    .single()

  const nativeLang = (profile?.native_language ?? 'ar') as NativeLanguage

  const { data: progressRows } = await supabase
    .from('linguu_progress')
    .select('lesson_type, xp_earned, score')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)

  const doneTypes = new Set(progressRows?.map(r => r.lesson_type) ?? [])
  const totalXp = progressRows?.reduce((s, r) => s + r.xp_earned, 0) ?? 0

  return (
    <LessonClient
      topic={topic}
      words={topicWords}
      nativeLang={nativeLang}
      doneTypes={Array.from(doneTypes)}
      totalXp={totalXp}
    />
  )
}
