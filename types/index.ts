export type Role = 'coordinator' | 'participant'

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
  jobs_saved: number
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
