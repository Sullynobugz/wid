import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Stethoscope, Home, ShoppingCart, FileText, Phone, GraduationCap, Coffee, ExternalLink } from 'lucide-react'
import type { NativeLanguage } from '@/types'
import { CopyButton } from '@/components/lernen/CopyButton'
import WelcomeModal from '@/components/lernen/WelcomeModal'

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

type ResourceItem = {
  icon: string
  de: string
  deDesc: string
  url: string
  labels: Partial<Record<NativeLanguage, string>>
  desc: Partial<Record<NativeLanguage, string>>
}

const RESOURCES: ResourceItem[] = [
  {
    icon: '🏠',
    de: 'Anmeldung (Einwohnermeldeamt)',
    deDesc: 'Erster Schritt — Pflicht innerhalb von 14 Tagen',
    url: 'https://www.germany.info/us-en/service/registration',
    labels: { ar: 'تسجيل الإقامة', uk: 'Реєстрація місця проживання', es: 'Registro de residencia', en: 'Residence Registration', tr: 'İkamet tescili', pl: 'Rejestracja meldunkowa', ro: 'Înregistrare reședință', ru: 'Регистрация по месту жительства' },
    desc: { ar: 'الخطوة الأولى — مطلوب خلال 14 يومًا', uk: 'Перший крок — потрібно протягом 14 днів', es: 'Primer paso — requerido dentro de 14 días', en: 'First step — required within 14 days', tr: 'İlk adım — 14 gün içinde gerekli', pl: 'Pierwszy krok — wymagany w ciągu 14 dni', ro: 'Primul pas — obligatoriu în 14 zile', ru: 'Первый шаг — обязателен в течение 14 дней' },
  },
  {
    icon: '💼',
    de: 'Bundesagentur für Arbeit',
    deDesc: 'Jobsuche + Arbeitslosengeld beantragen',
    url: 'https://www.arbeitsagentur.de',
    labels: { ar: 'وكالة العمل الفيدرالية', uk: 'Федеральне агентство праці', es: 'Agencia Federal de Empleo', en: 'Federal Employment Agency', tr: 'Federal İş Ajansı', pl: 'Federalna Agencja Pracy', ro: 'Agenția Federală de Muncă', ru: 'Федеральное агентство труда' },
    desc: { ar: 'مساعدة في البحث عن العمل وإعانات البطالة', uk: 'Допомога з пошуком роботи та допомога по безробіттю', es: 'Ayuda para encontrar trabajo y subsidio de desempleo', en: 'Job search support and unemployment benefits', tr: 'İş arama desteği ve işsizlik yardımı', pl: 'Pomoc w szukaniu pracy i zasiłek dla bezrobotnych', ro: 'Ajutor în căutarea unui loc de muncă', ru: 'Помощь в поиске работы и пособие по безработице' },
  },
  {
    icon: '📚',
    de: 'BAMF — Integrationskurs',
    deDesc: 'Kostenlose Deutschkurse + Orientierung',
    url: 'https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/integrationskurse-node.html',
    labels: { ar: 'دورة الاندماج', uk: 'Курс інтеграції', es: 'Curso de integración', en: 'Integration Course', tr: 'Entegrasyon kursu', pl: 'Kurs integracyjny', ro: 'Curs de integrare', ru: 'Интеграционный курс' },
    desc: { ar: 'دروس مجانية في اللغة الألمانية + التوجه', uk: 'Безкоштовні курси німецької мови + орієнтація', es: 'Clases gratuitas de alemán + orientación', en: 'Free German classes + orientation', tr: 'Ücretsiz Almanca dersleri + oryantasyon', pl: 'Bezpłatne lekcje języka niemieckiego', ro: 'Lecții gratuite de germană + orientare', ru: 'Бесплатные курсы немецкого языка' },
  },
  {
    icon: '🏥',
    de: 'Krankenversicherung',
    deDesc: 'In Deutschland Pflicht — so anmelden',
    url: 'https://www.tk.de/techniker/leistungen-und-mitgliedschaft/mitglied-werden/versicherungspflicht-2006158',
    labels: { ar: 'التأمين الصحي', uk: 'Медичне страхування', es: 'Seguro médico', en: 'Health Insurance', tr: 'Sağlık sigortası', pl: 'Ubezpieczenie zdrowotne', ro: 'Asigurare de sănătate', ru: 'Медицинская страховка' },
    desc: { ar: 'إلزامي في ألمانيا — كيفية التسجيل', uk: 'Обов\'язкове в Німеччині — як зареєструватись', es: 'Obligatorio en Alemania — cómo registrarse', en: 'Mandatory in Germany — how to register', tr: 'Almanya\'da zorunlu — nasıl kaydolunur', pl: 'Obowiązkowe w Niemczech — jak się zarejestrować', ro: 'Obligatoriu în Germania — cum să te înregistrezi', ru: 'Обязательно в Германии — как зарегистрироваться' },
  },
  {
    icon: '🏦',
    de: 'Sozialamt / Grundsicherung',
    deDesc: 'Finanzielle Unterstützung für Bedürftige',
    url: 'https://www.bmas.de/DE/Soziales/Grundsicherung-fuer-Arbeitsuchende/grundsicherung-fuer-arbeitsuchende-art.html',
    labels: { ar: 'مكتب الرعاية الاجتماعية', uk: 'Соціальне відомство', es: 'Oficina de asistencia social', en: 'Social Welfare Office', tr: 'Sosyal yardım ofisi', pl: 'Urząd Socjalny', ro: 'Biroul de asistență socială', ru: 'Отдел социального обеспечения' },
    desc: { ar: 'مساعدة مالية للأشخاص الذين يحتاجون إليها', uk: 'Фінансова допомога для тих, хто її потребує', es: 'Apoyo financiero para quienes lo necesitan', en: 'Financial support for those in need', tr: 'İhtiyaç sahipleri için mali destek', pl: 'Wsparcie finansowe dla potrzebujących', ro: 'Sprijin financiar pentru cei care au nevoie', ru: 'Финансовая поддержка для нуждающихся' },
  },
  {
    icon: '📞',
    de: 'Notrufnummern',
    deDesc: '110 Polizei · 112 Rettungsdienst & Feuerwehr',
    url: 'https://www.notruf-112.de',
    labels: { ar: 'أرقام الطوارئ', uk: 'Номери екстреної допомоги', es: 'Números de emergencia', en: 'Emergency Numbers', tr: 'Acil durum numaraları', pl: 'Numery alarmowe', ro: 'Numere de urgență', ru: 'Номера экстренных служб' },
    desc: { ar: '110 شرطة · 112 إسعاف وإطفاء', uk: '110 поліція · 112 швидка та пожежна', es: '110 Policía · 112 Ambulancia e incendios', en: '110 Police · 112 Ambulance & fire', tr: '110 Polis · 112 Ambulans ve itfaiye', pl: '110 Policja · 112 Pogotowie i straż', ro: '110 Poliție · 112 Ambulanță și pompieri', ru: '110 Полиция · 112 Скорая и пожарная' },
  },
]

const SECTION_LABEL: Record<NativeLanguage, string> = {
  ar: 'موارد مفيدة — خطواتك الأولى في ألمانيا',
  uk: 'Корисні ресурси — перші кроки в Німеччині',
  es: 'Recursos útiles — primeros pasos en Alemania',
  en: 'Helpful resources — first steps in Germany',
  ku: 'Çavkaniyên kêrhatî — gavên yekem li Almanyayê',
  tr: 'Faydalı kaynaklar — Almanya\'daki ilk adımlar',
  pl: 'Przydatne zasoby — pierwsze kroki w Niemczech',
  ro: 'Resurse utile — primii pași în Germania',
  ru: 'Полезные ресурсы — первые шаги в Германии',
}

export default async function LernenPage() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('native_language, full_name, participant_code')
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

  const isRtl = lang === 'ar' || lang === 'ku'

  return (
    <div>
      {profile?.participant_code && (
        <WelcomeModal
          lang={lang}
          participantCode={profile.participant_code}
          isNewUser={totalXp === 0}
        />
      )}
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
          {GREETINGS[lang]}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Willkommen, {profile?.full_name?.split(' ')[0]}!
        </p>
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

      {/* WID-Code Banner — prominent für Linguu + JobMate Verbindung */}
      {profile?.participant_code && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(37,99,235,0.06)', border: '2px solid rgba(37,99,235,0.2)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>
            WID-Code — für Linguu & JobMate
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-widest" style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
              {profile.participant_code}
            </span>
            <CopyButton text={profile.participant_code} />
          </div>
        </div>
      )}

      {/* Themen-Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
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

      {/* Ressourcen-Sektion */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--muted)' }} dir={isRtl ? 'rtl' : 'ltr'}>
            {SECTION_LABEL[lang]}
          </h2>
          <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.65 }}>
            Nützliche Ressourcen — erste Schritte in Deutschland
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {RESOURCES.map(resource => {
            const nativeLabel = resource.labels[lang]
            const nativeDesc = resource.desc[lang]
            const showGermanTitle = nativeLabel && nativeLabel !== resource.de
            const showGermanDesc = nativeDesc && nativeDesc !== resource.deDesc
            return (
              <a
                key={resource.de}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card flex items-start gap-3 transition-all hover:shadow-sm"
                style={{ padding: '12px 14px', textDecoration: 'none' }}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{resource.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }} dir={isRtl ? 'rtl' : 'ltr'}>
                    {nativeLabel ?? resource.de}
                  </p>
                  {showGermanTitle && (
                    <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                      {resource.de}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }} dir={isRtl ? 'rtl' : 'ltr'}>
                    {nativeDesc ?? resource.desc.en}
                  </p>
                  {showGermanDesc && (
                    <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                      {resource.deDesc}
                    </p>
                  )}
                </div>
                <ExternalLink size={14} className="flex-shrink-0 mt-1" style={{ color: 'var(--muted)' }} />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
