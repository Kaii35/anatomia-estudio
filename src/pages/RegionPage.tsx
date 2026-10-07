import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, Box, Fingerprint, Link2, MapPin, Tags } from 'lucide-react'
import type { Bone, Region, RegionId } from '../types'
import { regionById } from '../data/regions'
import { boneById, bones } from '../data/bones'
import { models } from '../data/models'
import { partBone, partName, partNote, partsOfBone } from '../data/parts'
import { cn } from '../lib/text'
import { meshDetail } from '../three/meshMatch'
import { ModelViewer, partColors } from '../three/ModelViewer'
import { useProgress } from '../store/progress'

function BoneDetail({ bone, picked, pickedNote, otherRegion }: { bone: Bone; picked: string | null; pickedNote?: string; otherRegion: Region | null }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-semibold">{bone.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {!bone.concept && <span className="chip">Hueso {bone.kind}</span>}
          {!bone.concept && <span className="chip">{bone.paired ? 'Par' : 'Impar'}</span>}
          {bone.aliases && !bone.series && <span className="chip">También: {bone.aliases.slice(0, 2).join(', ')}</span>}
          {otherRegion && (
            <Link to={`/region/${otherRegion.id}`} className="chip text-ink! hover:border-accent">
              Región: {otherRegion.name} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
      {picked && (
        <p className="flex items-start gap-2 rounded-xl border border-(--c)/50 bg-(--c)/10 px-3.5 py-2.5 text-[15px]">
          <MapPin size={16} className="mt-1 shrink-0 text-(--c)" />
          <span>
            Parte señalada: <strong className="font-semibold">{picked}</strong>
            {pickedNote && <span className="mt-0.5 block text-sm text-muted">{pickedNote}</span>}
          </span>
        </p>
      )}
      <p className="leading-relaxed">{bone.summary}</p>
      {bone.image && <img src={bone.image} alt={bone.name} className="max-h-72 w-full rounded-xl border border-line object-contain" />}

      {bone.landmarks && (
        <section>
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">{bone.concept ? 'Para recordar' : 'Accidentes óseos'}</h3>
          <ul className="mt-2.5 space-y-2">
            {bone.landmarks.map((lm) => (
              <li key={lm.name} className="flex gap-2.5 text-[15px]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-(--c)" />
                <span>
                  <strong className="font-semibold">{lm.name}</strong>
                  {lm.note && <span className="text-muted"> — {lm.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bone.articulations && (
        <section>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted uppercase">
            <Link2 size={13} /> Articula con
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {bone.articulations.map((a) => (
              <span key={a} className="chip text-ink!">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {bone.forensic && (
        <section className="rounded-xl border border-accent/40 bg-accent/8 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent uppercase">
            <Fingerprint size={14} /> Interés forense
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed">{bone.forensic}</p>
        </section>
      )}
    </div>
  )
}

/** Lo que el usuario ha señalado: una parte y, si hizo clic en el modelo, la malla exacta. */
interface Picked {
  part: string
  mesh?: string
}

function RegionView({ region }: { region: Region }) {
  const list = bones.filter((b) => b.region === region.id)
  const groups = [...new Set(list.map((b) => b.group))]
  const [boneId, setBoneId] = useState(list[0].id)
  const [pick, setPick] = useState<Picked | null>(null)
  const [modelId, setModelId] = useState<string | undefined>(region.models[0])
  const [showLabels, setShowLabels] = useState(true)
  // Leyenda del modo «Colores»: color de cada parte del modelo cargado.
  const colorsOn = useProgress((s) => s.colors)
  // Partes presentes en el modelo cargado, con el color que reciben en el modo «Colores».
  const [loaded, setLoaded] = useState<{ model?: string; colors: Record<string, string> }>({ colors: {} })
  const onReady = useCallback(
    (root: Parameters<typeof partColors>[0]) => {
      const colors = partColors(root)
      setLoaded({ model: modelId, colors })
      // Si el hueso abierto no está en este modelo (p. ej. el húmero al pasar a «Radio y cúbito»), se abre uno que sí.
      const owners = Object.keys(colors).map(partBone).filter((b): b is string => !!b && boneById[b].region === region.id)
      setBoneId((current) => (owners.length && !owners.includes(current) ? owners[0] : current))
    },
    [modelId, region.id],
  )
  const legend = loaded.model === modelId ? loaded.colors : {}
  const modelParts = Object.keys(legend)
  const card = useRef<HTMLDivElement>(null)

  const bone = boneById[boneId]
  // Viaje de la cámara: al elegir una parte desde una etiqueta, la leyenda o la lista (no al tocarla en el modelo, que ya se está viendo).
  const [fly, setFly] = useState<{ part: string; n: number } | null>(null)
  const goTo = (part: string) => setFly((f) => ({ part, n: (f?.n ?? 0) + 1 }))
  const select = (next: Picked) => {
    setPick(next)
    if (!next.mesh) goTo(next.part)
    const owner = partBone(next.part)
    if (owner) setBoneId(owner)
  }

  // Etiquetas con flecha: las partes del modelo del mismo grupo que el hueso abierto
  // (p. ej. solo la fila proximal del carpo), o todas si el modelo tiene pocas.
  const sameGroup = modelParts.filter((p) => boneById[partBone(p) ?? '']?.group === bone.group)
  // Si el modelo trae el hueso abierto dividido en zonas, se etiquetan esas zonas y no las de sus vecinos.
  const ownZones = modelParts.filter((p) => p !== bone.id && partBone(p) === bone.id)
  const labelParts = (ownZones.length > 1 ? ownZones : sameGroup.length ? sameGroup : modelParts.length <= 9 ? modelParts : []).filter((p) => p !== 'dientes').slice(0, 22)
  // Leyenda de colores: todo el modelo si es pequeño; si no, solo las zonas del hueso abierto.
  const legendParts = modelParts.length <= 24 ? modelParts : ownZones
  const activePart = pick?.part ?? bone.id

  // Texto de «Parte señalada»: solo si aporta algo más que el nombre del hueso de la ficha.
  const pickedName = pick && partName(pick.part)
  const detail = pick?.mesh ? meshDetail(pick.mesh) : null
  const pickedText = pick && (pickedName !== bone.name || detail) ? [pickedName !== bone.name && pickedName, detail].filter(Boolean).join(' · ') : null
  const pickedNote = pick ? partNote(pick.part) : undefined

  return (
    <div style={{ '--c': region.color } as CSSProperties}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 py-2 text-sm text-muted hover:text-ink">
            <ArrowLeft size={15} /> Regiones
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{region.name}</h1>
          <p className="mt-1 text-muted">{region.description}</p>
        </div>
        <Link to={`/practica?region=${region.id}`} className="btn-primary">
          Practicar esta región <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {modelId ? (
            <>
              <ModelViewer
                model={modelId}
                selected={pick?.mesh ? [] : pick ? [pick.part] : ownZones.length > 1 ? [] : partsOfBone(bone.id)}
                hideOccludedCallouts
                selectedMesh={pick?.mesh}
                flyTo={fly}
                onReady={onReady}
                onMeshClick={(click) => click.partId && select({ part: click.partId, mesh: click.meshName })}
                callouts={showLabels && labelParts.length ? labelParts : undefined}
                activeCallout={activePart}
                renderCallout={(p) => (
                  <button
                    type="button"
                    onClick={() => select({ part: p })}
                    className={cn(
                      'w-full cursor-pointer rounded-lg border px-2.5 py-2.5 text-left text-[13px] leading-tight font-semibold transition sm:py-1.5',
                      p === activePart ? 'border-[#ffc35c] bg-black/70 text-white' : 'border-white/20 bg-black/50 text-white/85 hover:border-white/50',
                    )}
                  >
                    {partName(p)}
                  </button>
                )}
                className="h-[340px] sm:h-[440px] lg:h-[540px]"
              />
              {/* En móvil la ficha queda lejos, bajo la lista de huesos: acceso directo a ella. */}
              <button
                type="button"
                onClick={() => card.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-(--c)/50 bg-(--c)/10 px-4 py-3 text-left lg:hidden"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg font-semibold">{bone.name}</span>
                  {pickedText && <span className="block truncate text-sm text-muted">{pickedText}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-(--c)">
                  Ver ficha <ArrowDown size={15} />
                </span>
              </button>
              <div className="flex flex-wrap gap-2">
                {region.models.length > 1 &&
                  region.models.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setModelId(m)
                        setFly(null)
                      }} className={cn('btn-soft', m === modelId && 'border-(--c)!')}>
                      {models[m].title}
                    </button>
                  ))}
                {labelParts.length > 0 && (
                  <button type="button" aria-pressed={showLabels} onClick={() => setShowLabels(!showLabels)} className={cn('btn-soft ml-auto', showLabels && 'border-(--c)!')}>
                    <Tags size={15} /> Etiquetas
                  </button>
                )}
              </div>
{colorsOn && legendParts.length > 0 && (
                <div className="flex flex-wrap gap-x-1 gap-y-1">
                  {legendParts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => select({ part: p })}
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition sm:py-1',
                        p === activePart ? 'border-(--c) text-ink' : 'border-transparent text-muted hover:text-ink',
                      )}
                    >
                      <span className="h-3 w-3 rounded-sm border border-line" style={{ background: legend[p] }} />
                      {partName(p)}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted">Haz clic en cualquier pieza del modelo o en una etiqueta para resaltarla y abrir su ficha.</p>
            </>
          ) : region.models.length === 0 ? null : (
            <div className="stage flex h-[300px] flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center text-white/70">
              <Box size={34} />
              <p className="max-w-xs text-sm">El modelo 3D de esta región todavía no está cargado. Mientras tanto puedes estudiar las fichas y practicar con preguntas.</p>
            </div>
          )}

          <div className="card p-4">
            {groups.map((g) => (
              <div key={g} className="not-first:mt-4">
                <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">{g}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {list
                    .filter((b) => b.group === g)
                    .map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBoneId(b.id)
                          setPick(null)
                          goTo(b.id)
                        }}
                        className={cn(
                          'cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition sm:px-2.5 sm:py-1.5',
                          b.id === bone.id ? 'border-(--c) bg-(--c)/15 text-ink' : 'border-line text-muted hover:text-ink',
                        )}
                      >
                        {b.series ? b.name.replace(/^Falange (proximal|media|distal) del /, '').replace(/ (metacarpiano|metatarsiano)$/, '') : b.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={card} className="card scroll-mt-20 p-5 sm:p-7">
          <BoneDetail key={bone.id} bone={bone} picked={pickedText} pickedNote={pickedNote} otherRegion={bone.region !== region.id ? regionById[bone.region] : null} />
        </div>
      </div>
    </div>
  )
}

export function RegionPage() {
  const { id } = useParams()
  const region = regionById[id as RegionId]
  if (!region) return <Navigate to="/" replace />
  // La clave reinicia la selección al cambiar de región.
  return <RegionView key={region.id} region={region} />
}
