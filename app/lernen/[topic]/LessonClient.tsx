'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Volume2, Mic, MicOff, ChevronRight, ChevronLeft, RotateCcw, Check, X } from 'lucide-react'
import type { Topic, Word, NativeLanguage } from '@/types'

interface Props {
  topic: Topic
  words: Word[]
  nativeLang: NativeLanguage
  doneTypes: string[]
  totalXp: number
}

type Mode = 'menu' | 'phrases' | 'vocab' | 'quiz' | 'result'

const XP = { phrases: 15, vocab: 20, quiz: 50 }

const UI_LABELS: Record<NativeLanguage, {
  phrases: string; vocab: string; quiz: string
  next: string; done: string; back: string
  correct: string; wrong: string; result: string
  yourScore: string; xpEarned: string; again: string; home: string
  listening: string; tap: string
}> = {
  ar: { phrases: 'العبارات', vocab: 'المفردات', quiz: 'اختبار', next: 'التالي', done: 'تم', back: 'رجوع', correct: 'صحيح', wrong: 'خطأ', result: 'النتيجة', yourScore: 'نتيجتك', xpEarned: 'نقاط XP', again: 'مرة أخرى', home: 'الرئيسية', listening: 'جارٍ الاستماع...', tap: 'اضغط للتقليب' },
  uk: { phrases: 'Фрази', vocab: 'Слова', quiz: 'Тест', next: 'Далі', done: 'Готово', back: 'Назад', correct: 'Правильно', wrong: 'Неправильно', result: 'Результат', yourScore: 'Ваш результат', xpEarned: 'XP зароблено', again: 'Ще раз', home: 'Головна', listening: 'Слухаю...', tap: 'Торкніться, щоб перевернути' },
  es: { phrases: 'Frases', vocab: 'Vocabulario', quiz: 'Test', next: 'Siguiente', done: 'Listo', back: 'Atrás', correct: 'Correcto', wrong: 'Incorrecto', result: 'Resultado', yourScore: 'Tu puntuación', xpEarned: 'XP ganados', again: 'Otra vez', home: 'Inicio', listening: 'Escuchando...', tap: 'Toca para voltear' },
  en: { phrases: 'Phrases', vocab: 'Vocabulary', quiz: 'Quiz', next: 'Next', done: 'Done', back: 'Back', correct: 'Correct', wrong: 'Wrong', result: 'Result', yourScore: 'Your score', xpEarned: 'XP earned', again: 'Again', home: 'Home', listening: 'Listening...', tap: 'Tap to flip' },
  ku: { phrases: 'Hevok', vocab: 'Peyvên', quiz: 'Ceribandin', next: 'Pêş', done: 'Qediya', back: 'Paş', correct: 'Rast', wrong: 'Xelet', result: 'Encam', yourScore: 'Encama te', xpEarned: 'XP qezenckir', again: 'Dîsa', home: 'Mal', listening: 'Guhdarî dike...', tap: 'Bikirtîne da zivirî' },
  tr: { phrases: 'İfadeler', vocab: 'Kelimeler', quiz: 'Test', next: 'İleri', done: 'Tamam', back: 'Geri', correct: 'Doğru', wrong: 'Yanlış', result: 'Sonuç', yourScore: 'Puanınız', xpEarned: 'XP kazanıldı', again: 'Tekrar', home: 'Ana sayfa', listening: 'Dinleniyor...', tap: 'Çevirmek için dokun' },
  pl: { phrases: 'Zwroty', vocab: 'Słówka', quiz: 'Quiz', next: 'Dalej', done: 'Gotowe', back: 'Wstecz', correct: 'Dobrze', wrong: 'Źle', result: 'Wynik', yourScore: 'Twój wynik', xpEarned: 'Zdobyte XP', again: 'Jeszcze raz', home: 'Strona główna', listening: 'Słucham...', tap: 'Dotknij, by obrócić' },
  ro: { phrases: 'Expresii', vocab: 'Vocabular', quiz: 'Test', next: 'Următor', done: 'Gata', back: 'Înapoi', correct: 'Corect', wrong: 'Greșit', result: 'Rezultat', yourScore: 'Scorul tău', xpEarned: 'XP câștigat', again: 'Din nou', home: 'Acasă', listening: 'Ascult...', tap: 'Atinge pentru a întoarce' },
  ru: { phrases: 'Фразы', vocab: 'Слова', quiz: 'Тест', next: 'Далее', done: 'Готово', back: 'Назад', correct: 'Правильно', wrong: 'Неверно', result: 'Результат', yourScore: 'Ваш результат', xpEarned: 'XP заработано', again: 'Ещё раз', home: 'Главная', listening: 'Слушаю...', tap: 'Нажмите, чтобы перевернуть' },
}

async function speak(text: string, voice = 'nova') {
  const res = await fetch('/api/openai/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', input: text, voice, speed: 0.85 }),
  })
  if (!res.ok) return
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.onended = () => URL.revokeObjectURL(url)
  await audio.play()
}

async function saveProgress(type: 'phrases' | 'vocab' | 'quiz', topicId: string, score?: number, xp?: number) {
  await fetch('/api/progress', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'linguu', topic_id: topicId, lesson_type: type, score: score ?? null, xp_earned: xp ?? 0, duration_seconds: 0 }),
  })
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ── PHRASES MODE ────────────────────────────────────────────────
function PhrasesMode({ topic, nativeLang, onDone, l }: {
  topic: Topic; nativeLang: NativeLanguage
  onDone: (xp: number) => void; l: typeof UI_LABELS[NativeLanguage]
}) {
  const [idx, setIdx] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [playing, setPlaying] = useState(false)

  const phrase = topic.phrases[idx]
  const isLast = idx === topic.phrases.length - 1

  async function handleSpeak() {
    setPlaying(true)
    await speak(phrase.german)
    setPlaying(false)
  }

  async function handleNext() {
    setShowTranslation(false)
    if (isLast) {
      await saveProgress('phrases', topic.id, undefined, XP.phrases)
      onDone(XP.phrases)
    } else {
      setIdx(i => i + 1)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted)' }}>
        <span>{idx + 1} / {topic.phrases.length}</span>
        <div className="flex-1 mx-4 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((idx + 1) / topic.phrases.length) * 100}%`, background: 'var(--primary)' }} />
        </div>
        <span>+{XP.phrases} XP</span>
      </div>

      {/* Hauptkarte */}
      <div className="card text-center py-8 px-6">
        <p className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fira Code, monospace' }}>
          {phrase.german}
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>{phrase.phonetics}</p>

        <button onClick={handleSpeak} disabled={playing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm cursor-pointer transition-all mb-6"
          style={{ background: playing ? 'var(--border)' : 'rgba(37,99,235,0.08)', color: 'var(--primary)' }}>
          <Volume2 size={16} />
          {playing ? '▶ ...' : 'Anhören'}
        </button>

        {showTranslation ? (
          <div className="rounded-xl p-4" style={{ background: 'var(--bg)' }}>
            <p className="text-lg font-medium">{phrase.translations[nativeLang] ?? phrase.translations.en}</p>
            {phrase.exampleDE && (
              <p className="text-sm mt-3 italic" style={{ color: 'var(--muted)' }}>
                „{phrase.exampleDE}"
              </p>
            )}
          </div>
        ) : (
          <button onClick={() => setShowTranslation(true)}
            className="text-sm font-medium cursor-pointer px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--muted)', background: 'var(--bg)' }}>
            Übersetzung zeigen
          </button>
        )}
      </div>

      <button onClick={handleNext} className="btn-primary justify-center w-full">
        {isLast ? <><Check size={16} /> {l.done}</> : <>{l.next} <ChevronRight size={16} /></>}
      </button>
    </div>
  )
}

// ── VOCAB MODE ──────────────────────────────────────────────────
function VocabMode({ topic, words, nativeLang, onDone, l }: {
  topic: Topic; words: Word[]; nativeLang: NativeLanguage
  onDone: (xp: number) => void; l: typeof UI_LABELS[NativeLanguage]
}) {
  const [deck] = useState(() => shuffle(words).slice(0, 15))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [playing, setPlaying] = useState(false)

  const word = deck[idx]
  const isLast = idx === deck.length - 1

  async function handleSpeak() {
    setPlaying(true)
    const text = word.article ? `${word.article} ${word.german}` : word.german
    await speak(text)
    setPlaying(false)
  }

  async function handleNext() {
    setFlipped(false)
    if (isLast) {
      await saveProgress('vocab', topic.id, undefined, XP.vocab)
      onDone(XP.vocab)
    } else {
      setIdx(i => i + 1)
    }
  }

  if (!word) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted)' }}>
        <span>{idx + 1} / {deck.length}</span>
        <div className="flex-1 mx-4 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((idx + 1) / deck.length) * 100}%`, background: '#16A34A' }} />
        </div>
        <span>+{XP.vocab} XP</span>
      </div>

      <button onClick={() => setFlipped(f => !f)}
        className="card text-center py-10 cursor-pointer transition-all hover:shadow-md min-h-48 flex flex-col items-center justify-center gap-3"
        style={{ borderColor: flipped ? '#16A34A' : 'var(--border)' }}>
        {!flipped ? (
          <>
            {word.article && <span className="text-sm px-2 py-0.5 rounded" style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--primary)' }}>{word.article}</span>}
            <p className="text-3xl font-bold" style={{ fontFamily: 'Fira Code, monospace' }}>{word.german}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{l.tap}</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-medium">{word.translations[nativeLang] ?? word.translations.en}</p>
            <button onClick={(e) => { e.stopPropagation(); handleSpeak() }} disabled={playing}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full cursor-pointer mt-2"
              style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--primary)' }}>
              <Volume2 size={14} />
              {playing ? '...' : word.german}
            </button>
          </>
        )}
      </button>

      <button onClick={handleNext} className="btn-primary justify-center w-full">
        {isLast ? <><Check size={16} /> {l.done}</> : <>{l.next} <ChevronRight size={16} /></>}
      </button>
    </div>
  )
}

// ── QUIZ MODE ───────────────────────────────────────────────────
interface QuizQuestion { phrase: Topic['phrases'][0]; options: string[]; correct: string }

function buildQuizQuestions(topic: Topic, lang: NativeLanguage): QuizQuestion[] {
  const available = topic.phrases.filter(p => p.translations[lang])
  const questions = shuffle(available).slice(0, Math.min(8, available.length))
  const allTranslations = available.map(p => p.translations[lang]!).filter(Boolean)

  return questions.map(phrase => {
    const correct = phrase.translations[lang]!
    const wrong = shuffle(allTranslations.filter(t => t !== correct)).slice(0, 3)
    return { phrase, options: shuffle([correct, ...wrong]), correct }
  })
}

function QuizMode({ topic, nativeLang, onDone, l }: {
  topic: Topic; nativeLang: NativeLanguage
  onDone: (xp: number, score: number, total: number) => void
  l: typeof UI_LABELS[NativeLanguage]
}) {
  const [questions] = useState(() => buildQuizQuestions(topic, nativeLang))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)

  const q = questions[idx]

  async function handleSelect(opt: string) {
    if (selected) return
    setSelected(opt)
    const isCorrect = opt === q.correct
    if (isCorrect) setCorrect(c => c + 1)

    await new Promise(r => setTimeout(r, 900))

    if (idx + 1 >= questions.length) {
      const finalCorrect = isCorrect ? correct + 1 : correct
      const xp = Math.round((finalCorrect / questions.length) * XP.quiz)
      await saveProgress('quiz', topic.id, finalCorrect, xp)
      onDone(xp, finalCorrect, questions.length)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
    }
  }

  if (!q) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted)' }}>
        <span>{idx + 1} / {questions.length}</span>
        <div className="flex-1 mx-4 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%`, background: 'var(--accent)' }} />
        </div>
        <span>bis +{XP.quiz} XP</span>
      </div>

      <div className="card text-center py-6">
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>Was bedeutet:</p>
        <p className="text-2xl font-bold" style={{ fontFamily: 'Fira Code, monospace' }}>{q.phrase.german}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {q.options.map(opt => {
          let bg = 'white'
          let border = 'var(--border)'
          let color = 'var(--text)'
          if (selected) {
            if (opt === q.correct) { bg = '#F0FDF4'; border = '#16A34A'; color = '#15803D' }
            else if (opt === selected) { bg = '#FEF2F2'; border = '#DC2626'; color = '#DC2626' }
          }
          return (
            <button key={opt} onClick={() => handleSelect(opt)}
              className="w-full p-4 rounded-xl text-left font-medium text-base cursor-pointer transition-all"
              style={{ background: bg, border: `1.5px solid ${border}`, color }}>
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {selected && opt === q.correct && <Check size={18} style={{ color: '#16A34A' }} />}
                {selected && opt === selected && opt !== q.correct && <X size={18} style={{ color: '#DC2626' }} />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── RESULT SCREEN ───────────────────────────────────────────────
function ResultScreen({ xp, score, total, topicId, l }: {
  xp: number; score?: number; total?: number; topicId: string
  l: typeof UI_LABELS[NativeLanguage]
}) {
  const pct = score != null && total ? Math.round((score / total) * 100) : null

  return (
    <div className="card text-center py-10 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
        style={{ background: 'rgba(37,99,235,0.08)' }}>
        {pct != null ? (pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪') : '✅'}
      </div>
      <div>
        {score != null && total && (
          <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'Fira Code, monospace', color: 'var(--primary)' }}>
            {score}/{total}
          </p>
        )}
        <p className="text-sm" style={{ color: 'var(--muted)' }}>{l.yourScore}</p>
      </div>
      <div className="px-4 py-2 rounded-full font-bold text-white" style={{ background: 'var(--primary)' }}>
        +{xp} {l.xpEarned}
      </div>
      <Link href={`/lernen`} className="btn-primary mt-2">
        {l.home}
      </Link>
    </div>
  )
}

// ── HAUPTKOMPONENTE ─────────────────────────────────────────────
export default function LessonClient({ topic, words, nativeLang, doneTypes, totalXp }: Props) {
  const [mode, setMode] = useState<Mode>('menu')
  const [resultXp, setResultXp] = useState(0)
  const [resultScore, setResultScore] = useState<{ score: number; total: number } | undefined>()

  const l = UI_LABELS[nativeLang] ?? UI_LABELS.en

  const handleDone = useCallback((xp: number, score?: number, total?: number) => {
    setResultXp(xp)
    if (score != null && total != null) setResultScore({ score, total })
    setMode('result')
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lernen" className="p-2 rounded-lg cursor-pointer transition-colors"
          style={{ color: 'var(--muted)', background: 'var(--bg)' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-none">{topic.titleDE}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{topic.subtitleDE}</p>
        </div>
        {totalXp > 0 && (
          <span className="text-sm font-medium px-3 py-1 rounded-full"
            style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--primary)', fontFamily: 'Fira Code, monospace' }}>
            {totalXp} XP
          </span>
        )}
      </div>

      {/* Menü */}
      {mode === 'menu' && (
        <div className="flex flex-col gap-3">
          {[
            { id: 'phrases' as const, label: l.phrases, sub: `${topic.phrases.length} Phrasen`, color: 'var(--primary)', xp: XP.phrases },
            { id: 'vocab' as const, label: l.vocab, sub: `${Math.min(words.length, 15)} Vokabeln`, color: '#16A34A', xp: XP.vocab },
            { id: 'quiz' as const, label: l.quiz, sub: 'Multiple Choice', color: 'var(--accent)', xp: XP.quiz },
          ].map(({ id, label, sub, color, xp }) => (
            <button key={id} onClick={() => setMode(id)}
              className="card flex items-center gap-4 cursor-pointer transition-all hover:shadow-md text-left w-full"
              style={{ borderColor: doneTypes.includes(id) ? color : 'var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
                style={{ background: color }}>
                {doneTypes.includes(id) ? <Check size={18} /> : label.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{sub}</p>
              </div>
              <span className="text-sm font-medium" style={{ color, fontFamily: 'Fira Code, monospace' }}>
                +{xp} XP
              </span>
            </button>
          ))}
        </div>
      )}

      {mode === 'phrases' && (
        <PhrasesMode topic={topic} nativeLang={nativeLang} onDone={(xp) => handleDone(xp)} l={l} />
      )}

      {mode === 'vocab' && words.length > 0 && (
        <VocabMode topic={topic} words={words} nativeLang={nativeLang} onDone={(xp) => handleDone(xp)} l={l} />
      )}

      {mode === 'quiz' && (
        <QuizMode topic={topic} nativeLang={nativeLang} onDone={(xp, s, t) => handleDone(xp, s, t)} l={l} />
      )}

      {mode === 'result' && (
        <ResultScreen xp={resultXp} score={resultScore?.score} total={resultScore?.total} topicId={topic.id} l={l} />
      )}
    </div>
  )
}
