import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, CircleAlert, Play, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Question, RegionId } from '../types'
import { regions, regionById } from '../data/regions'
import { questions } from '../data/questions'
import { answerText, bucketOf, buildSession, BUCKETS, type Bucket, type SessionItem } from '../lib/session'
import { cn } from '../lib/text'
import { useProgress } from '../store/progress'
import { ProgressBar, Ring } from '../components/Layout'
import { QuestionBody } from '../components/QuestionBody'

const TYPE_LABEL: Record<Question['type'], string> = {
  choice: 'Selección múltiple',
  multi: 'Varias correctas',
  write: 'Respuesta escrita',
  list: 'Enumera',
  identify: 'Señala en el modelo',
}

function Toggle({ active, onClick, children, color }: { active: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={active && color ? { borderColor: color } : undefined}
      className={cn(
        'cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition',
        active ? 'border-accent bg-surface-2 text-ink' : 'border-line text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function Setup({ onStart }: { onStart: (items: SessionItem[], regionIds: RegionId[]) => void }) {
  const [params] = useSearchParams()
  const stats = useProgress((s) => s.stats)
  const preset = params.get('region') as RegionId | null
  const [picked, setPicked] = useState<RegionId[]>(preset && regionById[preset] ? [preset] : regions.map((r) => r.id))
  const [buckets, setBuckets] = useState<Bucket[]>(BUCKETS.map((b) => b.id))
  const [count, setCount] = useState(10)
  const [onlyErrors, setOnlyErrors] = useState(params.get('modo') === 'errores')

  const pool = useMemo(
    () =>
      questions.filter(
        (q) => picked.includes(q.region) && buckets.includes(bucketOf(q)) && (!onlyErrors || (stats[q.id] && !stats[q.id].lastOk)),
      ),
    [picked, buckets, onlyErrors, stats],
  )
  const flip = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const allRegions = picked.length === regions.length

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Practicar</h1>
      <p className="mt-1 text-muted">Elige qué quieres repasar. Las preguntas que fallas vuelven a salir más a menudo.</p>

      <div className="card mt-7 space-y-7 p-6 sm:p-7">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Regiones</h2>
            <button type="button" className="cursor-pointer text-sm font-medium text-accent" onClick={() => setPicked(allRegions ? [] : regions.map((r) => r.id))}>
              {allRegions ? 'Quitar todas' : 'Todas'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {regions.map((r) => (
              <Toggle key={r.id} active={picked.includes(r.id)} color={r.color} onClick={() => setPicked(flip(picked, r.id))}>
                {r.name}
              </Toggle>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Tipo de pregunta</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {BUCKETS.map((b) => (
              <Toggle key={b.id} active={buckets.includes(b.id)} onClick={() => setBuckets(flip(buckets, b.id))}>
                <span className="block text-left">
                  {b.label}
                  <span className="block text-xs font-normal text-muted">{b.hint}</span>
                </span>
              </Toggle>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Número de preguntas</h2>
            <div className="mt-3 flex gap-2">
              {[5, 10, 20, 30].map((n) => (
                <Toggle key={n} active={count === n} onClick={() => setCount(n)}>
                  {n}
                </Toggle>
              ))}
            </div>
          </div>
          <Toggle active={onlyErrors} onClick={() => setOnlyErrors(!onlyErrors)}>
            <span className="flex items-center gap-2">
              <RotateCcw size={15} /> Solo las que fallé
            </span>
          </Toggle>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-sm text-muted">
            {pool.length
              ? `${pool.length} preguntas disponibles con estos filtros.`
              : onlyErrors
                ? 'No tienes fallos pendientes con estos filtros. ¡Bien!'
                : 'Elige al menos una región y un tipo de pregunta.'}
          </p>
          <button type="button" className="btn-primary px-6 py-3 text-base" disabled={!pool.length} onClick={() => onStart(buildSession(pool, stats, count), picked)}>
            <Play size={17} /> Empezar
          </button>
        </div>
      </div>
    </div>
  )
}

function Runner({ items, onDone, onExit }: { items: SessionItem[]; onDone: (scores: number[]) => void; onExit: () => void }) {
  const record = useProgress((s) => s.record)
  const [scores, setScores] = useState<number[]>([])
  const [i, setI] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const item = items[i]
  const answered = scores.length > i
  const score = scores[i]
  const region = regionById[item.q.region]

  // Al responder, el foco pasa a «Siguiente» para poder avanzar con Enter.
  useEffect(() => {
    if (answered) nextRef.current?.focus()
  }, [answered])

  const answer = (s: number) => {
    if (answered) return
    record(item.q.id, s)
    setScores((v) => [...v, s])
  }
  const next = () => (i + 1 < items.length ? setI(i + 1) : onDone(scores))

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4">
        <ProgressBar value={(i + (answered ? 1 : 0)) / items.length} className="flex-1" />
        <span className="text-sm font-medium text-muted tabular-nums">
          {i + 1} / {items.length}
        </span>
        <button type="button" className="btn-ghost px-2 py-1.5" onClick={onExit} title="Salir de la práctica" aria-label="Salir de la práctica">
          <X size={18} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          className="card mt-5 p-5 sm:p-7"
        >
          <div className="flex flex-wrap gap-2">
            <span className="chip" style={{ color: region.color, borderColor: region.color }}>
              {region.name}
            </span>
            <span className="chip">{TYPE_LABEL[item.q.type]}</span>
          </div>
          <h2 className="mt-4 mb-6 font-display text-2xl leading-snug font-semibold text-balance sm:text-[1.7rem]">{item.q.prompt}</h2>

          <QuestionBody item={item} answered={answered} onAnswer={answer} />

          {answered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-6 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center',
                score >= 0.999 ? 'border-ok/50 bg-ok/10' : score > 0 ? 'border-accent/50 bg-accent/10' : 'border-bad/50 bg-bad/10',
              )}
            >
              <div className="flex flex-1 gap-3">
                {score >= 0.999 ? (
                  <Check className="mt-0.5 shrink-0 text-ok" size={20} />
                ) : score > 0 ? (
                  <CircleAlert className="mt-0.5 shrink-0 text-accent" size={20} />
                ) : (
                  <X className="mt-0.5 shrink-0 text-bad" size={20} />
                )}
                <div>
                  <p className="font-semibold">{score >= 0.999 ? '¡Correcto!' : score > 0 ? 'Casi: te faltó algo' : 'Incorrecto'}</p>
                  {item.q.explanation && <p className="mt-1 text-sm leading-relaxed text-muted">{item.q.explanation}</p>}
                </div>
              </div>
              <button ref={nextRef} type="button" className="btn-primary shrink-0" onClick={next}>
                {i + 1 < items.length ? 'Siguiente' : 'Ver resultado'} <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Results({ items, scores, onRetry, onNew }: { items: SessionItem[]; scores: number[]; onRetry: (failed: SessionItem[]) => void; onNew: () => void }) {
  const total = scores.reduce((a, b) => a + b, 0)
  const ratio = total / items.length
  const failed = items.filter((_, i) => scores[i] < 0.999)
  const title = ratio >= 0.9 ? '¡Excelente!' : ratio >= 0.7 ? '¡Muy bien!' : ratio >= 0.5 ? 'Vas por buen camino' : 'Toca repasar un poco más'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:text-left">
        <Ring value={ratio} label={`${items.length - failed.length} de ${items.length}`} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          <p className="mt-1 text-muted">
            {failed.length ? `Fallaste ${failed.length} pregunta${failed.length === 1 ? '' : 's'}. Repetirlas ahora es la mejor forma de fijarlas.` : 'No fallaste ninguna pregunta.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
            {failed.length > 0 && (
              <button type="button" className="btn-primary" onClick={() => onRetry(failed)}>
                <RotateCcw size={16} /> Repetir los fallos
              </button>
            )}
            <button type="button" className={failed.length ? 'btn-soft' : 'btn-primary'} onClick={onNew}>
              Nueva práctica
            </button>
            <Link to="/" className="btn-ghost">
              Inicio
            </Link>
          </div>
        </div>
      </div>

      <h2 className="mt-9 text-xs font-semibold tracking-wider text-muted uppercase">Repaso</h2>
      <ul className="mt-3 space-y-2">
        {items.map(({ q }, i) => (
          <li key={q.id} className="card flex gap-3 p-4">
            {scores[i] >= 0.999 ? <Check size={18} className="mt-0.5 shrink-0 text-ok" /> : <X size={18} className="mt-0.5 shrink-0 text-bad" />}
            <div className="min-w-0">
              <p className="text-[15px] font-medium">{q.prompt}</p>
              <p className="mt-0.5 text-sm text-muted">{answerText(q)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

type Phase = { k: 'setup' } | { k: 'run'; items: SessionItem[]; regionIds: RegionId[]; run: number } | { k: 'done'; items: SessionItem[]; scores: number[]; regionIds: RegionId[] }

export function Practice() {
  const logSession = useProgress((s) => s.logSession)
  const [phase, setPhase] = useState<Phase>({ k: 'setup' })

  if (phase.k === 'setup') return <Setup onStart={(items, regionIds) => setPhase({ k: 'run', items, regionIds, run: Date.now() })} />

  if (phase.k === 'run') {
    const { items, regionIds } = phase
    return (
      <Runner
        key={phase.run}
        items={items}
        onExit={() => setPhase({ k: 'setup' })}
        onDone={(scores) => {
          logSession({ at: Date.now(), regions: regionIds, score: scores.reduce((a, b) => a + b, 0), total: items.length })
          setPhase({ k: 'done', items, scores, regionIds })
        }}
      />
    )
  }

  return (
    <Results
      items={phase.items}
      scores={phase.scores}
      onNew={() => setPhase({ k: 'setup' })}
      onRetry={(failed) => setPhase({ k: 'run', items: failed, regionIds: phase.regionIds, run: Date.now() })}
    />
  )
}
