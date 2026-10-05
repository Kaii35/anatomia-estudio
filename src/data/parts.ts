import type { RegionId } from '../types'
import { boneById } from './bones'
import type { ModelDef } from './models'

interface Structure {
  name: string
  /** Con región, la estructura genera preguntas en los modelos que la declaren en `parts`. */
  region?: RegionId
  /** Hueso del que forma parte: al hacer clic se abre la ficha de ese hueso. */
  bone?: string
  aliases?: string[]
}

/** Partes seleccionables en los modelos que no son un hueso con ficha propia. */
const structures: Record<string, Structure> = {
  'escapula-coracoides': { name: 'Apófisis coracoides', region: 'cintura-escapular', bone: 'escapula', aliases: ['coracoides'] },
  'escapula-acromion': { name: 'Acromion', region: 'cintura-escapular', bone: 'escapula' },
  'escapula-glenoidea': { name: 'Cavidad glenoidea', region: 'cintura-escapular', bone: 'escapula', aliases: ['glenoidea', 'glenoides', 'fosa glenoidea'] },
  'escapula-supraespinosa': { name: 'Fosa supraespinosa', region: 'cintura-escapular', bone: 'escapula', aliases: ['supraespinosa'] },
  'escapula-infraespinosa': { name: 'Fosa infraespinosa', region: 'cintura-escapular', bone: 'escapula', aliases: ['infraespinosa'] },
  'escapula-espina': { name: 'Espina de la escápula', region: 'cintura-escapular', bone: 'escapula', aliases: ['espina escapular'] },
  ilion: { name: 'Ilion', region: 'pelvis', bone: 'coxal', aliases: ['ileon'] },
  isquion: { name: 'Isquion', region: 'pelvis', bone: 'coxal' },
  pubis: { name: 'Pubis', region: 'pelvis', bone: 'coxal' },
  'sinfisis-pubica': { name: 'Sínfisis del pubis', region: 'pelvis', bone: 'coxal', aliases: ['sínfisis púbica'] },
  'cartilagos-costales': { name: 'Cartílagos costales', region: 'tronco', aliases: ['cartílago costal'] },
  discos: { name: 'Discos intervertebrales' },
  'disco-acromioclavicular': { name: 'Disco acromioclavicular' },
  dientes: { name: 'Dientes' },
  'sesamoideos-mano': { name: 'Huesos sesamoideos' },
  'sesamoideos-pie': { name: 'Huesos sesamoideos' },
}

export function partName(id: string, model?: ModelDef): string {
  return boneById[id]?.name ?? structures[id]?.name ?? model?.hotspots?.find((h) => h.id === id)?.label ?? id
}

/**
 * Respuestas escritas válidas para una parte. Además del nombre y sus sinónimos se
 * acepta la forma corta sin el dedo o la región («falange proximal», «cuerpo»),
 * porque sobre el modelo ya se ve de cuál se trata.
 */
export function partAccept(id: string, model?: ModelDef): string[] {
  const name = partName(id, model)
  const short = name.replace(/^(Primer|Segundo|Tercer|Cuarto|Quinto) /, '').split(/ del? /)[0]
  return [...new Set([name, ...(boneById[id]?.aliases ?? structures[id]?.aliases ?? []), short])]
}

export function partRegion(id: string, model?: ModelDef): RegionId | undefined {
  return boneById[id]?.region ?? structures[id]?.region ?? model?.hotspots?.find((h) => h.id === id)?.region
}

/** Id del hueso con ficha al que pertenece una parte (ella misma, si es un hueso). */
export function partBone(id: string): string | undefined {
  return boneById[id] ? id : structures[id]?.bone
}

/** Un hueso y las porciones suyas que algunos modelos traen como mallas separadas. */
export function partsOfBone(boneId: string): string[] {
  return [boneId, ...Object.keys(structures).filter((s) => structures[s].bone === boneId)]
}
