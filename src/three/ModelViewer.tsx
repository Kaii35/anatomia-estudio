import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, invalidate, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Bvh, OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, BufferGeometry, Color, Quaternion, type DirectionalLight, type Group, Mesh, Raycaster, MeshStandardMaterial, SphereGeometry, Vector3, type Intersection, type Material, type Object3D, type PerspectiveCamera } from 'three'
import { Palette, RotateCcw } from 'lucide-react'
import { models, type ModelDef, type ModelView } from '../data/models'
import { partBone, partName } from '../data/parts'
import tints from '../data/tints.json'
import { zoneKey } from '../data/zones'
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
  /** Se llama cuando el usuario cambia de vista con los botones (Anterior, Posterior…). */
  onViewChange?: () => void
  /** Encuadra solo estas partes en vez del modelo entero. */
  fitParts?: string[]
  /** Lleva la cámara, con una animación, hasta esta parte. `n` permite repetir el viaje a la misma parte. */
  flyTo?: { part: string; n: number } | null
  /** Parte que debe verse al abrir: se elige la vista hacia la que mira (p. ej. la posterior para la fosa olecraniana). */
  focusPart?: string
  /** Con huesos pares, deja solo los de un lado (para aislar una extremidad). */
  half?: boolean
  /** Partes de las que sale una línea hacia un recuadro lateral, como en una lámina rotulada. */
  callouts?: string[]
  renderCallout?: (partId: string) => ReactNode
  /** Omite las etiquetas de las partes que desde la vista actual quedan tapadas o por detrás. */
  hideOccludedCallouts?: boolean
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
 * Color de una malla en el modo «Colores»: el de su material si el archivo la trae
 * coloreada («tint_…») y, si viene en un solo tono, el de la tabla data/tints.json,
 * que guarda el color de esa misma pieza en los modelos que sí lo traen.
 */
const TINTS = Object.fromEntries(Object.entries(tints as Record<string, string>).map(([key, hex]) => [key, new Color(hex)]))
const tintOf = (mesh: Mesh, i: number): Color => mesh.userData.tint ?? mesh.userData.base[i]

/** Parte por la que cuenta una malla al buscar su estado: la suya o, si es una zona, el hueso entero. */
const stateOf = <T,>(id: string, lookup: (id: string) => T | undefined): T | undefined => {
  const own = lookup(id)
  if (own !== undefined) return own
  const owner = partBone(id)
  return owner && owner !== id ? lookup(owner) : undefined
}


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

/**
 * En los modelos, las fosas supraespinosa e infraespinosa son mallas que abarcan todo el
 * grosor de la escápula, también su cara anterior. Esa cara es la fosa subescapular:
 * aquí se separan en una malla propia los triángulos que miran hacia delante.
 */
function splitSubscapular(root: Object3D) {
  root.updateMatrixWorld(true)
  const a = new Vector3()
  const b = new Vector3()
  const c = new Vector3()
  for (const mesh of meshesOf(root)) {
    const side = mesh.name.match(/^scapula_([LR])_(?:infra|supra)spinous_fossa$/)?.[1]
    const index = mesh.geometry.index
    const position = mesh.geometry.attributes.position
    if (!side || !index) continue
    const front: number[] = []
    const back: number[] = []
    for (let i = 0; i < index.count; i += 3) {
      const [i0, i1, i2] = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
      a.fromBufferAttribute(position, i0).applyMatrix4(mesh.matrixWorld)
      b.fromBufferAttribute(position, i1).applyMatrix4(mesh.matrixWorld)
      c.fromBufferAttribute(position, i2).applyMatrix4(mesh.matrixWorld)
      // Normal geométrica de la cara: hacia delante (+z) es la cara costal.
      const facesFront = b.sub(a).cross(c.sub(a)).normalize().z > 0.25
      ;(facesFront ? front : back).push(i0, i1, i2)
    }
    if (!front.length || !back.length) continue
    const piece = (indices: number[]) => {
      const geometry = new BufferGeometry()
      for (const [name, attribute] of Object.entries(mesh.geometry.attributes)) geometry.setAttribute(name, attribute)
      geometry.setIndex(indices)
      return geometry
    }
    const fossa = new Mesh(piece(front), mesh.material)
    fossa.name = `scapula_${side}_subscapular_fossa`
    fossa.userData.split = true
    fossa.position.copy(mesh.position)
    fossa.quaternion.copy(mesh.quaternion)
    fossa.scale.copy(mesh.scale)
    mesh.parent?.add(fossa)
    mesh.geometry = piece(back)
  }
}

/** Asigna a cada malla su parte y le da materiales propios para poder colorearla por separado. */
function prepare(root: Object3D, def: ModelDef, only?: string[], half?: boolean): Object3D {
  const match = buildMatcher(def)
  if (def.keep) for (const mesh of meshesOf(root)) if (!def.keep(mesh.name)) mesh.removeFromParent()
  splitSubscapular(root)
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
    // Una malla separada aquí hereda el material de su origen: su color sale siempre de la tabla.
    mesh.userData.tint = !mesh.userData.split && own.some((m) => m.name.startsWith('tint_')) ? undefined : TINTS[zoneKey(mesh.name)]
  }
  if (def.hotspots?.length) {
    const radius = new Box3().setFromObject(root).getSize(new Vector3()).length() * 0.011
    for (const h of def.hotspots) {
      const dot = new Mesh(new SphereGeometry(radius, 16, 12), new MeshStandardMaterial({ color: '#8fd3ff', roughness: 0.4 }))
      dot.position.set(...h.position)
      dot.name = h.id
      dot.userData.partId = h.id
      dot.userData.base = [new Color('#8fd3ff')]
      dot.userData.fixed = true
      dot.userData.point = true
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

/**
 * Primer impacto de un rayo, con el trazado estándar de three. El visor acelera los
 * clics con un índice espacial que se construye poco después de montar el modelo; si
 * estas comprobaciones lo usaran, darían un resultado al cargar y otro distinto después.
 */
function firstHit(ray: Raycaster, meshes: Mesh[]): Intersection | undefined {
  const hits: Intersection[] = []
  for (const mesh of meshes) Mesh.prototype.raycast.call(mesh, ray, hits)
  return hits.sort((a, b) => a.distance - b.distance)[0]
}

/** ¿Forma esta malla parte de `id`? Lo es si es esa parte o, cuando `id` es un hueso entero, una de sus zonas. */
const belongsTo = (mesh: Mesh, id: string) => mesh.userData.partId === id || (!mesh.userData.point && !!mesh.userData.partId && partBone(mesh.userData.partId) === id)

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
function CalloutLines({ object, parts, viewKey, viewDir, hideOccluded, hidden, lines, dots, badges, boxes, onLayout }: { object: Object3D; parts: string[]; viewKey: string; viewDir?: [number, number, number]; hideOccluded?: boolean; hidden?: string[]; lines: ElMap<SVGLineElement>; dots: ElMap<SVGCircleElement>; badges: ElMap<SVGGElement>; boxes: ElMap<HTMLElement>; onLayout: (l: Layout) => void }) {
  const anchors = useRef(new Map<string, Vector3>())
  const v = useMemo(() => new Vector3(), [])

  useEffect(() => {
    object.updateWorldMatrix(true, true)
    // Ejes de la pantalla en el espacio del modelo. Salen de la dirección de la vista elegida, no
    // de la cámara en ese instante: así una vista da siempre exactamente las mismas etiquetas.
    const toCamera = new Vector3(...(viewDir ?? [0, 0, 1])).normalize()
    const right = Math.abs(toCamera.y) > 0.95 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0).cross(toCamera).normalize()
    const up = toCamera.clone().cross(right)
    const onScreen = (p: Vector3) => new Vector3(p.dot(right), p.dot(up), 0)

    // Los huesos pares se reparten a ambos lados del plano medio (x). En una vista lateral se
    // señala el ejemplar cercano a la cámara; de frente, el del lado de la pantalla de su recuadro.
    const mid = centerOf(object).x
    const lateral = Math.abs(toCamera.x) > 0.5
    const sign = Math.sign(lateral ? toCamera.x : right.x) || 1
    const world = new Map<string, Vector3>()
    const otherSide = new Map<string, Mesh[]>()
    for (const id of parts) {
      const all = meshesOf(object).filter((m) => belongsTo(m, id))
      if (!all.length) continue
      const oneSide = all.filter((m) => (centerOf(m).x - mid) * sign >= 0)
      const paired = oneSide.length > 0 && oneSide.length < all.length
      // Un punto se ancla en su centro; una malla, en el vértice de su cara visible.
      world.set(id, all[0].userData.point ? all[0].getWorldPosition(new Vector3()) : surfaceAnchor(paired ? oneSide : all, toCamera))
      if (paired && !lateral) otherSide.set(id, all.filter((m) => !oneSide.includes(m)))
    }
    // Una parte se considera visible si, mirando desde la cámara hacia su punto de anclaje, lo primero que se ve es ella.
    if (hideOccluded) {
      for (const id of hidden ?? []) world.delete(id)
      const ray = new Raycaster()
      const meshes = meshesOf(object)
      const points = new Set(meshes.filter((m) => m.userData.point).map((m) => m.userData.partId as string))
      // Se mira en paralelo a la dirección de la vista, no desde la posición exacta de la cámara:
      // así el resultado es siempre el mismo para una vista, sea cual sea el tamaño del visor o el zoom.
      const span = new Box3().setFromObject(object).getSize(new Vector3()).length()
      for (const [id, anchor] of [...world]) {
        ray.set(anchor.clone().addScaledVector(toCamera, span * 2), toCamera.clone().negate())
        const hit = firstHit(ray, meshes)
        const reaches = hit && (belongsTo(hit.object as Mesh, id) || (!points.has(id) && hit.point.distanceTo(anchor) <= span * 0.004))
        if (hit && !reaches) world.delete(id)
      }
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
  }, [object, parts, viewKey, viewDir, hideOccluded, hidden, onLayout])

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
      // Una zona hereda la marca de su hueso (señalar «sacro» ilumina también sus zonas), pero un punto solo la suya.
      const find = <T,>(lookup: (id: string) => T | undefined) => (!id ? undefined : mesh.userData.point ? lookup(id) : stateOf(id, lookup))
      const state = find((p) => marks?.[p]) ?? (find((p) => (sel.has(p) ? true : undefined)) || (selectedMesh && mesh.name === selectedMesh) ? 'sel' : null)
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

function GlbModel({ def, only, half, wide, compact, view, focusPart, fitParts, flyTo, onFlyEnd, onBestView, ...rest }: SourceProps & { wide: boolean; compact: boolean; view?: ModelView; focusPart?: string; fitParts?: string[]; flyTo?: Props['flyTo']; onFlyEnd: () => void; onBestView: (id: string) => void }) {
  const { scene } = useGLTF(def.url)
  const object = useMemo(() => prepare(scene.clone(true), def, only, half), [scene, def, only, half])

  // Vista desde la que mejor se ve la parte de interés: aquella hacia la que apunta, de media, su superficie.
  useEffect(() => {
    if (!focusPart || !def.views || def.views.length < 2) return
    const facing = facingOf(object, meshesOf(object).filter((m) => m.userData.partId === focusPart))
    // Una pieza cerrada (un hueso entero) mira a todos lados por igual: se deja la vista inicial.
    if (!facing) return
    const best = def.views.map((v) => ({ id: v.id, score: new Vector3(...v.dir).normalize().dot(facing) })).sort((a, b) => b.score - a.score)[0]
    onBestView(best.id)
  }, [object, focusPart, def, onBestView])

  // Encuadre: se coloca la cámara de una vez, sin animación. Una animación de encuadre
  // aún en curso se cortaba al primer arrastre y el modelo daba un salto.
  const group = useRef<Group>(null)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const controls = useThree((s) => s.controls) as unknown as Controls | null
  const fitAll = useRef(1)
  useLayoutEffect(() => {
    if (!group.current) return
    group.current.updateWorldMatrix(true, true)
    const box = new Box3().setFromObject(group.current)
    if (fitParts?.length) {
      const near = new Box3()
      for (const mesh of meshesOf(group.current)) if (fitParts.includes(mesh.userData.partId)) near.expandByObject(mesh)
      if (!near.isEmpty()) box.copy(near).expandByScalar(near.getSize(new Vector3()).length() * 0.18)
    }
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
    fitAll.current = fit
    flight.current = null
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
  }, [object, wide, compact, view, fitParts, camera, controls])

  // ── Viaje de la cámara hasta una parte ──
  const flight = useRef<Flight | null>(null)
  useEffect(() => {
    if (!flyTo || !controls) return
    object.updateWorldMatrix(true, true)
    // La parte pedida o, si es un hueso que el modelo trae por zonas, todas sus zonas.
    let meshes = meshesOf(object).filter((m) => m.userData.partId === flyTo.part)
    if (!meshes.length) meshes = meshesOf(object).filter((m) => !m.userData.point && partBone(m.userData.partId ?? '') === flyTo.part)
    if (!meshes.length) return
    // De un hueso par se va al ejemplar más cercano a la cámara.
    const mid = centerOf(object).x
    const nearest = meshes.map((m) => ({ m, d: centerOf(m).distanceTo(camera.position) })).sort((a, b) => a.d - b.d)[0].m
    const side = Math.sign(centerOf(nearest).x - mid)
    const sameSide = meshes.filter((m) => Math.sign(centerOf(m).x - mid) === side)
    if (sameSide.length) meshes = sameSide

    const box = new Box3()
    for (const m of meshes) box.expandByObject(m)
    const toTarget = box.getCenter(new Vector3())
    const fromTarget = controls.target.clone()
    const fromDir = camera.position.clone().sub(fromTarget)
    const fromDistance = fromDir.length()
    fromDir.normalize()
    // Se gira solo si hace falta: si la parte ya se ve desde donde está la cámara, basta con acercarse.
    const facing = facingOf(object, meshes)
    const ray = new Raycaster(camera.position, toTarget.clone().sub(camera.position).normalize())
    const first = firstHit(ray, meshesOf(object))
    const inSight = !!first && meshes.includes(first.object as Mesh)
    const sideways = !!facing && facing.dot(fromDir) < 0.35
    let toDir = fromDir.clone()
    if (!inSight || sideways) {
      if (facing) toDir = facing
      else {
        // Pieza cerrada y tapada (un hueso entre otros): se prueba desde las vistas del modelo y los
        // ejes, empezando por la más parecida a la actual, hasta dar con una que la vea despejada.
        const all = meshesOf(object)
        const far = fitAll.current * 3
        const candidates = [...(def.views ?? []).map((v) => v.dir), [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0.05], [0, -1, 0.05]]
          .map((d) => new Vector3(...(d as [number, number, number])).normalize())
          .sort((a, b) => b.dot(fromDir) - a.dot(fromDir))
        const clear = candidates.find((d) => {
          ray.set(toTarget.clone().addScaledVector(d, far), d.clone().negate())
          const hit = firstHit(ray, all)
          return !!hit && meshes.includes(hit.object as Mesh)
        })
        if (clear) toDir = clear
      }
    }
    if (Math.abs(toDir.y) > 0.97) toDir.setZ(toDir.z + 0.08).normalize() // evita mirar justo desde el eje vertical
    // Acercamiento moderado: la parte ocupa buena parte del encuadre sin perder el contexto.
    const radius = Math.max(box.getSize(new Vector3()).length() / 2, fitAll.current * 0.02)
    const tan = Math.tan((camera.fov * Math.PI) / 360)
    const toDistance = Math.min(fitAll.current, Math.max((radius / tan) * (wide ? 3.2 : 2.2), fitAll.current * 0.4))
    flight.current = { t: 0, fromTarget, toTarget, fromDir, turn: new Quaternion().setFromUnitVectors(fromDir, toDir), fromDistance, toDistance }
    invalidate()
    // Si el usuario empieza a mover el modelo, manda él: se cancela el viaje.
    const cancel = () => (flight.current = null)
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [flyTo, object, def, camera, controls, wide])

  useFrame((_, delta) => {
    const f = flight.current
    if (!f || !controls) return
    f.t = Math.min(1, f.t + Math.min(delta, 0.05) / 0.85)
    const k = f.t < 0.5 ? 4 * f.t ** 3 : 1 - (-2 * f.t + 2) ** 3 / 2 // suave al salir y al llegar
    const target = f.fromTarget.clone().lerp(f.toTarget, k)
    const dir = f.fromDir.clone().applyQuaternion(new Quaternion().slerp(f.turn, k))
    camera.position.copy(target).addScaledVector(dir, f.fromDistance + (f.toDistance - f.fromDistance) * k)
    camera.lookAt(target)
    controls.target.copy(target)
    controls.update()
    if (f.t >= 1) {
      flight.current = null
      onFlyEnd()
    } else invalidate()
  })

  return (
    <group ref={group} rotation={def.rotation ?? [0, 0, 0]}>
      <Bvh firstHitOnly>
        <Pickable object={object} {...rest} />
      </Bvh>
    </group>
  )
}

interface Controls {
  target: Vector3
  update: () => void
  addEventListener: (type: 'start', listener: () => void) => void
  removeEventListener: (type: 'start', listener: () => void) => void
}

interface Flight {
  t: number
  fromTarget: Vector3
  toTarget: Vector3
  fromDir: Vector3
  turn: Quaternion
  fromDistance: number
  toDistance: number
}

/**
 * Dirección hacia la que mira, de media, la superficie de unas mallas. Un punto usa la
 * normal del hueso justo debajo de él. Devuelve null si la pieza es cerrada y mira a
 * todos lados por igual (un hueso entero).
 */
function facingOf(root: Object3D, meshes: Mesh[]): Vector3 | null {
  root.updateWorldMatrix(true, true)
  const facing = new Vector3()
  const n = new Vector3()
  const p = new Vector3()
  let samples = 0
  const solid = meshesOf(root).filter((m) => !m.userData.point)
  for (const mesh of meshes) {
    if (mesh.userData.point) {
      const at = mesh.getWorldPosition(new Vector3())
      let best = Infinity
      const normalAt = new Vector3()
      for (const s of solid) {
        const position = s.geometry.attributes.position
        const normal = s.geometry.attributes.normal
        if (!normal) continue
        const step = Math.max(1, Math.floor(position.count / 6000))
        for (let i = 0; i < position.count; i += step) {
          const d = p.fromBufferAttribute(position, i).applyMatrix4(s.matrixWorld).distanceToSquared(at)
          if (d < best) {
            best = d
            normalAt.fromBufferAttribute(normal, i).transformDirection(s.matrixWorld)
          }
        }
      }
      facing.add(normalAt.multiplyScalar(200))
      samples += 200
      continue
    }
    const normal = mesh.geometry.attributes.normal
    const index = mesh.geometry.index
    if (!normal) continue
    // Se recorren los vértices que la malla usa de verdad (una zona separada comparte atributos con su origen).
    const count = index ? index.count : normal.count
    const step = Math.max(1, Math.floor(count / 1500))
    for (let i = 0; i < count; i += step, samples++) facing.add(n.fromBufferAttribute(normal, index ? index.getX(i) : i).transformDirection(mesh.matrixWorld))
  }
  if (!samples || facing.length() / samples < 0.3) return null
  return facing.normalize()
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

export function ModelViewer({ model, labels = true, className, onPick, onReady, only, half, view: initialView, onViewChange, focusPart, fitParts, flyTo, callouts, renderCallout, activeCallout, hideOccludedCallouts, ...rest }: Props) {
  const def = typeof model === 'string' ? models[model] : model
  const [hovered, setHovered] = useState<string | null>(null)
  const [resets, setResets] = useState(0)
  const [viewId, setViewId] = useState(initialView)
  const activeView = def.views?.find((v) => v.id === viewId) ?? def.views?.[0]
  // La vista sugerida por `focusPart` solo se aplica si aún no se ha elegido ninguna.
  const onBestView = useCallback((id: string) => setViewId((current) => current ?? id), [])
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
  const onFlyEnd = useCallback(() => {}, [])
  const stableFit = useMemo(() => fitParts, [fitParts?.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

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
      ? (object) => <CalloutLines object={object} parts={stableCallouts} viewKey={`${activeView?.id}:${resets}`} viewDir={activeView?.dir} hideOccluded={hideOccludedCallouts} hidden={activeView?.hide} lines={lines} dots={dots} badges={badges} boxes={boxes} onLayout={setLayout} />
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
            <GlbModel {...shared} wide={!!callouts && !compact} compact={compact} view={activeView} focusPart={focusPart} fitParts={stableFit} flyTo={flyTo} onFlyEnd={onFlyEnd} onBestView={onBestView} />
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
            {numbered.map((id) => (
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
                // Las columnas terminan por encima de los botones de vista, y se aprietan si hay muchas etiquetas.
                'pointer-events-none absolute top-14 flex w-[31%] max-w-52 flex-col justify-center xl:max-w-60',
                def.views && def.views.length > 1 ? 'bottom-14' : 'bottom-4',
                layout[side].length > 8 ? 'gap-1' : 'gap-2.5',
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
                setTapped(null)
                onViewChange?.()
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
        <span className="pointer-events-none absolute top-3 left-3 max-w-[calc(100%-11rem)] truncate rounded-lg bg-black/65 px-3 py-2 text-sm font-semibold whitespace-nowrap text-white">
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
