import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Bounds, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Color, Mesh, MeshStandardMaterial, SphereGeometry, Vector3, type Material, type Object3D } from 'three'
import { RotateCcw } from 'lucide-react'
import { models, type ModelDef } from '../data/models'
import { partName } from '../data/parts'
import { cn } from '../lib/text'
import { buildMatcher } from './meshMatch'

export type Mark = 'ok' | 'bad' | 'hint'

export interface MeshClick {
  meshName: string
  partId: string | null
  /** Punto del clic en coordenadas locales del modelo (sirve para definir hotspots). */
  point: [number, number, number]
}

interface Props {
  model: string | ModelDef
  /** Partes seleccionadas por el usuario. */
  selected?: string[]
  /** Estado forzado por parte: acierto, fallo o resaltado. */
  marks?: Record<string, Mark>
  /** Oscurece las partes sin marcar para que destaquen las marcadas. */
  focus?: boolean
  /** Muestra el nombre de la parte bajo el cursor. Desactivar mientras se responde. */
  labels?: boolean
  onPick?: (partId: string) => void
  onMeshClick?: (click: MeshClick) => void
  onReady?: (root: Object3D) => void
  className?: string
}

const COLORS = { sel: '#ff9466', ok: '#3ecf9e', bad: '#f2708a', hint: '#ffc35c' }

const materialsOf = (m: Mesh): Material[] => (Array.isArray(m.material) ? m.material : [m.material])

/** Asigna a cada malla su parte y le da materiales propios para poder colorearla por separado. */
function prepare(root: Object3D, def: ModelDef): Object3D {
  const match = buildMatcher(def)
  root.traverse((o) => {
    const mesh = o as Mesh
    if (!mesh.isMesh) return
    if (mesh.userData.partId === undefined) {
      let id: string | null = null
      for (let n: Object3D | null = mesh; n && !id; n = n.parent) id = match(n.name)
      mesh.userData.partId = id
    }
    const own = materialsOf(mesh).map((m) => m.clone())
    mesh.material = Array.isArray(mesh.material) ? own : own[0]
    mesh.userData.base = own.map((m) => ((m as MeshStandardMaterial).color ?? new Color('#ffffff')).clone())
  })
  if (def.hotspots?.length) {
    const radius = new Box3().setFromObject(root).getSize(new Vector3()).length() * 0.012
    for (const h of def.hotspots) {
      const dot = new Mesh(new SphereGeometry(radius, 16, 12), new MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.4 }))
      dot.position.set(...h.position)
      dot.name = h.id
      dot.userData.partId = h.id
      dot.userData.base = [new Color('#8fd3ff')]
      root.add(dot)
    }
  }
  return root
}

interface PickableProps extends Omit<Props, 'model' | 'className' | 'labels'> {
  object: Object3D
  hovered: string | null
  setHovered: (id: string | null) => void
}

function Pickable({ object, selected, marks, focus, hovered, setHovered, onPick, onMeshClick, onReady }: PickableProps) {
  useEffect(() => {
    onReady?.(object)
  }, [object, onReady])

  useEffect(() => {
    const sel = new Set(selected)
    object.traverse((o) => {
      const mesh = o as Mesh
      if (!mesh.isMesh) return
      const id: string | null = mesh.userData.partId
      const state = id ? (marks?.[id] ?? (sel.has(id) ? 'sel' : null)) : null
      materialsOf(mesh).forEach((material, i) => {
        const mat = material as MeshStandardMaterial
        if (!mat.color) return
        if (state) mat.color.set(COLORS[state])
        else mat.color.copy(mesh.userData.base[i]).multiplyScalar(focus ? 0.45 : 1)
        if (mat.emissive) {
          mat.emissive.set(state ? COLORS[state] : id && id === hovered ? '#ffffff' : '#000000')
          mat.emissiveIntensity = state ? 0.3 : 0.14
        }
      })
    })
  }, [object, selected, marks, focus, hovered])

  const partAt = (e: ThreeEvent<PointerEvent | MouseEvent>): string | null => {
    e.stopPropagation()
    return e.object.userData.partId ?? null
  }

  return (
    <primitive
      object={object}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => setHovered(partAt(e))}
      onPointerOut={() => setHovered(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        const id = partAt(e)
        if (e.delta > 5) return // fue un arrastre para rotar, no un clic
        onMeshClick?.({ meshName: e.object.name, partId: id, point: object.worldToLocal(e.point.clone()).toArray() })
        if (id) onPick?.(id)
      }}
    />
  )
}

function GlbModel({ def, url, ...rest }: Omit<PickableProps, 'object'> & { def: ModelDef; url: string }) {
  const { scene } = useGLTF(url)
  const object = useMemo(() => prepare(scene.clone(true), def), [scene, def])
  return <Pickable object={object} {...rest} />
}

function ProceduralModel({ def, build, ...rest }: Omit<PickableProps, 'object'> & { def: ModelDef; build: () => Object3D }) {
  const object = useMemo(() => prepare(build(), def), [build, def])
  return <Pickable object={object} {...rest} />
}

class LoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/70">
        No se pudo cargar el modelo 3D. Comprueba que el archivo existe y es un .glb válido.
      </div>
    )
  }
}

export function ModelViewer({ model, labels = true, className, onPick, ...rest }: Props) {
  const def = typeof model === 'string' ? models[model] : model
  const [hovered, setHovered] = useState<string | null>(null)
  const [view, setView] = useState(0)
  const shared = { ...rest, onPick, hovered, setHovered }
  const sourceKey = def.source.kind === 'glb' ? def.source.url : def.id

  return (
    <div className={cn('stage relative overflow-hidden rounded-2xl', hovered && onPick && 'cursor-pointer', className)}>
      <LoadBoundary key={sourceKey}>
        <Canvas key={`${sourceKey}-${view}`} camera={{ position: [0, 0, 10], fov: 35 }} dpr={[1, 2]}>
          <hemisphereLight args={['#fff6e8', '#4a4460', 1.3]} />
          <directionalLight position={[4, 6, 8]} intensity={1.7} />
          <directionalLight position={[-6, -2, -6]} intensity={0.7} />
          <Suspense
            fallback={
              <Html center>
                <span className="text-sm whitespace-nowrap text-white/70">Cargando modelo…</span>
              </Html>
            }
          >
            <Bounds fit clip observe margin={1.15}>
              <group rotation={def.rotation ?? [0, 0, 0]}>
                {def.source.kind === 'glb' ? (
                  <GlbModel def={def} url={def.source.url} {...shared} />
                ) : (
                  <ProceduralModel def={def} build={def.source.build} {...shared} />
                )}
              </group>
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>
      </LoadBoundary>

      {def.schematic && (
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/70">
          Modelo esquemático provisional
        </span>
      )}
      <button
        type="button"
        onClick={() => setView((v) => v + 1)}
        title="Restablecer vista"
        aria-label="Restablecer vista"
        className="absolute top-3 right-3 cursor-pointer rounded-lg bg-black/35 p-2 text-white/75 transition hover:bg-black/55 hover:text-white"
      >
        <RotateCcw size={16} />
      </button>
      {labels && hovered && (
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap text-white">
          {partName(hovered, def)}
        </span>
      )}
      <span className="pointer-events-none absolute right-3 bottom-3 hidden text-[11px] text-white/40 sm:block">
        Arrastra para rotar · rueda para acercar
      </span>
    </div>
  )
}
