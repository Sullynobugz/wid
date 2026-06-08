export type Role = 'coordinator' | 'participant'

export type Language = 'ar' | 'uk' | 'es' | 'en' | 'tr' | 'pl' | 'ro' | 'ru' | 'de' | 'ku'

export interface Phrase {
  id: string
  german: string
  phonetics: string
  translations: Partial<Record<Language, string>>
  exampleDE: string
  exampleTranslations: Partial<Record<Language, string>>
}

export interface Topic {
  id: string
  icon: string
  titleDE: string
  subtitleDE: string
  requiredLevel: string | null
  alwaysUnlocked: boolean
  phrases: Phrase[]
}

export interface Word {
  id: string
  german: string
  article?: 'der' | 'die' | 'das'
  type: 'nomen' | 'verb' | 'adjektiv' | 'ausdruck'
  topicId: string
  translations: Partial<Record<Language, string>>
}

export type NativeLanguage = 'ar' | 'uk' | 'es' | 'en' | 'ku' | 'tr' | 'pl' | 'ro' | 'ru'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string
  participant_code: string | null
  role: Role
  native_language: NativeLanguage
  created_at: string
}

export interface ParticipantWithStats extends Profile {
  total_xp: number
  lessons_completed: number
  last_active: string | null
  last_linguu_active?: string | null
  jobs_saved: number
  jobs_saved_this_month?: number | null
  cv_updates_this_month?: number | null
  // Linguu Wochenstatistik (aus participant_report View)
  lessons_this_week?: number | null
  lessons_this_month?: number | null
  xp_this_week?: number | null
  avg_quiz_score?: number | null
  // JobMate Bewerbungen
  total_applications?: number | null
  applications_this_week?: number | null
  applications_this_month?: number | null
  verified_applications?: number | null
  last_applied_at?: string | null
  assessment_level?: string | null
}

export interface ApplicationRecord {
  id: string
  job_title: string | null
  company: string | null
  job_url: string | null
  applied_at: string | null
  email_proof: string | null
  verified: boolean
  created_at: string
}

export interface LinguuProgress {
  id: string
  user_id: string
  topic_id: string
  lesson_type: 'phrases' | 'vocab' | 'quiz'
  score: number | null
  xp_earned: number
  duration_seconds: number
  completed_at: string
}

export interface JobmateActivity {
  id: string
  user_id: string
  activity_type: 'cv_upload' | 'job_saved' | 'application' | 'interview'
  details: Record<string, unknown>
  created_at: string
}

export const NATIVE_LANGUAGE_LABELS: Record<NativeLanguage, string> = {
  ar: 'Arabisch',
  uk: 'Ukrainisch',
  es: 'Spanisch',
  en: 'Englisch',
  ku: 'Kurdisch',
  tr: 'Türkisch',
  pl: 'Polnisch',
  ro: 'Rumänisch',
  ru: 'Russisch',
}

export const NATIVE_LANGUAGE_NATIVE: Record<NativeLanguage, string> = {
  ar: 'العربية',
  uk: 'Українська',
  es: 'Español',
  en: 'English',
  ku: 'Kurdî',
  tr: 'Türkçe',
  pl: 'Polski',
  ro: 'Română',
  ru: 'Русский',
}
