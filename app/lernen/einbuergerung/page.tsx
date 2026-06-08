import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Landmark, ShieldCheck } from 'lucide-react'

const QUESTIONS = [
  {
    q: 'Was ist das Grundgesetz?',
    a: 'Die Verfassung der Bundesrepublik Deutschland.',
  },
  {
    q: 'Wer wählt den Bundestag?',
    a: 'Die Bürgerinnen und Bürger mit Wahlrecht.',
  },
  {
    q: 'Was bedeutet Religionsfreiheit?',
    a: 'Jeder Mensch darf seine Religion frei wählen und ausüben.',
  },
  {
    q: 'Welche Behörde ist oft für die Einbürgerung zuständig?',
    a: 'Die Einbürgerungsbehörde der Stadt oder des Landkreises.',
  },
]

export default function EinbuergerungPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lernen" className="p-2 rounded-lg" style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold leading-none">Einbürgerung & Orientierung</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Informationen für Teilnehmer von Integrationsmaßnahmen
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.10))', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.14)' }}>
            <Landmark size={24} style={{ color: '#6366f1' }} />
          </div>
          <div>
            <p className="font-semibold">WID ist hier bewusst nur die Schaltzentrale.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Deutschlernen passiert in Linguu, Jobsuche in JobMate. In WID findest du deinen Fortschritt,
              deinen WID-Code und grundlegende Orientierung zur Einbürgerung.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          'Sprachniveau: in der Regel B1 nachweisen',
          'Einbürgerungstest oder vergleichbarer Nachweis',
          'Geklärte Identität und gültiger Aufenthalt',
          'Grundkenntnisse der Rechts- und Gesellschaftsordnung',
        ].map(item => (
          <div key={item} className="card flex items-start gap-3">
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <p className="text-sm">{item}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} style={{ color: '#6366f1' }} />
          <h2 className="text-base font-semibold">Beispiel-Fragen</h2>
        </div>
        <div className="space-y-3">
          {QUESTIONS.map((item, index) => (
            <details key={item.q} className="rounded-xl p-4" style={{ background: 'var(--surface-2)' }}>
              <summary className="cursor-pointer text-sm font-medium">
                {index + 1}. {item.q}
              </summary>
              <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
