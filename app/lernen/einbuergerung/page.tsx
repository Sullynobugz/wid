'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, Landmark, ChevronRight,
  RotateCcw, Trophy, MapPin, BookOpen,
} from 'lucide-react'
import questionsData from '@/data/einbuergerung/questions.json'

type Question = {
  id: string
  part: string
  category: string
  localNumber: number
  question: string
  options: string[]
  type: string
  image: string | null
  correctIndex: number
  confidence: string
  sourcePage: number | null
}

const BUNDESLAENDER = [
  { code: 'bw', name: 'Baden-Württemberg' },
  { code: 'by', name: 'Bayern' },
  { code: 'be', name: 'Berlin' },
  { code: 'bb', name: 'Brandenburg' },
  { code: 'hb', name: 'Bremen' },
  { code: 'hh', name: 'Hamburg' },
  { code: 'he', name: 'Hessen' },
  { code: 'mv', name: 'Mecklenburg-Vorpommern' },
  { code: 'ni', name: 'Niedersachsen' },
  { code: 'nw', name: 'Nordrhein-Westfalen' },
  { code: 'rp', name: 'Rheinland-Pfalz' },
  { code: 'sl', name: 'Saarland' },
  { code: 'sn', name: 'Sachsen' },
  { code: 'st', name: 'Sachsen-Anhalt' },
  { code: 'sh', name: 'Schleswig-Holstein' },
  { code: 'th', name: 'Thüringen' },
]

const VORAUSSETZUNGEN = [
  'Sprachniveau: in der Regel B1 nachweisen',
  'Einbürgerungstest oder vergleichbarer Nachweis',
  'Geklärte Identität und gültiger Aufenthalt',
  'Grundkenntnisse der Rechts- und Gesellschaftsordnung',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuiz(blCode: string): Question[] {
  const all = questionsData as Question[]
  const general = shuffle(all.filter(q => q.part === 'Allgemein')).slice(0, 30)
  const landQuestions = shuffle(all.filter(q => q.id.startsWith(blCode))).slice(0, 3)
  return shuffle([...general, ...landQuestions])
}

type Phase = 'start' | 'quiz' | 'result'

export default function EinbuergerungPage() {
  const [phase, setPhase] = useState<Phase>('start')
  const [selectedBL, setSelectedBL] = useState<string>('bw')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  const startQuiz = useCallback(() => {
    const q = buildQuiz(selectedBL)
    setQuestions(q)
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
    setPhase('quiz')
  }, [selectedBL])

  const handleAnswer = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === questions[current].correctIndex) {
      setScore(s => s + 1)
    }
  }

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setPhase('result')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const blName = BUNDESLAENDER.find(b => b.code === selectedBL)?.name ?? ''

  if (phase === 'quiz') {
    const q = questions[current]
    const progress = ((current + 1) / questions.length) * 100

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPhase('start')}
            className="p-2 rounded-lg"
            style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            Frage {current + 1} von {questions.length}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            {score} richtig
          </span>
        </div>

        {/* Fortschrittsbalken */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'var(--primary)' }}
          />
        </div>

        {/* Kategorie-Badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
          >
            {q.part === 'Allgemein' ? 'Allgemein' : blName}
          </span>
          {q.confidence === 'aktuell' && (
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: '#FEF3C7', color: '#92400E' }}
            >
              Zeitabhängig — bitte prüfen
            </span>
          )}
        </div>

        {/* Frage */}
        <div className="card">
          <p className="text-base font-semibold leading-relaxed">{q.question}</p>
        </div>

        {/* Antwort-Optionen */}
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let bg = 'var(--surface)'
            let border = 'var(--border)'
            let color = 'var(--text)'

            if (answered) {
              if (idx === q.correctIndex) {
                bg = 'var(--success-bg)'
                border = 'var(--success)'
                color = 'var(--success)'
              } else if (idx === selected && idx !== q.correctIndex) {
                bg = 'var(--danger-bg)'
                border = 'var(--danger)'
                color = 'var(--danger)'
              } else {
                color = 'var(--muted)'
              }
            } else if (selected === idx) {
              border = 'var(--primary)'
              bg = 'var(--primary-subtle)'
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className="w-full text-left rounded-xl p-4 flex items-start gap-3 transition-all"
                style={{
                  background: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  cursor: answered ? 'default' : 'pointer',
                }}
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{
                    background: answered && idx === q.correctIndex ? 'var(--success)' : answered && idx === selected && idx !== q.correctIndex ? 'var(--danger)' : 'var(--surface-2)',
                    color: answered && (idx === q.correctIndex || (idx === selected && idx !== q.correctIndex)) ? '#fff' : 'inherit',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm leading-relaxed">{opt}</span>
                {answered && idx === q.correctIndex && (
                  <CheckCircle2 size={18} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                )}
                {answered && idx === selected && idx !== q.correctIndex && (
                  <XCircle size={18} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                )}
              </button>
            )
          })}
        </div>

        {answered && (
          <button onClick={nextQuestion} className="btn-primary w-full flex items-center justify-center gap-2">
            {current + 1 >= questions.length ? 'Ergebnis anzeigen' : 'Nächste Frage'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    )
  }

  if (phase === 'result') {
    const pct = Math.round((score / questions.length) * 100)
    const passed = score >= 17
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('start')}
            className="p-2 rounded-lg"
            style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold">Testergebnis</h1>
        </div>

        <div
          className="card text-center py-8"
          style={{ border: `2px solid ${passed ? 'var(--success)' : 'var(--danger)'}` }}
        >
          <Trophy size={48} className="mx-auto mb-3" style={{ color: passed ? 'var(--success)' : 'var(--muted)' }} />
          <p className="text-5xl font-bold mb-1" style={{ color: passed ? 'var(--success)' : 'var(--danger)' }}>
            {score}/{questions.length}
          </p>
          <p className="text-lg font-semibold mt-2">
            {passed ? 'Bestanden' : 'Nicht bestanden'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {pct}% richtig · Zum Bestehen: 17 von {questions.length} ({Math.round((17 / questions.length) * 100)}%)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>{score}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Richtig</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--danger)' }}>{questions.length - score}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Falsch</p>
          </div>
        </div>

        <button onClick={startQuiz} className="btn-primary w-full flex items-center justify-center gap-2">
          <RotateCcw size={16} />
          Neuen Test starten
        </button>
        <button
          onClick={() => setPhase('start')}
          className="btn-secondary w-full"
        >
          Zurück zur Übersicht
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lernen" className="p-2 rounded-lg" style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold leading-none">Einbürgerung & Orientierung</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            460 offizielle BAMF-Fragen · Simulation des echten Tests
          </p>
        </div>
      </div>

      {/* Hinweis-Banner */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.10))', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.14)' }}>
            <Landmark size={24} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <p className="font-semibold">Echter BAMF-Fragenkatalog</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Der Test enthält 33 Fragen: 30 allgemeine + 3 bundeslandspezifische.
              Zum Bestehen werden <strong>17 richtige Antworten</strong> benötigt (ca. 51%).
            </p>
          </div>
        </div>
      </div>

      {/* Voraussetzungen */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} style={{ color: 'var(--primary)' }} />
          <h2 className="text-sm font-semibold">Voraussetzungen zur Einbürgerung</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {VORAUSSETZUNGEN.map(item => (
            <div key={item} className="card flex items-start gap-3">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bundesland-Auswahl */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} style={{ color: 'var(--primary)' }} />
          <h2 className="text-base font-semibold">Bundesland wählen</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          3 der 33 Test-Fragen sind bundeslandspezifisch. Wähle das Bundesland, in dem du den Test ablegen möchtest.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BUNDESLAENDER.map(bl => (
            <button
              key={bl.code}
              onClick={() => setSelectedBL(bl.code)}
              className="text-sm py-2 px-3 rounded-xl text-left transition-all"
              style={{
                background: selectedBL === bl.code ? 'var(--primary-subtle)' : 'var(--surface-2)',
                border: `1.5px solid ${selectedBL === bl.code ? 'var(--primary)' : 'transparent'}`,
                color: selectedBL === bl.code ? 'var(--primary)' : 'var(--text)',
                fontWeight: selectedBL === bl.code ? 600 : 400,
              }}
            >
              {bl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Start-Button */}
      <button onClick={startQuiz} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
        Test starten — {blName}
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
