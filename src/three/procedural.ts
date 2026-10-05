import { CapsuleGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'

/**
 * Modelos esquemáticos hechos con primitivas. Sirven de sustituto mientras no
 * haya modelos reales (.glb): cada malla lleva su `partId`, igual que las de un
 * modelo real ya mapeado, así que todo el sistema de selección funciona igual.
 */

type P3 = [number, number, number]

const UP = new Vector3(0, 1, 0)
const material = () => new MeshStandardMaterial({ color: '#e9dcc3', roughness: 0.6, metalness: 0.02 })

function tag(mesh: Mesh, part: string): Mesh {
  mesh.name = part
  mesh.userData.partId = part
  return mesh
}

function capsule(part: string, a: Vector3, b: Vector3, r: number): Mesh {
  const mesh = new Mesh(new CapsuleGeometry(r, a.distanceTo(b), 6, 16), material())
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize())
  return tag(mesh, part)
}

function blob(part: string, p: P3, s: P3): Mesh {
  const mesh = new Mesh(new SphereGeometry(1, 28, 18), material())
  mesh.position.set(...p)
  mesh.scale.set(...s)
  return tag(mesh, part)
}

/** Hueso largo con epífisis abultadas. */
function longBone(g: Group, part: string, a: P3, b: P3, r: number, ends: [number, number]) {
  const va = new Vector3(...a)
  const vb = new Vector3(...b)
  g.add(capsule(part, va, vb, r), blob(part, a, [ends[0], ends[0], ends[0]]), blob(part, b, [ends[1], ends[1], ends[1]]))
}

interface Ray {
  a: [number, number]
  b: [number, number]
  r: number
  z?: number
}

/** Un «rayo»: metacarpiano/metatarsiano seguido de sus falanges, alineadas en la misma dirección. */
function addRays(g: Group, rays: Ray[], ids: [string, string, string, string], lengths: [number[], number[], number[]]) {
  rays.forEach((ray, i) => {
    const z = ray.z ?? 0
    const a = new Vector3(ray.a[0], ray.a[1], z)
    const b = new Vector3(ray.b[0], ray.b[1], z)
    const dir = b.clone().sub(a).normalize()
    g.add(capsule(`${ids[0]}-${i + 1}`, a, b, ray.r))
    let end = b
    let prevR = ray.r
    lengths.forEach((seg, s) => {
      const len = seg[i]
      if (!len) return
      const r = prevR * 0.86
      const start = end.clone().addScaledVector(dir, prevR + r + 0.1)
      end = start.clone().addScaledVector(dir, len)
      g.add(capsule(`${ids[s + 1]}-${i + 1}`, start, end, r))
      prevR = r
    })
  })
}

export function buildHand(): Group {
  const g = new Group()
  g.add(
    blob('escafoides', [1.15, 0.65, 0], [0.62, 0.5, 0.4]),
    blob('semilunar', [0.05, 0.6, 0], [0.5, 0.48, 0.4]),
    blob('piramidal', [-0.95, 0.7, 0], [0.46, 0.45, 0.38]),
    blob('pisiforme', [-1.15, 0.6, 0.55], [0.28, 0.28, 0.26]),
    blob('trapecio', [1.78, 1.55, 0], [0.48, 0.45, 0.4]),
    blob('trapezoide', [0.9, 1.7, 0], [0.38, 0.4, 0.38]),
    blob('grande', [0, 1.75, 0], [0.46, 0.62, 0.42]),
    blob('ganchoso', [-0.95, 1.75, 0], [0.48, 0.5, 0.4]),
  )
  addRays(
    g,
    [
      { a: [2.25, 2.15], b: [3.3, 3.7], r: 0.26 },
      { a: [0.95, 2.6], b: [1.35, 5.9], r: 0.24 },
      { a: [0, 2.7], b: [0.1, 6.2], r: 0.24 },
      { a: [-0.9, 2.6], b: [-1.05, 5.7], r: 0.22 },
      { a: [-1.7, 2.5], b: [-2.05, 5.2], r: 0.21 },
    ],
    ['mc', 'fpm', 'fmm', 'fdm'],
    [
      [1.9, 2.6, 2.9, 2.7, 2.1],
      [0, 1.5, 1.9, 1.7, 1.2],
      [1.4, 1.0, 1.1, 1.0, 0.9],
    ],
  )
  return g
}

export function buildFoot(): Group {
  const g = new Group()
  g.add(
    blob('calcaneo', [-0.45, 0.2, 0], [1.0, 1.7, 0.8]),
    blob('astragalo', [0.35, 1.7, 0.75], [0.95, 1.15, 0.6]),
    blob('navicular', [0.85, 3.15, 0.45], [0.95, 0.42, 0.55]),
    blob('cuboides', [-1.15, 3.0, 0.1], [0.75, 0.85, 0.5]),
    blob('cuneiforme-medial', [1.55, 4.15, 0.3], [0.42, 0.6, 0.5]),
    blob('cuneiforme-intermedio', [0.72, 4.1, 0.4], [0.36, 0.5, 0.45]),
    blob('cuneiforme-lateral', [-0.05, 4.15, 0.3], [0.38, 0.58, 0.45]),
  )
  addRays(
    g,
    [
      { a: [1.6, 5.1], b: [1.85, 8.0], r: 0.3, z: 0.2 },
      { a: [0.72, 4.95], b: [0.85, 8.5], r: 0.2, z: 0.25 },
      { a: [-0.05, 5.05], b: [-0.1, 8.3], r: 0.19, z: 0.2 },
      { a: [-0.95, 4.2], b: [-1.15, 7.9], r: 0.19, z: 0.1 },
      { a: [-1.65, 4.1], b: [-2.1, 7.4], r: 0.19, z: 0.05 },
    ],
    ['mt', 'fpp', 'fmp', 'fdp'],
    [
      [1.3, 1.0, 0.95, 0.9, 0.8],
      [0, 0.45, 0.4, 0.35, 0.3],
      [0.9, 0.4, 0.4, 0.35, 0.35],
    ],
  )
  return g
}

export function buildSkeleton(): Group {
  const g = new Group()
  g.add(
    blob('craneo', [0, 16.2, 0], [1.0, 1.2, 1.15]),
    blob('mandibula', [0, 15.1, 0.5], [0.7, 0.28, 0.6]),
    capsule('columna', new Vector3(0, 14.6, -0.35), new Vector3(0, 9.8, -0.35), 0.28),
    blob('torax', [0, 12.5, 0.1], [1.7, 1.8, 1.05]),
    blob('sacro', [0, 9.1, -0.5], [0.5, 0.7, 0.3]),
  )
  for (const s of [1, -1]) {
    const escapula = tag(new Mesh(new ConeGeometry(0.95, 1.9, 3), material()), 'escapula')
    escapula.position.set(s * 1.55, 13.2, -1.2)
    escapula.rotation.x = Math.PI
    escapula.scale.z = 0.14
    g.add(
      escapula,
      capsule('clavicula', new Vector3(s * 0.25, 14.3, 0.75), new Vector3(s * 2.1, 14.5, 0.25), 0.13),
      capsule('radio', new Vector3(s * 2.9, 10.55, 0.05), new Vector3(s * 3.2, 8.05, 0.1), 0.13),
      capsule('cubito', new Vector3(s * 2.55, 10.55, -0.05), new Vector3(s * 2.8, 8.05, 0), 0.12),
      blob('carpo', [s * 3.02, 7.62, 0.05], [0.38, 0.2, 0.15]),
      blob('metacarpo', [s * 3.07, 7.1, 0.05], [0.4, 0.32, 0.12]),
      blob('falanges-mano', [s * 3.12, 6.32, 0.05], [0.38, 0.45, 0.1]),
      blob('coxal', [s * 1.0, 9.3, 0], [0.95, 1.0, 0.6]),
      blob('rotula', [s * 0.9, 4.72, 0.45], [0.22, 0.24, 0.14]),
      capsule('perone', new Vector3(s * 1.25, 4.3, -0.1), new Vector3(s * 1.12, 0.95, -0.1), 0.1),
      blob('tarso', [s * 0.85, 0.5, 0.1], [0.4, 0.32, 0.6]),
      blob('metatarso', [s * 0.85, 0.33, 0.98], [0.4, 0.17, 0.4]),
      blob('falanges-pie', [s * 0.85, 0.24, 1.58], [0.4, 0.11, 0.24]),
    )
    longBone(g, 'humero', [s * 2.4, 14.15, 0], [s * 2.72, 10.95, 0], 0.19, [0.34, 0.3])
    longBone(g, 'femur', [s * 1.35, 8.55, 0], [s * 0.9, 4.95, 0.1], 0.23, [0.36, 0.4])
    longBone(g, 'tibia', [s * 0.78, 4.4, 0.05], [s * 0.72, 1.0, 0], 0.18, [0.36, 0.24])
  }
  return g
}

/** Ids de parte presentes en un modelo esquemático, sin repetir. */
export function partsOf(root: Group): string[] {
  const ids = new Set<string>()
  root.traverse((o) => {
    if (typeof o.userData.partId === 'string') ids.add(o.userData.partId)
  })
  return [...ids]
}
