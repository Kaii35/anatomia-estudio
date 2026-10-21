import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Crown, ExternalLink, Lightbulb, Plus, Play, Presentation, RotateCcw, Sparkles, Timer, Trophy, Undo2, Users, Wind, X, Zap } from 'lucide-react'
import { items, paradas, type CasoItem, type EmparejarItem, type Item, type MimicaItem, type OpcionItem, type OrdenarItem, type ParadaId } from '../data/respiratorio'
import { cn, shuffle } from '../lib/text'
import { ProgressBar } from '../components/Layout'

/** Puntos por tipo de pregunta. En el caso, cuantas menos pistas se vean, más puntos. */
const PUNTOS = { opcion: 10, robo: 5, ordenar: 15, emparejar: 5, caso: [30, 20, 10], mimica: 15 }
const COLORES = ['#5ecbb4', '#f0a756', '#b79cf0', '#ef8478', '#78a9f5', '#93c96f']
const TITULOS = ['Maestros del alvéolo', 'Expertos en bronquios', 'Guardianes de la tráquea']
const TIEMPOS = [
  { valor: 0, label: 'Sin límite' },
  { valor: 30, label: '30 s' },
  { valor: 60, label: '60 s' },
]
const TIPO: Record<Item['tipo'], string> = {
  opcion: 'Selección',
  ordenar: 'Ordenar',
  emparejar: 'Emparejar',
  caso: 'Caso forense',
  mimica: 'Mímica',
}
const MAX_EQUIPOS = 6

type Fase = 'inicio' | 'pausa' | 'juego' | 'final'
interface Reparto {
  equipo: number
  puntos: number
}
export interface VistaProps<T extends Item> {
  item: T
  equipos: string[]
  activo: number
  segundos: number
  onFin: (reparto: Reparto[]) => void
}

const botonBase = 'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition disabled:cursor-default'
const botonOpcion = `${botonBase} w-full`

/** Reordena al azar, procurando que el resultado no quede igual al original. */
function barajar<T>(arr: T[], distinto: (out: T[]) => boolean): T[] {
  let out = shuffle(arr)
  for (let i = 0; i < 10 && !distinto(out); i++) out = shuffle(arr)
  return out
}

/** Cuenta atrás en segundos. Llama a `onCero` una sola vez al llegar a cero, mientras `activo` sea true. */
function useCuenta(total: number, activo: boolean, onCero: () => void): number {
  const [restante, setRestante] = useState(total)
  const cero = useRef(onCero)
  useEffect(() => {
    cero.current = onCero
  })
  useEffect(() => {
    if (!total || !activo) return
    if (restante <= 0) {
      cero.current()
      return
    }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [restante, activo, total])
  return restante
}

/** Envoltorio de cada pregunta: muestra el cronómetro si la partida tiene límite de tiempo. */
function Cuadro({ segundos, activo, onCero, children }: { segundos: number; activo: boolean; onCero: () => void; children: ReactNode }) {
  const restante = useCuenta(segundos, activo, onCero)
  return (
    <div>
      {segundos > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <Timer size={16} className={cn('shrink-0', restante <= 5 ? 'text-bad' : 'text-muted')} />
          <ProgressBar value={restante / segundos} color={restante <= 5 ? 'var(--bad)' : undefined} className="flex-1" />
          <span className={cn('w-10 text-right text-sm font-semibold tabular-nums', restante <= 5 && 'text-bad')}>{Math.max(0, restante)} s</span>
        </div>
      )}
      {children}
    </div>
  )
}

function Enunciado({ children }: { children: ReactNode }) {
  return <h2 className="mb-6 font-display text-2xl leading-snug font-semibold text-balance sm:text-[1.7rem]">{children}</h2>
}

function Numero({ n }: { n: number }) {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line text-xs font-semibold text-muted tabular-nums">{n}</span>
}

/* ───────────── Selección (con robo) ───────────── */

export function Opcion({ item, equipos, activo, segundos, pista, onFin }: VistaProps<OpcionItem> & { pista: boolean }) {
  const [etapa, setEtapa] = useState<'principal' | 'robo' | 'fin'>('principal')
  const [ladron, setLadron] = useState<number | null>(null)
  const [elegida, setElegida] = useState<number | null>(null)
  const [robada, setRobada] = useState<number | null>(null)
  // Pista: oculta una opción incorrecta, elegida al azar al activarla.
  const oculta = useMemo(() => {
    if (!pista) return null
    const malas = item.opciones.map((_, i) => i).filter((i) => i !== item.respuesta)
    return malas[Math.floor(Math.random() * malas.length)]
  }, [pista, item])

  const fin = etapa === 'fin'
  const cerrar = (reparto: Reparto[]) => {
    setEtapa('fin')
    onFin(reparto)
  }

  const responder = (i: number) => {
    if (fin) return
    if (etapa === 'principal') {
      if (i === oculta) return
      setElegida(i)
      if (i === item.respuesta) return cerrar([{ equipo: activo, puntos: PUNTOS.opcion }])
      if (equipos.length < 2) return cerrar([])
      setEtapa('robo')
      return
    }
    if (ladron === null) return
    setRobada(i)
    cerrar(i === item.respuesta ? [{ equipo: ladron, puntos: PUNTOS.robo }] : [])
  }

  // Teclas 1 a 4 para responder desde el teclado (cómodo al proyectar).
  useEffect(() => {
    if (fin) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= item.opciones.length) responder(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const roboAbierto = etapa === 'robo' && ladron === null
  const estado = (i: number) => {
    if (fin && i === item.respuesta) return 'border-ok bg-ok/15 text-ink'
    if ((i === elegida || i === robada) && i !== item.respuesta) return 'border-bad bg-bad/15 text-ink'
    return 'border-line bg-surface-2 text-ink hover:border-accent/60'
  }

  return (
    <Cuadro segundos={segundos} activo={!fin && (etapa === 'principal' || ladron !== null)} onCero={() => cerrar([])}>
      <Enunciado>{item.prompt}</Enunciado>
      <div className={cn('grid gap-3', item.opciones.length > 2 && 'sm:grid-cols-2')}>
        {item.opciones.map((o, i) =>
          etapa === 'principal' && i === oculta ? null : (
            <button key={o} type="button" disabled={fin || roboAbierto} onClick={() => responder(i)} className={cn(botonOpcion, estado(i))}>
              <Numero n={i + 1} />
              {o}
            </button>
          ),
        )}
      </div>

      {etapa === 'robo' && (
        <div className="mt-6 rounded-xl border border-accent/50 bg-accent/10 p-4">
          {roboAbierto ? (
            <>
              <p className="font-semibold">¡Se abre el robo! ¿Otro equipo se atreve a responder por {PUNTOS.robo} puntos?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {equipos.map((nombre, j) =>
                  j === activo ? null : (
                    <button key={j} type="button" className="btn-soft" onClick={() => setLadron(j)}>
                      {nombre}
                    </button>
                  ),
                )}
                <button type="button" className="btn-ghost" onClick={() => cerrar([])}>
                  Nadie roba
                </button>
              </div>
            </>
          ) : (
            !fin && <p className="font-semibold">Responde {equipos[ladron ?? 0]}: si acierta, se lleva {PUNTOS.robo} puntos.</p>
          )}
        </div>
      )}
    </Cuadro>
  )
}

/* ───────────── Ordenar ───────────── */

export function Ordenar({ item, activo, segundos, onFin }: VistaProps<OrdenarItem>) {
  const [mezcla] = useState(() => barajar(item.pasos, (out) => out.some((v, i) => v !== item.pasos[i])))
  const [orden, setOrden] = useState<number[]>([])
  const [fin, setFin] = useState(false)
  const [acierto, setAcierto] = useState(false)

  const cerrar = (ok: boolean) => {
    setAcierto(ok)
    setFin(true)
    onFin(ok ? [{ equipo: activo, puntos: PUNTOS.ordenar }] : [])
  }
  const tocar = (i: number) => {
    if (fin) return
    setOrden((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))
  }
  const comprobar = () => cerrar(orden.every((idx, k) => mezcla[idx] === item.pasos[k]))

  return (
    <Cuadro segundos={segundos} activo={!fin} onCero={() => cerrar(false)}>
      <Enunciado>{item.prompt}</Enunciado>
      <p className="mb-3 text-sm text-muted">Toca los pasos en orden. Vuelve a tocar uno para quitarlo.</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {mezcla.map((paso, i) => {
          const pos = orden.indexOf(i)
          return (
            <button
              key={paso}
              type="button"
              disabled={fin}
              onClick={() => tocar(i)}
              className={cn(botonOpcion, 'relative', pos >= 0 ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-accent/60')}
            >
              {pos >= 0 && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-accent-ink">{pos + 1}</span>}
              {paso}
            </button>
          )
        })}
      </div>

      {!fin && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" disabled={!orden.length} onClick={() => setOrden((o) => o.slice(0, -1))}>
            <Undo2 size={16} /> Deshacer
          </button>
          <button type="button" className="btn-primary" disabled={orden.length !== item.pasos.length} onClick={comprobar}>
            <Check size={16} /> Comprobar orden
          </button>
        </div>
      )}

      {fin && (
        <div className={cn('mt-6 rounded-xl border p-4', acierto ? 'border-ok/50 bg-ok/10' : 'border-bad/50 bg-bad/10')}>
          <p className="font-semibold">{acierto ? '¡Orden perfecto!' : 'Este es el orden correcto:'}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px]">
            {item.pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
      )}
    </Cuadro>
  )
}

/* ───────────── Emparejar ───────────── */

export function Emparejar({ item, activo, segundos, onFin }: VistaProps<EmparejarItem>) {
  // Columna derecha barajada: guarda el índice del par al que pertenece cada tarjeta.
  const [derecha] = useState(() => barajar(item.pares.map((_, i) => i), (out) => out.some((v, i) => v !== i)))
  const [izq, setIzq] = useState<number | null>(null)
  const [unidos, setUnidos] = useState<number[]>([])
  const [error, setError] = useState<number | null>(null)
  const [fin, setFin] = useState(false)

  const cerrarCon = (n: number) => {
    setFin(true)
    onFin(n ? [{ equipo: activo, puntos: n * PUNTOS.emparejar }] : [])
  }
  const elegirDerecha = (j: number) => {
    if (fin || izq === null) return
    if (derecha[j] === izq) {
      const nuevos = [...unidos, izq]
      setUnidos(nuevos)
      setIzq(null)
      if (nuevos.length === item.pares.length) cerrarCon(nuevos.length)
      return
    }
    setError(j)
    setIzq(null)
    setTimeout(() => setError(null), 600)
  }

  return (
    <Cuadro segundos={segundos} activo={!fin} onCero={() => cerrarCon(unidos.length)}>
      <Enunciado>{item.prompt}</Enunciado>
      <div className="grid gap-3 md:grid-cols-2 md:gap-x-8">
        <div className="space-y-2.5">
          {item.pares.map(([concepto], i) => (
            <button
              key={concepto}
              type="button"
              disabled={fin || unidos.includes(i)}
              onClick={() => setIzq(i)}
              className={cn(
                botonOpcion,
                unidos.includes(i) ? 'border-ok bg-ok/15' : izq === i ? 'border-accent bg-accent/15' : 'border-line bg-surface-2 hover:border-accent/60',
              )}
            >
              {concepto}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          {derecha.map((par, j) => (
            <button
              key={item.pares[par][1]}
              type="button"
              disabled={fin || unidos.includes(par)}
              onClick={() => elegirDerecha(j)}
              className={cn(botonOpcion, 'border-line bg-surface-2 hover:border-accent/60', unidos.includes(par) && 'border-ok bg-ok/15', error === j && 'shake border-bad bg-bad/15')}
            >
              {item.pares[par][1]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {izq === null ? 'Elige un concepto de la izquierda y luego su definición.' : 'Ahora elige su definición de la derecha.'}
          <span className="ml-2 font-semibold text-ink tabular-nums">
            {unidos.length} / {item.pares.length}
          </span>
        </p>
        {!fin && (
          <button type="button" className="btn-soft" onClick={() => cerrarCon(unidos.length)}>
            Terminar con lo que hay
          </button>
        )}
      </div>
    </Cuadro>
  )
}

/* ───────────── Caso (pistas progresivas) ───────────── */

export function Caso({ item, activo, onFin }: VistaProps<CasoItem>) {
  const [visibles, setVisibles] = useState(1)
  const [adivinando, setAdivinando] = useState(false)
  const [falladas, setFalladas] = useState<number[]>([])
  const [fin, setFin] = useState(false)

  const hayMas = visibles < item.pistas.length
  const cerrar = (reparto: Reparto[]) => {
    setFin(true)
    onFin(reparto)
  }
  const elegir = (i: number) => {
    if (fin) return
    if (i === item.respuesta) return cerrar([{ equipo: activo, puntos: PUNTOS.caso[visibles - 1] }])
    setAdivinando(false)
    setFalladas((f) => [...f, i])
    if (!hayMas) cerrar([])
  }

  return (
    <div>
      <p className="mb-2 font-display text-xl font-semibold text-accent">{item.titulo}</p>
      <Enunciado>{item.prompt}</Enunciado>

      <div className="space-y-2.5">
        {item.pistas.map((pista, i) =>
          i < visibles || fin ? (
            <motion.div key={pista} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-xl border border-line bg-surface-2 p-4">
              <span className="font-display text-xl font-semibold text-accent">{i + 1}</span>
              <p className="text-[15px] leading-relaxed">{pista}</p>
            </motion.div>
          ) : (
            <div key={i} className="flex gap-3 rounded-xl border border-dashed border-line p-4 text-muted">
              <span className="font-display text-xl font-semibold">{i + 1}</span>
              <p className="text-[15px]">Pista bloqueada</p>
            </div>
          ),
        )}
      </div>

      {!fin && (
        <>
          <p className="mt-4 text-sm text-muted">
            Si aciertas ahora: <strong className="text-ink">{PUNTOS.caso[visibles - 1]} puntos</strong>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {hayMas && (
              <button
                type="button"
                className="btn-soft"
                onClick={() => {
                  setVisibles((v) => v + 1)
                  setAdivinando(false)
                }}
              >
                Siguiente pista
              </button>
            )}
            {!adivinando && (
              <button type="button" className="btn-primary" onClick={() => setAdivinando(true)}>
                ¿Lo tienen? Adivinar
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={() => cerrar([])}>
              Revelar y pasar
            </button>
          </div>
          {adivinando && (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {item.opciones.map((o, i) => (
                <button key={o} type="button" disabled={falladas.includes(i)} onClick={() => elegir(i)} className={cn(botonOpcion, 'border-line bg-surface-2 hover:border-accent/60')}>
                  <Numero n={i + 1} />
                  {o}
                </button>
              ))}
            </div>
          )}
          {falladas.length > 0 && <p className="mt-4 text-sm text-bad">Descartada: {falladas.map((i) => item.opciones[i]).join(' · ')}</p>}
        </>
      )}

      {fin && (
        <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4">
          <p className="font-semibold">Respuesta: {item.opciones[item.respuesta]}</p>
        </div>
      )}
    </div>
  )
}

/* ───────────── Mímica ───────────── */

export function Mimica({ item, equipos, activo, segundos, onFin }: VistaProps<MimicaItem>) {
  const [fin, setFin] = useState(false)
  const cerrar = (reparto: Reparto[]) => {
    setFin(true)
    onFin(reparto)
  }

  return (
    <Cuadro segundos={segundos || 60} activo={!fin} onCero={() => cerrar([])}>
      <div className="flex flex-col items-center rounded-2xl bg-surface-2 px-6 py-10 text-center">
        <Sparkles size={34} className="text-accent" />
        <p className="mt-4 font-display text-3xl leading-snug font-semibold text-balance sm:text-4xl">{item.prompt}</p>
        <p className="mt-4 text-sm text-muted">Mima sin hablar. El resto del grupo adivina.</p>
      </div>

      {!fin && (
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {equipos.map((nombre, j) =>
            j === activo ? null : (
              <button key={j} type="button" className="btn-soft" onClick={() => cerrar([{ equipo: j, puntos: PUNTOS.mimica }])}>
                Lo adivinó {nombre} · +{PUNTOS.mimica}
              </button>
            ),
          )}
          <button type="button" className="btn-ghost" onClick={() => cerrar([])}>
            Nadie lo adivinó
          </button>
        </div>
      )}
    </Cuadro>
  )
}

/* ───────────── Pantallas: inicio, pausa, tablero, final ───────────── */

function Inicio({
  nombres,
  onNombres,
  rapida,
  onRapida,
  tiempo,
  onTiempo,
  proyector,
  onProyector,
  onEmpezar,
}: {
  nombres: string[]
  onNombres: (n: string[]) => void
  rapida: boolean
  onRapida: (v: boolean) => void
  tiempo: number
  onTiempo: (v: number) => void
  proyector: boolean
  onProyector: (v: boolean) => void
  onEmpezar: () => void
}) {
  const total = items.length
  const rapidas = items.filter((i) => i.rapida).length
  const listo = nombres.every((n) => n.trim())

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="card p-6 sm:p-9">
        <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-accent uppercase">
          <Wind size={16} /> Juego de la exposición · Sistema respiratorio
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">La ruta del aire</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Cuatro paradas, las mismas que en la exposición: anatomía, fisiología, lectura forense y el artículo de las diatomeas. Cada equipo tira por el
          camino respondiendo por turnos. Cada pregunta indica la lámina donde está el contenido, para repasarla antes de jugar.
        </p>
        <a href="docs/Sistema%20respiratorio.html" target="_blank" rel="noreferrer" className="btn-soft mt-6">
          <ExternalLink size={15} /> Abrir las diapositivas
        </a>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <section className="card space-y-7 p-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
                <Users size={15} /> Equipos
              </h2>
              <span className="text-xs text-muted tabular-nums">{nombres.length} / {MAX_EQUIPOS}</span>
            </div>
            <div className="mt-3 space-y-2">
              {nombres.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: COLORES[i] }} />
                  <input
                    className="field py-2.5"
                    value={n}
                    maxLength={22}
                    aria-label={`Nombre del equipo ${i + 1}`}
                    onChange={(e) => onNombres(nombres.map((x, k) => (k === i ? e.target.value : x)))}
                  />
                  {nombres.length > 2 && (
                    <button type="button" className="btn-ghost h-10 w-10 shrink-0 p-0" aria-label={`Quitar el equipo ${i + 1}`} onClick={() => onNombres(nombres.filter((_, k) => k !== i))}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {nombres.length < MAX_EQUIPOS && (
              <button type="button" className="btn-ghost mt-3" onClick={() => onNombres([...nombres, `Equipo ${nombres.length + 1}`])}>
                <Plus size={16} /> Añadir equipo
              </button>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Duración</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button type="button" className={cn(botonBase, 'flex-col items-start', !rapida ? 'border-accent bg-surface-2' : 'border-line')} onClick={() => onRapida(false)}>
                <span className="font-semibold">Completa</span>
                <span className="text-xs font-normal text-muted">{total} preguntas · unos 35 min</span>
              </button>
              <button type="button" className={cn(botonBase, 'flex-col items-start', rapida ? 'border-accent bg-surface-2' : 'border-line')} onClick={() => onRapida(true)}>
                <span className="font-semibold">Rápida</span>
                <span className="text-xs font-normal text-muted">{rapidas} preguntas · unos 12 min</span>
              </button>
            </div>
          </div>
        </section>

        <section className="card space-y-7 p-6">
          <div>
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Tiempo por pregunta</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIEMPOS.map((t) => (
                <button key={t.valor} type="button" aria-pressed={tiempo === t.valor} className={cn(botonBase, tiempo === t.valor ? 'border-accent bg-surface-2' : 'border-line')} onClick={() => onTiempo(t.valor)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Reglas</h2>
            <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed">
              <li>• Cada pregunta es de un equipo por turno. Si falla, otro equipo puede robar (+{PUNTOS.robo}).</li>
              <li>• Caso forense: las pistas salen una a una. Acertar con 1 pista vale {PUNTOS.caso[0]}, con 2 vale {PUNTOS.caso[1]} y con 3, {PUNTOS.caso[2]}.</li>
              <li>• Cada equipo tiene una vez el <strong>Doble</strong> (x2 en su turno) y una vez la <strong>Pista</strong> (quita una opción falsa).</li>
              <li>• Entre paradas se hace una pausa de respiración para que el público descanse.</li>
            </ul>
          </div>

          <button type="button" aria-pressed={proyector} className={cn(botonBase, proyector ? 'border-accent bg-surface-2' : 'border-line')} onClick={() => onProyector(!proyector)}>
            <Presentation size={16} /> Modo proyector {proyector ? 'activado' : ''}
          </button>
        </section>
      </div>

      <div className="flex justify-end">
        <button type="button" className="btn-primary px-6 py-3 text-base" disabled={!listo} onClick={onEmpezar}>
          <Play size={17} /> Empezar la ruta
        </button>
      </div>
    </div>
  )
}

function Pausa({ parada, onContinuar }: { parada: (typeof paradas)[number]; onContinuar: () => void }) {
  const [inspira, setInspira] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setInspira((v) => !v), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <p className="text-sm font-semibold tracking-wider text-accent uppercase">Parada {String(parada.id).padStart(2, '0')}</p>
      <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight">{parada.nombre}</h1>
      <p className="mt-2 text-muted">
        {parada.subtitulo} · Láminas {parada.laminas}
      </p>

      <div className="relative mt-10 flex h-64 w-64 items-center justify-center">
        <motion.span
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: parada.color, background: `${parada.color}22` }}
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={inspira ? 'in' : 'out'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-display text-3xl font-semibold"
          >
            {inspira ? 'Inspira…' : 'Espira…'}
          </motion.span>
        </AnimatePresence>
      </div>

      <p className="mt-8 max-w-md text-sm text-muted">Sigue el círculo: cuatro segundos para llenar los pulmones y cuatro para vaciarlos.</p>
      <button type="button" className="btn-primary mt-8 px-6 py-3 text-base" onClick={onContinuar}>
        Continuar la ruta <ArrowRight size={16} />
      </button>
    </div>
  )
}

function Tablero({ paradaActual, puntos, nombres, activo }: { paradaActual: ParadaId; puntos: number[]; nombres: string[]; activo: number }) {
  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <ol className="flex items-center">
        {paradas.map((p, k) => {
          const hecha = p.id < paradaActual
          const actual = p.id === paradaActual
          const marcada = hecha || actual
          return (
            <li key={p.id} className={cn('flex items-center', k < paradas.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 font-display text-lg font-semibold transition"
                  style={{ borderColor: p.color, background: marcada ? p.color : 'transparent', color: marcada ? '#111218' : p.color }}
                >
                  {hecha ? <Check size={18} /> : p.id}
                </span>
                <span className={cn('hidden text-xs font-medium whitespace-nowrap sm:block', actual ? 'text-ink' : 'text-muted')}>{p.nombre}</span>
              </div>
              {k < paradas.length - 1 && <span className={cn('mx-2 h-0.5 flex-1 rounded-full', hecha ? '' : 'bg-line')} style={hecha ? { background: p.color } : undefined} />}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        {nombres.map((n, i) => (
          <div
            key={i}
            className={cn('flex min-w-[9rem] flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2', i === activo ? 'border-accent bg-surface-2' : 'border-line')}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORES[i] }} />
              <span className="truncate text-sm font-medium">{n}</span>
              {i === activo && <span className="chip py-0 text-[10px]">Turno</span>}
            </div>
            <span className="font-display text-xl font-semibold tabular-nums">{puntos[i] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Final({ nombres, puntos, onRepetir, onNueva }: { nombres: string[]; puntos: number[]; onRepetir: () => void; onNueva: () => void }) {
  const orden = nombres
    .map((nombre, i) => ({ nombre, puntos: puntos[i] ?? 0, color: COLORES[i] }))
    .sort((a, b) => b.puntos - a.puntos)
  const maximo = Math.max(1, ...orden.map((e) => e.puntos))

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <Trophy size={44} className="mx-auto text-accent" />
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">¡Fin de la ruta!</h1>
        <p className="mt-2 text-muted">Así quedó la clasificación de los equipos.</p>
      </div>

      <ol className="space-y-3">
        {orden.map((e, k) => (
          <motion.li key={e.nombre + k} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.12 }} className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-2xl font-semibold" style={{ background: e.color, color: '#111218' }}>
              {k === 0 ? <Crown size={22} /> : k + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.nombre}</p>
              <p className="text-sm text-muted">{TITULOS[k] ?? 'Aprendices de la nariz'}</p>
              <ProgressBar value={e.puntos / maximo} color={e.color} className="mt-2" />
            </div>
            <span className="font-display text-3xl font-semibold tabular-nums">{e.puntos}</span>
          </motion.li>
        ))}
      </ol>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={onRepetir}>
          <RotateCcw size={16} /> Jugar otra vez
        </button>
        <button type="button" className="btn-soft" onClick={onNueva}>
          Cambiar equipos o duración
        </button>
        <Link to="/" className="btn-ghost">
          Inicio
        </Link>
      </div>
    </div>
  )
}

/* ───────────── Página ───────────── */

export function Respiratorio() {
  const [fase, setFase] = useState<Fase>('inicio')
  const [nombres, setNombres] = useState(['Equipo 1', 'Equipo 2'])
  const [rapida, setRapida] = useState(false)
  const [tiempo, setTiempo] = useState(30)
  const [proyector, setProyector] = useState(false)
  const [puntos, setPuntos] = useState<number[]>([])
  const [indice, setIndice] = useState(0)
  const [resuelto, setResuelto] = useState(false)
  const [ultimo, setUltimo] = useState<Reparto[]>([])
  const [usados, setUsados] = useState<string[]>([])
  const [doble, setDoble] = useState(false)
  const [pista, setPista] = useState(false)

  const lista = useMemo(() => (rapida ? items.filter((i) => i.rapida) : items), [rapida])
  const item = lista[indice]
  const activo = indice % nombres.length
  const paradaSiguiente = paradas.find((p) => p.id === item?.parada) ?? paradas[0]

  // En modo proyector la letra crece para que se lea desde el fondo del aula.
  useEffect(() => {
    document.documentElement.style.fontSize = proyector ? '20px' : ''
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [proyector])

  const empezar = () => {
    setPuntos(nombres.map(() => 0))
    setIndice(0)
    setResuelto(false)
    setUltimo([])
    setUsados([])
    setDoble(false)
    setPista(false)
    setFase('pausa')
  }

  const terminar = (reparto: Reparto[]) => {
    const conDoble = reparto.map((r) => (r.equipo === activo && doble ? { ...r, puntos: r.puntos * 2 } : r))
    setPuntos((p) => {
      const n = [...p]
      conDoble.forEach((r) => {
        n[r.equipo] += r.puntos
      })
      return n
    })
    setUltimo(conDoble)
    setResuelto(true)
  }

  const siguiente = () => {
    const n = indice + 1
    if (n >= lista.length) {
      setFase('final')
      return
    }
    const cambiaParada = lista[n].parada !== item.parada
    setIndice(n)
    setResuelto(false)
    setUltimo([])
    setDoble(false)
    setPista(false)
    setFase(cambiaParada ? 'pausa' : 'juego')
  }

  // Enter o → pasan a la siguiente pregunta cuando ya está resuelta (si el foco está en la página, no en un botón).
  useEffect(() => {
    if (fase !== 'juego' || !resuelto) return
    const onKey = (e: KeyboardEvent) => {
      const enBoton = (e.target as HTMLElement).tagName !== 'BODY'
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && !enBoton)) siguiente()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (fase === 'inicio') {
    return (
      <Inicio
        nombres={nombres}
        onNombres={setNombres}
        rapida={rapida}
        onRapida={setRapida}
        tiempo={tiempo}
        onTiempo={setTiempo}
        proyector={proyector}
        onProyector={setProyector}
        onEmpezar={empezar}
      />
    )
  }

  if (fase === 'final') {
    return <Final nombres={nombres} puntos={puntos} onRepetir={empezar} onNueva={() => setFase('inicio')} />
  }

  if (fase === 'pausa') {
    return <Pausa parada={paradaSiguiente} onContinuar={() => setFase('juego')} />
  }

  const parada = paradaSiguiente
  const usadoDoble = usados.includes(`${activo}:doble`)
  const usadoPista = usados.includes(`${activo}:pista`)
  const vista = { item, equipos: nombres, activo, segundos: tiempo, onFin: terminar }
  const comodin = (clave: string) => {
    setUsados((u) => [...u, clave])
  }

  let cuerpo: ReactNode
  switch (item.tipo) {
    case 'opcion':
      cuerpo = <Opcion key={indice} {...vista} item={item} pista={pista} />
      break
    case 'ordenar':
      cuerpo = <Ordenar key={indice} {...vista} item={item} />
      break
    case 'emparejar':
      cuerpo = <Emparejar key={indice} {...vista} item={item} />
      break
    case 'caso':
      cuerpo = <Caso key={indice} {...vista} item={item} />
      break
    case 'mimica':
      cuerpo = <Mimica key={indice} {...vista} item={item} />
      break
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="chip" style={{ color: parada.color, borderColor: parada.color }}>
          <Wind size={14} /> Parada {String(parada.id).padStart(2, '0')} · {parada.nombre}
        </span>
        <div className="flex items-center gap-2">
          <span className="chip tabular-nums">
            {indice + 1} / {lista.length}
          </span>
          <button type="button" className="btn-ghost" onClick={() => setFase('final')}>
            Terminar partida
          </button>
        </div>
      </div>

      <Tablero paradaActual={parada.id} puntos={puntos} nombres={nombres} activo={activo} />
      <ProgressBar value={(indice + (resuelto ? 1 : 0)) / lista.length} />

      <motion.section key={indice} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="card p-4 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="chip">
            <Presentation size={14} /> Lámina {String(item.lamina).padStart(2, '0')}
          </span>
          <span className="chip">{TIPO[item.tipo]}</span>
          <span className="chip text-ink">Turno: {nombres[activo]}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-soft py-1.5 text-xs"
              disabled={resuelto || usadoDoble || doble}
              title="Duplica los puntos de este turno (una vez por equipo)"
              onClick={() => {
                setDoble(true)
                comodin(`${activo}:doble`)
              }}
            >
              <Zap size={14} /> {usadoDoble ? 'Doble usado' : 'Doble x2'}
            </button>
            <button
              type="button"
              className="btn-soft py-1.5 text-xs"
              disabled={resuelto || usadoPista || pista || item.tipo !== 'opcion'}
              title="Quita una opción incorrecta (solo en selección, una vez por equipo)"
              onClick={() => {
                setPista(true)
                comodin(`${activo}:pista`)
              }}
            >
              <Lightbulb size={14} /> {usadoPista ? 'Pista usada' : 'Pista'}
            </button>
          </div>
        </div>

        {cuerpo}

        {resuelto && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col gap-4 rounded-xl border border-line bg-surface-2 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-3">
              {ultimo.length ? <Check className="mt-0.5 shrink-0 text-ok" size={20} /> : <X className="mt-0.5 shrink-0 text-bad" size={20} />}
              <div>
                <p className="font-semibold">{ultimo.length ? ultimo.map((r) => `+${r.puntos} para ${nombres[r.equipo]}`).join(' · ') : 'Esta vez nadie suma puntos'}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.explica}</p>
              </div>
            </div>
            <button type="button" className="btn-primary shrink-0" onClick={siguiente}>
              {indice + 1 < lista.length ? 'Siguiente' : 'Ver resultado'} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </motion.section>
    </div>
  )
}
