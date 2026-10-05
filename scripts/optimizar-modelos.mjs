/**
 * Aligera los modelos 3D:  npm run modelos
 *
 * Lee cada .glb de modelos-originales/ y escribe en public/models/ una versión con
 * menos triángulos y comprimida (meshopt). Conserva los nombres de las mallas y los
 * materiales, que es lo que la app usa para saber qué hueso es cada pieza.
 *
 * Para añadir o cambiar un modelo: deja el .glb original en modelos-originales/ y
 * vuelve a ejecutar el comando.
 */
import { readdirSync, statSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { meshopt, prune, simplify, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

const SRC = 'modelos-originales'
const OUT = 'public/models'

/**
 * Originales que no se publican: craneo-lateral y craneo-orbita tienen la misma geometría que
 * craneo-frontal (solo cambia la cámara, que la app resuelve con vistas); esqueleto-craneo es
 * el cráneo antiguo, con menos huesos; y esqueleto-completo se retiró por rendimiento.
 */
const SKIP = new Set(['craneo-lateral.glb', 'craneo-orbita.glb', 'esqueleto-craneo.glb', 'esqueleto-completo.glb'])

/** Fracción de triángulos que se conserva. Los cráneos vienen con mucho más detalle y admiten más recorte. */
const ratioFor = (file) => (file.startsWith('craneo-') ? 0.35 : 0.5)

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)
const mb = (path) => (statSync(path).size / 1e6).toFixed(1)

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.glb') && !SKIP.has(f))) {
  const doc = await io.read(`${SRC}/${file}`)
  const before = triangles(doc)
  await doc.transform(
    prune({ keepAttributes: false }), // las UV no se usan: no hay texturas
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: ratioFor(file), error: 0.001 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(`${OUT}/${file}`, doc)
  const k = (n) => `${Math.round(n / 1000)}k`
  console.log(`${file.padEnd(26)} ${k(before).padStart(6)} → ${k(triangles(doc)).padStart(5)} triángulos   ${mb(`${SRC}/${file}`).padStart(5)} → ${mb(`${OUT}/${file}`).padStart(4)} MB`)
}
