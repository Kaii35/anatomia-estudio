import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import type { ChoiceQ, IdentifyQ, LabelQ, ListQ, MultiQ, WriteQ } from '../types'
import type { SessionItem } from '../lib/session'
import { cn, findMatch, matchAnswer } from '../lib/text'
import { models } from '../data/models'
import { partAccept, partBone, partName } from '../data/parts'
import { ModelViewer, type Mark } from '../three/ModelViewer'

interface BodyProps<Q> {
  q: Q
  order: number[]
  answered: boolean
  /** Puntuación de 0 a 1. Solo se llama una vez por pregunta. */
  onAnswer: (score: number) => void
}

type OptionState = 'idle' | 'picked' | 'ok' | 'bad' | 'missed'

const OPTION_STYLE: Record<OptionState, string> = {
  idle: 'border-line bg-surface-2 hover:border-accent/70',
  picked: 'border-accent bg-accent/10',
  ok: 'border-ok bg-ok/12',
  bad: 'border-bad bg-bad/12',
  missed: 'border-ok border-dashed bg-transparent',
}

function Option({ n, label, state, disabled, onClick }: { n: number; label: string; state: OptionState; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition outline-none focus-visible:ring-2 focus-visible:ring-accent',
        !disabled && 'cursor-pointer active:scale-[0.99]',
        OPTION_STYLE[state],
        disabled && state === 'idle' && 'opacity-55 hover:border-line',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
          state === 'ok' || state === 'missed' ? 'bg-ok text-bg' : state === 'bad' ? 'bg-bad text-bg' : state === 'picked' ? 'bg-accent text-accent-ink' : 'bg-line text-muted',
        )}
      >
        {state === 'ok' || state === 'missed' ? <Check size={15} /> : state === 'bad' ? <X size={15} /> : n}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  )
}

/** Llama a `press(n)` al pulsar las teclas 1–9, salvo si se está escribiendo en un campo. */
function useNumberKeys(active: boolean, press: (n: number) => void) {
  const ref = useRef(press)
  ref.current = press
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 9 && !(e.target instanceof HTMLInputElement)) ref.current(n)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active])
}

export function ChoiceBody({ q, order, answered, onAnswer }: BodyProps<ChoiceQ>) {
  const [picked, setPicked] = useState<number | null>(null)
  const choose = (i: number) => {
    if (answered) return
    setPicked(i)
    onAnswer(i === q.answer ? 1 : 0)
  }
  useNumberKeys(!answered, (n) => n <= order.length && choose(order[n - 1]))

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {order.map((i, pos) => (
        <Option
          key={i}
          n={pos + 1}
          label={q.options[i]}
          disabled={answered}
          state={!answered ? 'idle' : i === q.answer ? 'ok' : i === picked ? 'bad' : 'idle'}
          onClick={() => choose(i)}
        />
      ))}
    </div>
  )
}

/** Puntuación parcial: aciertos menos errores, y solo vale 1 si la selección es exacta. */
function setScore(picked: Iterable<unknown>, correct: Set<unknown>): number {
  let hits = 0
  let wrong = 0
  for (const p of picked) correct.has(p) ? hits++ : wrong++
  if (hits === correct.size && wrong === 0) return 1
  return Math.min(0.9, Math.max(0, (hits - wrong) / correct.size))
}

export function MultiBody({ q, order, answered, onAnswer }: BodyProps<MultiQ>) {
  const [picked, setPicked] = useState<number[]>([])
  const correct = useMemo(() => new Set(q.answers), [q])
  const toggle = (i: number) => {
    if (!answered) setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
  }
  useNumberKeys(!answered, (n) => n <= order.length && toggle(order[n - 1]))

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Puede haber varias respuestas correctas.</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {order.map((i, pos) => {
          const isPicked = picked.includes(i)
          const state: OptionState = !answered
            ? isPicked ? 'picked' : 'idle'
            : correct.has(i) ? (isPicked ? 'ok' : 'missed') : isPicked ? 'bad' : 'idle'
          return <Option key={i} n={pos + 1} label={q.options[i]} disabled={answered} state={state} onClick={() => toggle(i)} />
        })}
      </div>
      {!answered && (
        <button type="button" className="btn-primary" disabled={!picked.length} onClick={() => onAnswer(setScore(picked, correct))}>
          Comprobar
        </button>
      )}
    </div>
  )
}

export function WriteBody({ q, answered, onAnswer }: BodyProps<WriteQ>) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<ReturnType<typeof matchAnswer>>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (answered || !value.trim()) return
    const m = matchAnswer(value, q.accept)
    setResult(m)
    onAnswer(m ? 1 : 0)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={answered}
          placeholder="Escribe tu respuesta…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Tu respuesta"
          className={cn('field', answered && (result ? 'border-ok!' : 'border-bad!'))}
        />
        {!answered && (
          <button type="submit" className="btn-primary shrink-0" disabled={!value.trim()}>
            Comprobar
          </button>
        )}
      </div>
      {!answered && <p className="text-xs text-muted">No importan las mayúsculas ni las tildes.</p>}
      {answered && result !== 'exact' && (
        <p className="text-sm">
          <span className="text-muted">{result ? 'Se escribe: ' : 'Respuesta correcta: '}</span>
          <strong className="text-ok">{q.accept[0]}</strong>
        </p>
      )}
    </form>
  )
}

export function ListBody({ q, answered, onAnswer }: BodyProps<ListQ>) {
  const [found, setFound] = useState<Set<number>>(new Set())
  const [value, setValue] = useState('')
  const [note, setNote] = useState<{ text: string; n: number } | null>(null)
  const groups = useMemo(() => q.items.map((i) => [i.label, ...(i.accept ?? [])]), [q])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (answered || !value.trim()) return
    const i = findMatch(value, groups, found)
    if (i >= 0) {
      const next = new Set(found).add(i)
      setFound(next)
      setValue('')
      setNote(null)
      if (next.size === q.items.length) onAnswer(1)
    } else {
      const repeated = findMatch(value, groups, new Set()) >= 0
      setNote({ text: repeated ? 'Esa ya la tienes.' : 'Esa no está en la lista.', n: (note?.n ?? 0) + 1 })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {q.items.map((item, i) => {
          const got = found.has(i)
          return (
            <div
              key={item.label}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
                got ? 'border-ok bg-ok/12 text-ink' : answered ? 'border-bad bg-bad/10 text-ink' : 'border-dashed border-line text-muted',
              )}
            >
              {got ? <Check size={15} className="shrink-0 text-ok" /> : answered ? <X size={15} className="shrink-0 text-bad" /> : null}
              {got || answered ? item.label : `${i + 1}. ?`}
            </div>
          )
        })}
      </div>
      {!answered && (
        <>
          <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
            <input
              autoFocus
              key={note?.n}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Escribe una y pulsa Enter…"
              autoComplete="off"
              spellCheck={false}
              aria-label="Tu respuesta"
              className={cn('field', note && 'shake')}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={!value.trim()}>
              Añadir
            </button>
          </form>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted" aria-live="polite">
              {note?.text ?? `Llevas ${found.size} de ${q.items.length}. El orden no importa.`}
            </p>
            <button type="button" className="btn-ghost shrink-0" onClick={() => onAnswer(Math.min(0.9, found.size / q.items.length))}>
              No recuerdo más
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function IdentifyBody({ q, answered, onAnswer }: BodyProps<IdentifyQ>) {
  const [selected, setSelected] = useState<string[]>([])
  const model = models[q.model]
  const targets = useMemo(() => new Set(q.targets), [q])

  const pick = (picked: string) => {
    if (answered) return
    // Si se pide un hueso entero y el modelo lo trae por zonas, tocar cualquiera de ellas cuenta como el hueso.
    const owner = partBone(picked)
    const id = !targets.has(picked) && owner && targets.has(owner) ? owner : picked
    setSelected((s) => (!q.all ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }
  const check = () => onAnswer(q.all ? setScore(selected, targets) : targets.has(selected[0]) ? 1 : 0)

  const marks = useMemo(() => {
    if (!answered) return undefined
    const m: Record<string, Mark> = {}
    for (const s of selected) m[s] = 'bad'
    for (const t of q.targets) m[t] = 'ok'
    return m
  }, [answered, selected, q])
  const wrong = selected.filter((s) => !targets.has(s))

  return (
    <div className="space-y-4">
      <ModelViewer model={model} selected={selected} marks={marks} labels={answered} onPick={answered ? undefined : pick} className="h-[340px] sm:h-[380px] md:h-[440px]" />
      {!answered ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {q.all ? `Haz clic en cada parte para marcarla · ${selected.length} seleccionada${selected.length === 1 ? '' : 's'}` : 'Haz clic sobre la parte en el modelo.'}
          </p>
          <button type="button" className="btn-primary shrink-0" disabled={!selected.length} onClick={check}>
            Comprobar
          </button>
        </div>
      ) : (
        wrong.length > 0 && (
          <p className="text-sm text-muted">
            Marcaste por error: <strong className="text-bad">{wrong.map((w) => partName(w, model)).join(', ')}</strong>. En verde, lo correcto.
          </p>
        )
      )}
    </div>
  )
}

export function LabelBody({ q, answered, onAnswer }: BodyProps<LabelQ>) {
  const model = models[q.model]
  const [values, setValues] = useState<Record<string, string>>({})
  const [active, setActive] = useState<string | null>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const isRight = (part: string) => !!matchAnswer(values[part] ?? '', partAccept(part, model))
  const filled = q.parts.filter((p) => values[p]?.trim()).length
  const check = () => {
    const right = q.parts.filter(isRight).length
    onAnswer(right === q.parts.length ? 1 : Math.min(0.9, right / q.parts.length))
  }
  /** Enter salta al siguiente recuadro vacío; con todos rellenos, comprueba. */
  const advance = (from: string) => {
    const empty = Object.entries(inputs.current).find(([part, el]) => part !== from && el && !el.value.trim())
    if (empty) empty[1]!.focus()
    else check()
  }

  const marks = useMemo(() => {
    if (answered) return Object.fromEntries(q.parts.map((p) => [p, (isRight(p) ? 'ok' : 'bad') as Mark]))
    return active ? { [active]: 'hint' as Mark } : undefined
  }, [answered, active, q]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <ModelViewer
        model={model}
        only={q.only}
        half={q.half}
        view={q.view}
        fitParts={q.zoom ? q.parts : undefined}
        marks={marks}
        labels={answered}
        callouts={q.parts}
        activeCallout={active}
        className="h-[340px] sm:h-[460px] md:h-[540px]"
        renderCallout={(part) => {
          const right = answered && isRight(part)
          return (
            <>
              <input
                ref={(el) => void (inputs.current[part] = el)}
                value={values[part] ?? ''}
                readOnly={answered}
                onChange={(e) => setValues((v) => ({ ...v, [part]: e.target.value }))}
                onFocus={() => setActive(part)}
                onBlur={() => setActive((a) => (a === part ? null : a))}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || answered) return
                  e.preventDefault()
                  advance(part)
                }}
                placeholder="Nombre…"
                autoComplete="off"
                spellCheck={false}
                aria-label="Nombre de la parte señalada"
                className={cn(
                  'w-full rounded-lg border bg-black/55 px-2.5 py-2.5 text-base text-white outline-none placeholder:text-white/35 sm:py-2 sm:text-sm',
                  !answered ? 'border-white/25 focus:border-[#ffc35c]' : right ? 'border-[#3ecf9e]' : 'border-[#f2708a]',
                )}
              />
              {answered && !right && <p className="mt-1 px-1 text-xs font-semibold text-[#3ecf9e]">{partName(part, model)}</p>}
            </>
          )
        }}
      />
      {!answered && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="hidden sm:inline">Escribe el nombre en cada recuadro; al situarte en uno se ilumina su parte. Puedes rotar el modelo. · </span>
            <span className="sm:hidden">Cada número del modelo es un recuadro. · </span>
            {filled} de {q.parts.length}
          </p>
          <button type="button" className="btn-primary shrink-0" disabled={!filled} onClick={check}>
            Comprobar
          </button>
        </div>
      )}
    </div>
  )
}

export function QuestionBody({ item, answered, onAnswer }: { item: SessionItem; answered: boolean; onAnswer: (score: number) => void }) {
  const { q, order } = item
  const props = { order, answered, onAnswer }
  const marks = useMemo(() => (q.visual ? Object.fromEntries(q.visual.highlight.map((h) => [h, 'hint' as Mark])) : undefined), [q])

  return (
    <div className="space-y-5">
      {q.image && <img src={q.image} alt="" className="max-h-80 w-full rounded-2xl border border-line object-contain" />}
      {q.visual && q.type !== 'identify' && (
        <ModelViewer model={q.visual.model} marks={marks} focus focusPart={q.visual.highlight[0]} labels={answered} className="h-[300px] sm:h-[320px] md:h-[380px]" />
      )}
      {q.type === 'choice' && <ChoiceBody q={q} {...props} />}
      {q.type === 'multi' && <MultiBody q={q} {...props} />}
      {q.type === 'write' && <WriteBody q={q} {...props} />}
      {q.type === 'list' && <ListBody q={q} {...props} />}
      {q.type === 'identify' && <IdentifyBody q={q} {...props} />}
      {q.type === 'label' && <LabelBody q={q} {...props} />}
    </div>
  )
}
