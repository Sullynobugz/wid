import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Stethoscope, Home, ShoppingCart, FileText, Phone, GraduationCap, Coffee } from 'lucide-react'
import type { NativeLanguage } from '@/types'

const TOPICS = [
  { id: 'jobcenter', icon: Building2, de: 'Jobcenter', color: '#2563EB',
    labels: { ar: 'مركز التوظيف', uk: 'Центр зайнятості', es: 'Centro de empleo', en: 'Job Center', ku: 'Navenda Kar', tr: 'İş Merkezi', pl: 'Urząd Pracy', ro: 'Centrul de Angajare', ru: 'Центр занятости' } },
  { id: 'arzt', icon: Stethoscope, de: 'Arztbesuch', color: '#16A34A',
    labels: { ar: 'زيارة الطبيب', uk: 'Лікар', es: 'Médico', en: 'Doctor', ku: 'Doktor', tr: 'Doktor', pl: 'Lekarz', ro: 'Medic', ru: 'Врач' } },
  { id: 'wohnung', icon: Home, de: 'Wohnung', color: '#D97706',
    labels: { ar: 'البحث عن شقة', uk: 'Квартира', es: 'Apartamento', en: 'Apartment', ku: 'Xanî', tr: 'Daire', pl: 'Mieszkanie', ro: 'Apartament', ru: 'Квартира' } },
  { id: 'alltag', icon: ShoppingCart, de: 'Alltag', color: '#9333EA',
    labels: { ar: 'الحياة اليومية', uk: 'Щоденне життя', es: 'Vida cotidiana', en: 'Daily life', ku: 'Jiyana rojane', tr: 'Günlük hayat', pl: 'Życie codzienne', ro: 'Viața cotidiană', ru: 'Повседневная жизнь' } },
  { id: 'behoerden', icon: FileText, de: 'Behörden', color: '#0891B2',
    labels: { ar: 'الدوائر الحكومية', uk: 'Державні органи', es: 'Oficinas', en: 'Authorities', ku: 'Dezgeh', tr: 'Kurumlar', pl: 'Urzędy', ro: 'Autorități', ru: 'Органы власти' } },
  { id: 'notfaelle', icon: Phone, de: 'Notfälle', color: '#DC2626',
    labels: { ar: 'الطوارئ', uk: 'Надзвичайні ситуації', es: 'Emergencias', en: 'Emergencies', ku: 'Awarte', tr: 'Acil durumlar', pl: 'Nagłe przypadki', ro: 'Urgențe', ru: 'Чрезвычайные ситуации' } },
  { id: 'schule', icon: GraduationCap, de: 'Schule & Kinder', color: '#F97316',
    labels: { ar: 'المدرسة والأطفال', uk: 'Школа і діти', es: 'Escuela e hijos', en: 'School & children', ku: 'Dibistan', tr: 'Okul ve çocuklar', pl: 'Szkoła i dzieci', ro: 'Școală și copii', ru: 'Школа и дети' } },
  { id: 'freizeit', icon: Coffee, de: 'Freizeit', color: '#059669',
    labels: { ar: 'وقت الفراغ', uk: 'Дозвілля', es: 'Tiempo libre', en: 'Free time', ku: 'Dem azad', tr: 'Serbest zaman', pl: 'Czas wolny', ro: 'Timp liber', ru: 'Свободное время' } },
]

export default async function LernenPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('native_language, full_name')
    .eq('id', user.id)
    .single()

  const lang = (profile?.native_language ?? 'ar') as NativeLanguage

  const { data: progressRows } = await db
    .from('linguu_progress')
    .select('topic_id, xp_earned')
    .eq('user_id', user.id)

  const xpByTopic: Record<string, number> = {}
  for (const row of progressRows ?? []) {
    xpByTopic[row.topic_id] = (xpByTopic[row.topic_id] ?? 0) + row.xp_earned
  }
  const totalXp = Object.values(xpByTopic).reduce((s, v) => s + v, 0)

  const GREETINGS: Record<NativeLanguage, string> = {
    ar: 'أهلاً',
    uk: 'Привіт',
    es: 'Hola',
    en: 'Hello',
    ku: 'Merheba',
    tr: 'Merhaba',
    pl: 'Cześć',
    ro: 'Salut',
    ru: 'Привет',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {GREETINGS[lang]}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min((totalXp / 2000) * 100, 100)}%`, background: 'var(--primary)' }} />
          </div>
          <span className="text-sm font-medium" style={{ fontFamily: 'Fira Code, monospace' }}>
            {totalXp} XP
          </span>
        </div>
      </div>

      {/* Themen-Grid */}
      <div className="grid grid-cols-2 gap-3">
        {TOPICS.map(({ id, icon: Icon, de, color, labels }) => {
          const topicXp = xpByTopic[id] ?? 0
          const done = topicXp > 0

          return (
            <Link key={id} href={`/lernen/${id}`}
              className="card flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md active:scale-98"
              style={{ borderColor: done ? color : 'var(--border)' }}>
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl" style={{ background: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                {done && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${color}15`, color }}>
                    {topicXp} XP
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{de}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {labels[lang] ?? labels.en}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
