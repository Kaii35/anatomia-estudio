import type { Group } from 'three'
import type { RegionId } from '../types'
import { buildFoot, buildHand, buildSkeleton, partsOf } from '../three/procedural'

/**
 * REGISTRO DE MODELOS 3D
 *
 * Para añadir un modelo real:
 *  1. Copia el archivo .glb en  public/models/
 *  2. Ábrelo en la página «Modelos» de la app (/#/modelos) para ver cómo se
 *     llaman sus mallas y a qué hueso se asigna cada una automáticamente.
 *  3. Añade aquí una entrada con `source: { kind: 'glb', url: 'models/archivo.glb' }`,
 *     la lista `parts` (ids de data/bones.ts presentes en el modelo) y, si alguna
 *     malla no se reconoce sola, su nombre en `meshMap`.
 *  4. Pon el id del modelo en `models` de la región correspondiente (data/regions.ts).
 *
 * Las preguntas de «selecciona en el modelo» se generan solas a partir de `parts`.
 */

/** Punto marcado sobre un modelo para accidentes óseos que no son una malla aparte (p. ej. el acromion). */
export interface Hotspot {
  id: string
  label: string
  region: RegionId
  /** Coordenadas locales del modelo; la página «Modelos» las muestra al hacer clic. */
  position: [number, number, number]
}

export interface ModelDef {
  id: string
  title: string
  source: { kind: 'glb'; url: string } | { kind: 'procedural'; build: () => Group }
  /** Partes seleccionables: ids de huesos (data/bones.ts) o de estructuras (data/parts.ts). */
  parts: string[]
  /** Nombre exacto de malla → id de parte. Tiene prioridad sobre el emparejado automático. */
  meshMap?: Record<string, string>
  hotspots?: Hotspot[]
  /** Rotación en radianes para modelos exportados con otro eje vertical. */
  rotation?: [number, number, number]
  /** Modelo provisional de primitivas, no anatómico. */
  schematic?: boolean
}

const procedural = (id: string, title: string, build: () => Group): ModelDef => ({
  id,
  title,
  source: { kind: 'procedural', build },
  parts: partsOf(build()),
  schematic: true,
})

export const models: Record<string, ModelDef> = {
  esqueleto: procedural('esqueleto', 'Esqueleto', buildSkeleton),
  mano: procedural('mano', 'Mano', buildHand),
  pie: procedural('pie', 'Pie', buildFoot),
}
