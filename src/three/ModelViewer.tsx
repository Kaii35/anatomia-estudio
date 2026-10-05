import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, invalidate, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Bvh, OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Color, type DirectionalLight, type Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3, type Material, type Object3D, type PerspectiveCamera } from 'three'
import { Palette, RotateCcw } from 'lucide-react'
import { models, type ModelDef, type ModelView } from '../data/models'
import { partName } from '../data/parts'
import { cn } from '../lib/text'
import { useProgress } from '../store/progress'
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
  /** Nombre de una malla concreta a resaltar (un solo lado, una sola vértebra…). */
  selectedMesh?: string | null
  /** Estado forzado por parte: acierto, fallo o resaltado. */
  marks?: Record<string, Mark>
  /** Oscurece las partes sin marcar para que destaquen las marcadas. */
  focus?: boolean
  /** Muestra el nombre de la parte bajo el cursor. Desactivar mientras se responde. */
  labels?: boolean
  /** Si se indica, solo se muestran estas partes del modelo. */
  only?: string[]
  /** Vista inicial (id de una de las `views` del modelo). */
  view?: string
  /** Con huesos pares, deja solo los de un lado (para aislar una extremidad). */
  half?: boolean
  /** Partes de las que sale una línea hacia un recuadro lateral, como en una lámina rotulada. */
  callouts?: string[]
  renderCallout?: (partId: string) => ReactNode
  /** Recuadro activo: su línea se resalta. */
  activeCallout?: string | null
  onPick?: (partId: string) => void
  onMeshClick?: (click: MeshClick) => void
  onReady?: (root: Object3D) => void
  className?: string
}

const COLORS = { sel: '#ff9466', ok: '#3ecf9e', bad: '#f2708a', hint: '#ffc35c' }
const IVORY = new Color('#e9dcc3')

/**
 * Color en el modo «Colores» de las partes cuyos modelos vienen en un solo tono
 * (cintura escapular, escápula y pelvis). El resto de modelos traen el color en su material.
 */
const PALETTE: Record<string, Color> = Object.fromEntries(
  Object.entries({
    clavicula: '#8db8e0',
    escapula: '#e2ce9c',
    'escapula-acromion': '#8dd386',
    'escapula-coracoides': '#d6a8d7',
    'escapula-glenoidea': '#e7a868',
    'escapula-espina': '#9fbcd6',
    'escapula-supraespinosa': '#6cc7ba',
    'escapula-infraespinosa': '#e2ce9c',
    ilion: '#e8b44c',
    isquion: '#8dd386',
    pubis: '#9fbfe8',
    sacro: '#40c5c0',
    coccix: '#c59ad7',
  }).map(([part, hex]) => [part, new Color(hex)]),
)
const tintOf = (mesh: Mesh, i: number): Color => PALETTE[mesh.userData.partId] ?? mesh.userData.base[i]


/** Color con el que se pinta cada parte de un modelo ya cargado en el modo «Colores» (para leyendas). */
export function partColors(root: Object3D): Record<string, string> {
  const out: Record<string, string> = {}
  for (const mesh of meshesOf(root)) {
    const id: string | null = mesh.userData.partId
    if (id && !out[id]) out[id] = `#${tintOf(mesh, 0).getHexString()}`
  }
  return out
}

const materialsOf = (m: Mesh): Material[] => (Array.isArray(m.material) ? m.material : [m.material])
const centerOf = (o: Object3D) => new Box3().setFromObject(o).getCenter(new Vector3())

function meshesOf(root: Object3D): Mesh[] {
  const out: Mesh[] = []
  root.traverse((o) => {
    if ((o as Mesh).isMesh) out.push(o as Mesh)
  })
  return out
}

/** Asigna a cada malla su parte y le da materiales propios para poder colorearla por separado. */
function prepare(root: Object3D, def: ModelDef, only?: string[], half?: boolean): Object3D {
  const match = buildMatcher(def)
  for (const mesh of meshesOf(root)) {
    if (mesh.userData.partId === undefined) {
      let id: string | null = null
      for (let n: Object3D | null = mesh; n && !id; n = n.parent) id = match(n.name)
      mesh.userData.partId = id
    }
    const own = materialsOf(mesh).map((m) => m.clone())
    mesh.material = Array.isArray(mesh.material) ? own : own[0]
    mesh.userData.base = own.map((m) => ((m as MeshStandardMaterial).color ?? new Color('#ffffff')).clone())
    // Las cavidades (órbitas, fosa nasal) conservan su color oscuro también en modo hueso.
    mesh.userData.fixed = own.some((m) => m.name === 'cavity')
  }
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
  if (only) {
    const keep = new Set(only)
    for (const mesh of meshesOf(root)) if (!keep.has(mesh.userData.partId)) mesh.removeFromParent()
  }
  if (half) {
    root.updateMatrixWorld(true)
    const mid = centerOf(root).x
    const byPart = new Map<string, { mesh: Mesh; x: number }[]>()
    for (const mesh of meshesOf(root)) {
      const id = mesh.userData.partId
      if (id) byPart.set(id, [...(byPart.get(id) ?? []), { mesh, x: centerOf(mesh).x - mid }])
    }
    for (const group of byPart.values()) {
      // Solo se recorta si la parte existe a ambos lados; un hueso central (sacro) se conserva.
      if (group.some((g) => g.x > 1e-3) && group.some((g) => g.x < -1e-3)) group.forEach((g) => g.x < 0 && g.mesh.removeFromParent())
    }
  }
  return root
}

/** Tamaño de una caja medido a lo largo de una dirección. */
const extent = (size: Vector3, axis: Vector3) => Math.abs(axis.x) * size.x + Math.abs(axis.y) * size.y + Math.abs(axis.z) * size.z

/**
 * Punto de la superficie donde termina la línea guía: el vértice más cercano al centro
 * de la cara que mira a la cámara. El centro geométrico de un hueso curvo puede caer en el aire.
 */
function surfaceAnchor(meshes: Mesh[], toCamera: Vector3): Vector3 {
  const box = new Box3()
  for (const m of meshes) box.expandByObject(m)
  const target = box.getCenter(new Vector3()).addScaledVector(toCamera, extent(box.getSize(new Vector3()), toCamera) / 2)
  const best = target.clone()
  const v = new Vector3()
  let bestDistance = Infinity
  for (const m of meshes) {
    const pos = m.geometry.attributes.position
    const step = Math.max(1, Math.floor(pos.count / 4000))
    for (let i = 0; i < pos.count; i += step) {
      const d = v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).distanceToSquared(target)
      if (d < bestDistance) {
        bestDistance = d
        best.copy(v)
      }
    }
  }
  return best
}

/**
 * Orden de los puntos de una columna (de arriba abajo) que minimiza la longitud total
 * de las líneas hacia recuadros apilados en `x`: el reparto más corto no tiene cruces.
 */
function uncrossed(points: Vector3[], x: number, centerY: number, gap: number): number[] {
  const n = points.length
  const byHeight = points.map((_, i) => i).sort((a, b) => points[b].y - points[a].y)
  if (n > 7) return byHeight
  const slotY = (slot: number) => centerY + ((n - 1) / 2 - slot) * gap
  let best = byHeight
  let bestCost = Infinity
  const walk = (chosen: number[], cost: number) => {
    if (cost >= bestCost) return
    if (chosen.length === n) {
      best = chosen
      bestCost = cost
      return
    }
    for (let i = 0; i < n; i++) {
      if (!chosen.includes(i)) walk([...chosen, i], cost + Math.hypot(points[i].x - x, points[i].y - slotY(chosen.length)))
    }
  }
  walk([], 0)
  return best
}

type ElMap<T> = MutableRefObject<Record<string, T | null>>
interface Layout {
  left: string[]
  right: string[]
}

/** Calcula el punto de anclaje de cada parte y mantiene las líneas guía pegadas a él al rotar. */
function CalloutLines({ object, parts, viewKey, lines, dots, badges, boxes, onLayout }: { object: Object3D; parts: string[]; viewKey: string; lines: ElMap<SVGLineElement>; dots: ElMap<SVGCircleElement>; badges: ElMap<SVGGElement>; boxes: ElMap<HTMLElement>; onLayout: (l: Layout) => void }) {
  const anchors = useRef(new Map<string, Vector3>())
  const v = useMemo(() => new Vector3(), [])
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    object.updateWorldMatrix(true, true)
    camera.updateMatrixWorld()
    // Ejes de la pantalla en el espacio del modelo, según la vista inicial de la cámara.
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
    const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
    const toCamera = new Vector3().setFromMatrixColumn(camera.matrixWorld, 2)
    const onScreen = (p: Vector3) => new Vector3(p.dot(right), p.dot(up), 0)

    // Los huesos pares se reparten a ambos lados del plano medio (x). En una vista lateral se
    // señala el ejemplar cercano a la cámara; de frente, el del lado de la pantalla de su recuadro.
    const mid = centerOf(object).x
    const lateral = Math.abs(toCamera.x) > 0.5
    const sign = Math.sign(lateral ? toCamera.x : right.x) || 1
    const world = new Map<string, Vector3>()
    const otherSide = new Map<string, Mesh[]>()
    for (const id of parts) {
      const all = meshesOf(object).filter((m) => m.userData.partId === id)
      if (!all.length) continue
      const oneSide = all.filter((m) => (centerOf(m).x - mid) * sign >= 0)
      const paired = oneSide.length > 0 && oneSide.length < all.length
      world.set(id, surfaceAnchor(paired ? oneSide : all, toCamera))
      if (paired && !lateral) otherSide.set(id, all.filter((m) => !oneSide.includes(m)))
    }

    // Si las partes se reparten a lo ancho (carpo), la mitad izquierda va a la columna izquierda;
    // si van en vertical (una pierna), se alternan. Luego cada columna se ordena sin cruces.
    const flat = new Map([...world].map(([id, p]) => [id, onScreen(p)]))
    const ids = [...flat.keys()]
    const span = new Box3().setFromPoints([...flat.values()]).getSize(new Vector3())
    let left: string[]
    let right_: string[]
    if (span.x >= span.y) {
      ids.sort((a, b) => flat.get(a)!.x - flat.get(b)!.x)
      const half = Math.floor(ids.length / 2)
      left = ids.slice(0, half)
      right_ = ids.slice(half)
    } else {
      ids.sort((a, b) => flat.get(b)!.y - flat.get(a)!.y)
      left = ids.filter((_, i) => i % 2 === 1)
      right_ = ids.filter((_, i) => i % 2 === 0)
    }
    for (const id of left) {
      if (!otherSide.has(id)) continue
      world.set(id, surfaceAnchor(otherSide.get(id)!, toCamera))
      flat.set(id, onScreen(world.get(id)!))
    }
    anchors.current = world

    const box = new Box3().setFromObject(object)
    const size = box.getSize(new Vector3())
    const reach = Math.max(extent(size, right), extent(size, up))
    const centre = onScreen(box.getCenter(new Vector3()))
    const order = (column: string[], x: number) => uncrossed(column.map((id) => flat.get(id)!), x, centre.y, reach * 0.12).map((i) => column[i])
    onLayout({ left: order(left, centre.x - reach), right: order(right_, centre.x + reach) })
  }, [object, parts, viewKey, camera, onLayout])

  useFrame(({ camera, gl }) => {
    const stage = gl.domElement.getBoundingClientRect()
    const marks: { el: SVGGElement; x: number; y: number }[] = []
    anchors.current.forEach((anchor, id) => {
      v.copy(anchor).project(camera)
      const x = ((v.x + 1) / 2) * stage.width
      const y = ((1 - v.y) / 2) * stage.height
      // En pantallas estrechas no hay líneas: un marcador numerado sobre cada parte.
      const badge = badges.current[id]
      if (badge) marks.push({ el: badge, x, y })
      const line = lines.current[id]
      const dot = dots.current[id]
      const box = boxes.current[id]
      if (!line || !dot || !box) return
      const r = box.getBoundingClientRect()
      const onLeft = r.left + r.width / 2 < stage.left + stage.width / 2
      line.setAttribute('x1', String((onLeft ? r.right : r.left) - stage.left))
      line.setAttribute('y1', String(r.top + Math.min(r.height / 2, 20) - stage.top))
      line.setAttribute('x2', String(x))
      line.setAttribute('y2', String(y))
      dot.setAttribute('cx', String(x))
      dot.setAttribute('cy', String(y))
      dot.setAttribute('r', '3.5')
    })
    // Dos marcadores casi superpuestos se empujan hasta dejar de taparse.
    const GAP = 24
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < marks.length; i++) {
        for (let j = i + 1; j < marks.length; j++) {
          const a = marks[i]
          const b = marks[j]
          const dx = b.x - a.x || 0.5
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy)
          if (d >= GAP) continue
          const push = (GAP - d) / 2 / d
          a.x -= dx * push
          a.y -= dy * push
          b.x += dx * push
          b.y += dy * push
        }
      }
    }
    for (const m of marks) m.el.setAttribute('transform', `translate(${m.x} ${m.y})`)
  })
  return null
}

interface PickableProps extends Pick<Props, 'selected' | 'selectedMesh' | 'marks' | 'focus' | 'onPick' | 'onMeshClick' | 'onReady'> {
  object: Object3D
  /** true: color propio de cada hueso; false: todo en color hueso. */
  colors: boolean
  hovered: string | null
  setHovered: (id: string | null) => void
  onTap: (id: string | null) => void
  children?: (object: Object3D) => ReactNode
}

function Pickable({ object, colors, selected, selectedMesh, marks, focus, hovered, setHovered, onTap, onPick, onMeshClick, onReady, children }: PickableProps) {
  useEffect(() => {
    onReady?.(object)
  }, [object, onReady])

  useEffect(() => {
    const sel = new Set(selected)
    for (const mesh of meshesOf(object)) {
      const id: string | null = mesh.userData.partId
      const state = id ? (marks?.[id] ?? (sel.has(id) || (selectedMesh && mesh.name === selectedMesh) ? 'sel' : null)) : null
      materialsOf(mesh).forEach((material, i) => {
        const mat = material as MeshStandardMaterial
        if (!mat.color) return
        if (state) mat.color.set(COLORS[state])
        else mat.color.copy(mesh.userData.fixed ? mesh.userData.base[i] : colors ? tintOf(mesh, i) : IVORY).multiplyScalar(focus ? 0.45 : 1)
        if (mat.emissive) {
          mat.emissive.set(state ? COLORS[state] : id && id === hovered ? '#ffffff' : '#000000')
          mat.emissiveIntensity = state ? 0.3 : 0.14
        }
      })
    }
    invalidate()
  }, [object, colors, selected, selectedMesh, marks, focus, hovered])

  const partAt = (e: ThreeEvent<PointerEvent | MouseEvent>): string | null => {
    e.stopPropagation()
    return e.object.userData.partId ?? null
  }

  return (
    <>
      <primitive
        object={object}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => setHovered(partAt(e))}
        onPointerOut={() => setHovered(null)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          const id = partAt(e)
          if (e.delta > 5) return // fue un arrastre para rotar, no un clic
          onTap(id)
          onMeshClick?.({ meshName: e.object.name, partId: id, point: object.worldToLocal(e.point.clone()).toArray() })
          if (id) onPick?.(id)
        }}
      />
      {children?.(object)}
    </>
  )
}

interface SourceProps extends Omit<PickableProps, 'object'> {
  def: ModelDef
  only?: string[]
  half?: boolean
}

function GlbModel({ def, only, half, wide, compact, view, ...rest }: SourceProps & { wide: boolean; compact: boolean; view?: ModelView }) {
  const { scene } = useGLTF(def.url)
  const object = useMemo(() => prepare(scene.clone(true), def, only, half), [scene, def, only, half])

  // Encuadre: se coloca la cámara de una vez, sin animación. Una animación de encuadre
  // aún en curso se cortaba al primer arrastre y el modelo daba un salto.
  const group = useRef<Group>(null)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update: () => void } | null
  useLayoutEffect(() => {
    if (!group.current) return
    group.current.updateWorldMatrix(true, true)
    const box = new Box3().setFromObject(group.current)
    const size = box.getSize(new Vector3())
    const toCamera = new Vector3(...(view?.dir ?? [0, 0, 1])).normalize()
    const right = Math.abs(toCamera.y) > 0.95 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0).cross(toCamera).normalize()
    const up = toCamera.clone().cross(right)
    // Con recuadros a los lados queda libre ~40 % del ancho y ~85 % del alto del escenario.
    // En un escenario estrecho se deja sitio arriba y abajo para los botones que flotan sobre el modelo.
    const [roomX, roomY] = wide ? [2.5, 1.18] : compact ? [1.25, 1.55] : [1.2, 1.2]
    const tan = Math.tan((camera.fov * Math.PI) / 360)
    const fit = Math.max(roomY * extent(size, up), (roomX * extent(size, right)) / camera.aspect) / (2 * tan) + extent(size, toCamera) / 2
    const target = view?.target ? new Vector3(...view.target) : box.getCenter(new Vector3())
    const distance = view?.target && view.distance ? view.distance * (wide ? 1.6 : 1) : fit
    camera.position.copy(target).addScaledVector(toCamera, distance)
    camera.near = distance / 100
    camera.far = distance * 100 + fit
    camera.lookAt(target)
    camera.updateProjectionMatrix()
    if (controls) {
      controls.target.copy(target)
      controls.update()
    }
    invalidate()
  }, [object, wide, compact, view, camera, controls])

  return (
    <group ref={group} rotation={def.rotation ?? [0, 0, 0]}>
      <Bvh firstHitOnly>
        <Pickable object={object} {...rest} />
      </Bvh>
    </group>
  )
}

/** Luz que acompaña a la cámara: ilumina lo que se mira también desde abajo, detrás o dentro de un corte. */
function HeadLight() {
  const light = useRef<DirectionalLight>(null)
  useFrame(({ camera }) => {
    if (!light.current) return
    light.current.position.copy(camera.position)
    camera.getWorldDirection(light.current.target.position).add(camera.position)
    light.current.target.updateMatrixWorld()
  })
  return <directionalLight ref={light} intensity={1.6} />
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

export function ModelViewer({ model, labels = true, className, onPick, onReady, only, half, view: initialView, callouts, renderCallout, activeCallout, ...rest }: Props) {
  const def = typeof model === 'string' ? models[model] : model
  const [hovered, setHovered] = useState<string | null>(null)
  const [resets, setResets] = useState(0)
  const [viewId, setViewId] = useState(initialView)
  const activeView = def.views?.find((v) => v.id === viewId) ?? def.views?.[0]
  const [layout, setLayout] = useState<Layout | null>(null)
  // En un escenario estrecho (móvil) los recuadros no caben a los lados del modelo: pasan
  // debajo, numerados, y sobre el modelo queda un marcador con el número de cada uno.
  const stage = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    if (!stage.current) return
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 560))
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [])
  // Nombre de la última parte tocada: en pantallas táctiles sustituye al del cursor.
  const [tapped, setTapped] = useState<string | null>(null)
  useEffect(() => {
    if (!tapped) return
    const timer = setTimeout(() => setTapped(null), 2500)
    return () => clearTimeout(timer)
  }, [tapped])
  const badges = useRef<Record<string, SVGGElement | null>>({})
  const colors = useProgress((s) => s.colors)
  const toggleColors = useProgress((s) => s.toggleColors)
  const lines = useRef<Record<string, SVGLineElement | null>>({})
  const dots = useRef<Record<string, SVGCircleElement | null>>({})
  const boxes = useRef<Record<string, HTMLElement | null>>({})
  // Las listas llegan como arrays nuevos en cada render; se estabilizan por contenido.
  const onlyKey = only?.join('|')
  const calloutKey = callouts?.join('|')
  const stableOnly = useMemo(() => only, [onlyKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const stableCallouts = useMemo(() => callouts, [calloutKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const sourceKey = `${def.url}:${onlyKey ?? ''}:${half ? 1 : 0}`

  // El lienzo no se redibuja solo: se pide un fotograma tras cada render de React, que es
  // cuando pueden haberse movido los recuadros a los que van las líneas guía.
  useEffect(() => {
    invalidate()
  })
  // El aviso de carga es HTML fuera del lienzo: se quita cuando el modelo de esta fuente está montado.
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const handleReady = useCallback(
    (root: Object3D) => {
      setLoadedKey(sourceKey)
      onReady?.(root)
    },
    [sourceKey, onReady],
  )
  const shared: SourceProps = {
    ...rest,
    def,
    only: stableOnly,
    half,
    colors,
    onPick,
    onReady: handleReady,
    hovered,
    setHovered,
    onTap: setTapped,
    children: stableCallouts
      ? (object) => <CalloutLines object={object} parts={stableCallouts} viewKey={`${activeView?.id}:${resets}`} lines={lines} dots={dots} badges={badges} boxes={boxes} onLayout={setLayout} />
      : undefined,
  }

  const numbered = layout ? [...layout.left, ...layout.right] : []

  return (
    <div>
    <div ref={stage} className={cn('stage relative overflow-hidden rounded-2xl', hovered && onPick && 'cursor-pointer', className)}>
      <LoadBoundary key={sourceKey}>
        <Canvas key={`${sourceKey}-${resets}`} frameloop="demand" camera={{ position: [0, 0, 10], fov: 35 }} dpr={[1, 1.5]}>
          <hemisphereLight args={['#fff6e8', '#4a4460', 1.2]} />
          <directionalLight position={[4, 6, 8]} intensity={0.9} />
          <HeadLight />
          <Suspense fallback={null}>
            <GlbModel {...shared} wide={!!callouts && !compact} compact={compact} view={activeView} />
          </Suspense>
          <OrbitControls makeDefault enableDamping />
        </Canvas>
      </LoadBoundary>

      {loadedKey !== sourceKey && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/70">Cargando modelo…</span>
      )}

      {callouts && layout && renderCallout && compact && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {numbered.map((id, i) => (
            <g key={id} ref={(el) => void (badges.current[id] = el)}>
              <circle r={11} fill={id === activeCallout ? COLORS.hint : 'rgba(0,0,0,0.72)'} stroke={id === activeCallout ? '#000000' : '#ffffff'} strokeWidth={1.5} />
              <text textAnchor="middle" dy="0.36em" fontSize={12} fontWeight={700} fill={id === activeCallout ? '#000000' : '#ffffff'}>
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      )}
      {callouts && layout && renderCallout && !compact && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {callouts.map((id) => (
              <g key={id}>
                <line
                  ref={(el) => void (lines.current[id] = el)}
                  stroke={id === activeCallout ? COLORS.hint : 'rgba(255,255,255,0.65)'}
                  strokeWidth={id === activeCallout ? 2 : 1.25}
                />
                <circle ref={(el) => void (dots.current[id] = el)} fill={id === activeCallout ? COLORS.hint : '#ffffff'} />
              </g>
            ))}
          </svg>
          {(['left', 'right'] as const).map((side) => (
            <div
              key={side}
              className={cn(
                'pointer-events-none absolute top-12 bottom-4 flex w-[31%] max-w-52 flex-col justify-center gap-2.5',
                side === 'left' ? 'left-3' : 'right-3',
              )}
            >
              {layout[side].map((id) => (
                <div key={id} ref={(el) => void (boxes.current[id] = el)} className="pointer-events-auto">
                  {renderCallout(id)}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      <button
        type="button"
        onClick={toggleColors}
        aria-pressed={colors}
        title={colors ? 'Ver en color hueso' : 'Ver cada hueso de un color'}
        className={cn(
          'absolute top-3 right-16 flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition sm:right-14 sm:h-8 sm:px-2.5',
          colors ? 'bg-white/90 text-black' : 'bg-black/35 text-white/75 hover:bg-black/55 hover:text-white',
        )}
      >
        <Palette size={16} /> Colores
      </button>
      <button
        type="button"
        onClick={() => setResets((n) => n + 1)}
        title="Restablecer vista"
        aria-label="Restablecer vista"
        className="absolute top-3 right-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-black/35 text-white/75 transition hover:bg-black/55 hover:text-white sm:h-8 sm:w-8"
      >
        <RotateCcw size={16} />
      </button>
      {def.views && def.views.length > 1 && (
        <div className="absolute bottom-3 left-3 flex gap-1 rounded-lg bg-black/35 p-1">
          {def.views.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === activeView?.id}
              onClick={() => {
                setViewId(v.id)
                setResets((n) => n + 1)
              }}
              className={cn(
                'cursor-pointer rounded-md px-3 py-2.5 text-xs font-semibold transition sm:px-2.5 sm:py-1',
                v.id === activeView?.id ? 'bg-white/90 text-black' : 'text-white/75 hover:text-white',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      {labels && (hovered ?? tapped) && (
        <span className="pointer-events-none absolute top-16 left-1/2 max-w-[90%] -translate-x-1/2 truncate rounded-full bg-black/60 sm:top-auto sm:bottom-3 px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap text-white">
          {partName((hovered ?? tapped)!, def)}
        </span>
      )}
      {!callouts && (
        <span className="pointer-events-none absolute right-3 bottom-3 hidden text-[11px] text-white/40 sm:block">
          Arrastra para rotar · rueda para acercar
        </span>
      )}
    </div>
      {callouts && layout && renderCallout && compact && (
        <div className="stage mt-2 grid grid-cols-2 gap-x-2.5 gap-y-2 rounded-2xl p-3">
          {numbered.map((id, i) => (
            <div key={id} className="flex min-w-0 items-start gap-1.5">
              <span
                className={cn(
                  'mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  id === activeCallout ? 'border-black bg-[#ffc35c] text-black' : 'border-white/70 bg-black/60 text-white',
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">{renderCallout(id)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
