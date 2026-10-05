import { useMemo, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Box, Fingerprint, Link2 } from 'lucide-react'
import type { Bone, RegionId } from '../types'
import { regionById } from '../data/regions'
import { boneById, bones } from '../data/bones'
import { models } from '../data/models'
import { cn } from '../lib/text'
import { ModelViewer } from '../three/ModelViewer'

function BoneDetail({ bone }: { bone: Bone }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-semibold">{bone.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="chip">Hueso {bone.kind}</span>
          <span className="chip">{bone.paired ? 'Par' : 'Impar'}</span>
          {bone.aliases && !bone.series && <span className="chip">También: {bone.aliases.slice(0, 2).join(', ')}</span>}
        </div>
      </div>
      <p className="leading-relaxed">{bone.summary}</p>
      {bone.image && <img src={bone.image} alt={bone.name} className="max-h-72 w-full rounded-xl border border-line object-contain" />}

      {bone.landmarks && (
        <section>
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Accidentes óseos</h3>
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

export function RegionPage() {
  const { id } = useParams()
  const region = regionById[id as RegionId]
  const list = useMemo(() => bones.filter((b) => b.region === id), [id])
  const groups = useMemo(() => [...new Set(list.map((b) => b.group))], [list])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modelId, setModelId] = useState<string | null>(null)

  if (!region) return <Navigate to="/" replace />

  const bone = (selectedId && boneById[selectedId]?.region === region.id ? boneById[selectedId] : null) ?? list[0]
  const activeModel = modelId && region.models.includes(modelId) ? modelId : region.models[0]

  return (
    <div style={{ '--c': region.color } as CSSProperties}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft size={15} /> Regiones
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{region.name}</h1>
          <p className="mt-1 text-muted">{region.description}</p>
        </div>
        <Link to={`/practica?region=${region.id}`} className="btn-primary">
          Practicar esta región <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {activeModel ? (
            <>
              <ModelViewer
                model={activeModel}
                selected={[bone.id]}
                onPick={(part) => boneById[part]?.region === region.id && setSelectedId(part)}
                className="h-[380px] lg:h-[500px]"
              />
              {region.models.length > 1 && (
                <div className="flex gap-2">
                  {region.models.map((m) => (
                    <button key={m} type="button" onClick={() => setModelId(m)} className={cn('btn-soft', m === activeModel && 'border-(--c)!')}>
                      {models[m].title}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted">Pasa el cursor para ver el nombre de cada parte y haz clic en un hueso de esta región para abrir su ficha.</p>
            </>
          ) : (
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
                        onClick={() => setSelectedId(b.id)}
                        className={cn(
                          'cursor-pointer rounded-lg border px-2.5 py-1.5 text-sm font-medium transition',
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

        <div className="card p-6 sm:p-7">
          <BoneDetail key={bone.id} bone={bone} />
        </div>
      </div>
    </div>
  )
}
