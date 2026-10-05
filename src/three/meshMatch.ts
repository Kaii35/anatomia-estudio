import { bones } from '../data/bones'
import type { ModelDef } from '../data/models'

/** «Left_Femur.001» → «left femur 001» */
export function normalizeMeshName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Devuelve una función nombre de malla → id de parte. Primero mira `meshMap`;
 * si no, busca el alias más largo (español, inglés o latín) contenido en el nombre.
 * Si el modelo declara `parts`, solo se consideran esos huesos.
 */
export function buildMatcher(def: ModelDef): (meshName: string) => string | null {
  const allowed = def.parts.length ? new Set(def.parts) : null
  const aliases: [string, string][] = []
  for (const b of bones) {
    if (allowed && !allowed.has(b.id)) continue
    for (const a of [b.name, ...(b.aliases ?? []), ...(b.mesh ?? [])]) aliases.push([normalizeMeshName(a), b.id])
  }
  aliases.sort((x, y) => y[0].length - x[0].length)

  const explicit = new Map<string, string>()
  for (const [mesh, part] of Object.entries(def.meshMap ?? {})) {
    explicit.set(mesh, part)
    explicit.set(normalizeMeshName(mesh), part)
  }

  return (meshName) => {
    if (!meshName) return null
    const n = normalizeMeshName(meshName)
    const direct = explicit.get(meshName) ?? explicit.get(n)
    if (direct) return direct
    const padded = ` ${n} `
    return aliases.find(([alias]) => padded.includes(` ${alias} `))?.[1] ?? null
  }
}
