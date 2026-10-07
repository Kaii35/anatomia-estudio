/**
 * Aligera los modelos 3D:  npm run modelos
 *
 * Lee los .glb de modelos-originales/ y escribe en public/models/ una versión con
 * menos triángulos y comprimida (meshopt). Conserva los nombres de las mallas y los
 * materiales, que es lo que la app usa para saber qué hueso o zona es cada pieza.
 * Después regenera src/data/tints.json, la tabla de colores por pieza.
 *
 * Para añadir o cambiar un modelo: deja el .glb original en modelos-originales/,
 * añádelo a PUBLICAR si es nuevo y vuelve a ejecutar el comando.
 */
import { copyFileSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { meshopt, prune, simplify, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

const SRC = 'modelos-originales'
const OUT = 'public/models'

/**
 * Originales que se publican. El resto de la carpeta se queda fuera: son vistas
 * repetidas de la misma geometría (humero-posterior, tibia-cara-interna, pelvis-anterior…),
 * que la app resuelve con vistas de cámara, o versiones antiguas de un modelo.
 */
const PUBLICAR = [
  // cráneo
  'craneo-frontal.glb',
  'craneo-sagital.glb',
  'craneo-base.glb',
  'craneo-inferior.glb',
  // miembro superior
  'hombro.glb',
  'esqueleto-escapula.glb',
  'hombro-anterior.glb',
  'hombro-vista-anterior.glb',
  'esqueleto-superior.glb',
  'brazo-coloreado.glb',
  'humero-anterior.glb',
  'radio-y-cubito-anterior.glb',
  'esqueleto-mano.glb',
  // pelvis y miembro inferior
  'pelvis.glb',
  'hueso-coxal-lateral.glb',
  'articulacion-de-la-cadera-anterior.glb',
  'cadera-articulacion.glb',
  'pierna.glb',
  'femur-tibia-y-perone-anterior.glb',
  'femur-anterior.glb',
  'tibia-cara-anterior.glb',
  'perone-anterior.glb',
  'esqueleto-pie.glb',
  // tronco
  'esqueleto-columna.glb',
  'esqueleto-torax.glb',
]

/** Fracción de triángulos que se conserva. Los cráneos vienen con mucho más detalle y admiten más recorte. */
const ratioFor = (file) => (file.startsWith('craneo-') ? 0.35 : 0.5)

/**
 * Colores para piezas que ningún archivo trae coloreadas (zonas del sacro, discos y
 * cartílagos articulares). Las claves son el nombre de la malla sin el lado.
 */
const TINTES_PROPIOS = {
  sacrum_ala: '#5fc4bd',
  sacrum_promontory: '#e8925a',
  sacrum_superior_articular_process: '#8fb3dc',
  sacrum_sacral_canal: '#6b4f9a',
  sacrum_sacral_hiatus: '#a8433c',
  sacrum_median_crest: '#e07f6c',
  sacrum_intermediate_crests: '#e2a35c',
  sacrum_lateral_crests: '#c98bb8',
  sacrum_anterior_foramina: '#4d7fb8',
  sacrum_posterior_foramina: '#4d7fb8',
  sacrum_transverse_lines: '#d9c06a',
  sacrum_auricular_surface: '#c98bb8',
  sternoclavicular_disc: '#9fb4cf',
  femoral_head_cartilage: '#9fb4cf',
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)
const mb = (path) => (statSync(path).size / 1e6).toFixed(1)
const k = (n) => `${Math.round(n / 1000)}k`

const solo = process.argv[2] // npm run modelos -- <texto>: solo los archivos cuyo nombre lo contenga
for (const file of PUBLICAR.filter((f) => !solo || f.includes(solo))) {
  const doc = await io.read(`${SRC}/${file}`)
  const before = triangles(doc)
  // Un archivo que ya viene comprimido (no es un original) se publica tal cual:
  // volver a recortarlo le quitaría detalle en cada ejecución.
  if (doc.getRoot().listExtensionsUsed().some((e) => e.extensionName === 'EXT_meshopt_compression')) {
    copyFileSync(`${SRC}/${file}`, `${OUT}/${file}`)
    console.log(`${file.padEnd(40)} ${k(before).padStart(6)} (ya optimizado: se copia sin cambios)`)
    continue
  }
  await doc.transform(
    prune({ keepAttributes: false }), // las UV no se usan: no hay texturas
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: ratioFor(file), error: 0.001 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(`${OUT}/${file}`, doc)
  console.log(`${file.padEnd(40)} ${k(before).padStart(6)} → ${k(triangles(doc)).padStart(5)} triángulos   ${mb(`${SRC}/${file}`).padStart(5)} → ${mb(`${OUT}/${file}`).padStart(4)} MB`)
}

// ── Tabla de colores ──
// Muchos modelos vienen en un solo tono, pero otros archivos traen esas mismas piezas
// coloreadas (material «tint_…»). Se reúne un color por nombre de malla, sin el lado,
// para que el modo «Colores» pinte igual cualquier modelo que contenga esa pieza.
const sinLado = (name) => name.replace(/_[LR](?=_|$)/, '')
const aHex = ([r, g, b]) => {
  const srgb = (c) => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
  return '#' + [r, g, b].map((c) => srgb(c).toString(16).padStart(2, '0')).join('')
}
const tintes = {}
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.glb'))) {
  const bytes = readFileSync(`${SRC}/${file}`)
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'))
  for (const node of json.nodes) {
    if (node.mesh === undefined) continue
    const material = json.materials[json.meshes[node.mesh].primitives[0].material]
    if (!material?.name?.startsWith('tint_')) continue
    // Los archivos de una sola región mandan sobre los generales: se procesan los últimos (orden inverso de tamaño).
    tintes[sinLado(node.name)] ??= { hex: aHex(material.pbrMetallicRoughness.baseColorFactor), size: bytes.length }
    if (bytes.length < tintes[sinLado(node.name)].size) tintes[sinLado(node.name)] = { hex: aHex(material.pbrMetallicRoughness.baseColorFactor), size: bytes.length }
  }
}
const tabla = Object.fromEntries(
  Object.entries({ ...Object.fromEntries(Object.entries(tintes).map(([name, t]) => [name, t.hex])), ...TINTES_PROPIOS }).sort(([a], [b]) => a.localeCompare(b)),
)
writeFileSync('src/data/tints.json', JSON.stringify(tabla, null, 2) + '\n')
console.log(`\nsrc/data/tints.json: ${Object.keys(tabla).length} colores`)
