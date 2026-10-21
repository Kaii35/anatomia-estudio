/**
 * Aligera los modelos de la presentación: npm run modelos:presentacion
 *
 * Lee los .glb de public/docs/models/ (la presentación v2) y escribe en public/presentacion/models/
 * versiones con menos triángulos y comprimidas con meshopt (los modelos usan colores de material, sin texturas).
 * Así la presentación carga y gira con fluidez en un celular.
 */
import { mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, resample, simplify, weld } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'

const SRC = 'public/docs/models'
const OUT = 'public/presentacion/models'
/** Proporción de triángulos que se conservan. Los modelos con más detalle se reducen más. */
const RATIO = 0.3

mkdirSync(OUT, { recursive: true })
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.glb'))) {
  const antes = statSync(join(SRC, file)).size
  const doc = await io.read(join(SRC, file))
  await doc.transform(
    dedup(),
    prune(),
    resample(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.001 }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
  )
  await io.write(join(OUT, file), doc)
  const despues = statSync(join(OUT, file)).size
  console.log(`${file}: ${(antes / 1048576).toFixed(1)} MB → ${(despues / 1048576).toFixed(1)} MB`)
}
