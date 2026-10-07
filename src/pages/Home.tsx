import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Flame, RotateCcw, Shuffle, Target } from 'lucide-react'
import { motion } from 'motion/react'
import { regions } from '../data/regions'
import { bones } from '../data/bones'
import { questions, questionsByRegion } from '../data/questions'
import { dayStreak, mastery } from '../lib/session'
import { useProgress } from '../store/progress'
import { ProgressBar, Ring } from '../components/Layout'

export function Home() {
  const stats = useProgress((s) => s.stats)
  const days = useProgress((s) => s.days)
  const streak = dayStreak(days)
  const answered = Object.values(stats)
  const pending = answered.filter((s) => !s.lastOk).length
  const accuracy = answered.reduce((a, s) => a + s.ok, 0) / Math.max(1, answered.reduce((a, s) => a + s.seen, 0))

  return (
    <div className="space-y-10">
      <section className="card grid gap-8 p-6 sm:p-9 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">Osteología forense</p>
          <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            Aprende cada hueso, de la glabela al calcáneo.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Estudia las fichas con sus accidentes óseos y notas forenses, y después ponte a prueba señalando en el modelo 3D, escribiendo y
            eligiendo respuestas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/practica" className="btn-primary">
              <Shuffle size={16} /> Práctica mixta
            </Link>
            {pending > 0 && (
              <Link to="/practica?modo=errores" className="btn-soft">
                <RotateCcw size={16} /> Repasar {pending} fallo{pending === 1 ? '' : 's'}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 md:flex-col md:items-end">
          <Ring value={mastery(questions, stats)} label="dominado" />
          <div className="flex gap-2 md:justify-end">
            <span className="chip">
              <Flame size={14} className="text-accent" /> {streak === 1 ? '1 día seguido' : `${streak} días seguidos`}
            </span>
            {answered.length > 0 && (
              <span className="chip">
                <Target size={14} className="text-ok" /> {Math.round(accuracy * 100)}% de acierto
              </span>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Regiones</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((r, i) => {
            const qs = questionsByRegion(r.id)
            const m = mastery(qs, stats)
            const count = bones.filter((b) => b.region === r.id).length
            return (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card group relative flex flex-col overflow-hidden p-5 transition hover:border-(--c)"
                style={{ '--c': r.color } as CSSProperties}
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-(--c)" />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold">{r.name}</h3>
                  <span className="text-sm font-semibold text-(--c)">{Math.round(m * 100)}%</span>
                </div>
                <p className="mt-1.5 flex-1 text-sm text-muted">{r.description}</p>
                <p className="mt-4 text-xs text-muted">
                  {count} {r.id === 'general' ? 'temas' : 'huesos'} · {qs.length} preguntas
                </p>
                <ProgressBar value={m} color={r.color} className="mt-2" />
                <div className="mt-4 flex gap-2">
                  <Link to={`/region/${r.id}`} className="btn-soft flex-1">
                    <BookOpen size={15} /> Estudiar
                  </Link>
                  <Link to={`/practica?region=${r.id}`} className="btn-soft flex-1">
                    Practicar <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
