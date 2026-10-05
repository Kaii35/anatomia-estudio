import type { RegionId } from '../types'
import { boneById } from './bones'
import type { ModelDef } from './models'

/** Estructuras seleccionables en los modelos que no son un hueso individual. */
const structures: Record<string, { name: string; region?: RegionId }> = {
  craneo: { name: 'Cráneo', region: 'craneo' },
  columna: { name: 'Columna vertebral' },
  torax: { name: 'Caja torácica' },
  carpo: { name: 'Carpo', region: 'mano' },
  metacarpo: { name: 'Metacarpo', region: 'mano' },
  'falanges-mano': { name: 'Falanges de la mano', region: 'mano' },
  tarso: { name: 'Tarso', region: 'pie' },
  metatarso: { name: 'Metatarso', region: 'pie' },
  'falanges-pie': { name: 'Falanges del pie', region: 'pie' },
}

export function partName(id: string, model?: ModelDef): string {
  return boneById[id]?.name ?? structures[id]?.name ?? model?.hotspots?.find((h) => h.id === id)?.label ?? id
}

export function partRegion(id: string, model?: ModelDef): RegionId | undefined {
  return boneById[id]?.region ?? structures[id]?.region ?? model?.hotspots?.find((h) => h.id === id)?.region
}
