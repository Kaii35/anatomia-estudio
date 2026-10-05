import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Target, Trash2, Trophy } from 'lucide-react'
import { regions, regionById } from '../data/regions'
import { questions, questionsByRegion } from '../data/questions'
import { dayStreak, mastery } from '../lib/session'
import { useProgress } from '../store/progress'
import { ProgressBar } from '../components/Layout'

const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function Progress() {
  const { stats, sessions, days, reset } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const all = Object.values(stats)
  const seen = all.reduce((a, s) => a + s.seen, 0)
  const ok = all.reduce((a, s) => a + s.ok, 0)
  const mastered = all.filter((s) => s.streak >= 2).length

  const tiles = [
    { icon: Flame, label: 'Días seguidos', value: dayStreak(days) },
    { icon: Target, label: 'Acierto global', value: seen ? `${Math.round((ok / seen) * 100)}%` : '—' },
    { icon: Trophy, label: 'Preguntas dominadas', value: `${mastered} / ${questions.length}` },
  ]

  return (
    <div className="space-y-9">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Progreso</h1>
        <p className="mt-1 text-muted">Una pregunta se considera dominada tras dos aciertos seguidos. Se guarda en este navegador.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5">
            <Icon size={18} className="text-accent" />
            <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="font-display text-xl font-semibold">Por región</h2>
        <ul className="mt-5 space-y-4">
          {regions.map((r) => {
            const qs = questionsByRegion(r.id)
            const m = mastery(qs, stats)
            const failing = qs.filter((q) => stats[q.id] && !stats[q.id].lastOk).length
            return (
              <li key={r.id} className="grid items-center gap-x-4 gap-y-1.5 sm:grid-cols-[11rem_1fr_auto]">
                <Link to={`/region/${r.id}`} className="font-medium hover:underline">
                  {r.name}
                </Link>
                <ProgressBar value={m} color={r.color} />
                <span className="text-sm text-muted tabular-nums">
                  {Math.round(m * 100)}%{failing > 0 && ` · ${failing} por repasar`}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-xl font-semibold">Últimas prácticas</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Aún no has terminado ninguna práctica.{' '}
            <Link to="/practica" className="font-medium text-accent">
              Empieza una
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {sessions.slice(0, 12).map((s) => (
              <li key={s.at} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="min-w-0 truncate">
                  <span className="text-muted">{dateFormat.format(s.at)} · </span>
                  {s.regions.length === regions.length ? 'Todas las regiones' : s.regions.map((id) => regionById[id]?.name).join(', ')}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {Math.round(s.score * 10) / 10} / {s.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex items-center gap-3">
        {confirming ? (
          <>
            <span className="text-sm">¿Borrar todo el progreso? No se puede deshacer.</span>
            <button
              type="button"
              className="btn bg-bad text-bg"
              onClick={() => {
                reset()
                setConfirming(false)
              }}
            >
              Sí, borrar
            </button>
            <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="btn-ghost" onClick={() => setConfirming(true)}>
            <Trash2 size={15} /> Reiniciar progreso
          </button>
        )}
      </div>
    </div>
  )
}
