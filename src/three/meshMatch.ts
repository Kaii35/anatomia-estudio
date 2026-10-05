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

const FINGER: Record<string, number> = { thumb: 1, index: 2, middle: 3, ring: 4, little: 5 }
const SEGMENT: Record<string, string> = { proximal: 'p', middle: 'm', distal: 'd' }
const CUNEIFORM: Record<string, string> = { medial: 'medial', intermediate: 'intermedio', lateral: 'lateral' }
const SCAPULA: Record<string, string> = { coracoid: 'coracoides', acromion: 'acromion', glenoid: 'glenoidea', spine: 'espina', supraspinous: 'supraespinosa', infraspinous: 'infraespinosa' }
const STERNUM: Record<string, string> = { manubrium: 'esternon-manubrio', body: 'esternon-cuerpo', xiphoid: 'xifoides' }
const PELVIS: Record<string, string> = { ilium: 'ilion', ischium: 'isquion', pubis: 'pubis' }
const SPINE: Record<string, string> = { C: 'cervicales', T: 'toracicas', L: 'lumbares' }

/**
 * Reglas para la nomenclatura de los modelos del proyecto (metacarpal_2_index_L,
 * toe3_middle_phalanx_L, rib_R_08…). Devuelve `null` para mallas que no son una
 * parte (cavidades) y `undefined` si ninguna regla aplica.
 */
function byConvention(name: string): string | null | undefined {
  let m: RegExpMatchArray | null
  if (/_cavity/.test(name)) return null
  if (name.startsWith('tooth_')) return 'dientes'
  if ((m = name.match(/^metacarpal_(\d)/))) return `mc-${m[1]}`
  if ((m = name.match(/^metatarsal_(\d)/))) return `mt-${m[1]}`
  if ((m = name.match(/^(thumb|index|middle|ring|little)_(proximal|middle|distal)_phalanx/))) return `f${SEGMENT[m[2]]}m-${FINGER[m[1]]}`
  if ((m = name.match(/^(?:hallux|toe(\d))_(proximal|middle|distal)_phalanx/))) return `f${SEGMENT[m[2]]}p-${m[1] ?? 1}`
  if ((m = name.match(/^cuneiform_(medial|intermediate|lateral)/))) return `cuneiforme-${CUNEIFORM[m[1]]}`
  if (name.startsWith('sesamoid_thumb')) return 'sesamoideos-mano'
  if (name.startsWith('sesamoid_')) return 'sesamoideos-pie'
  if ((m = name.match(/^scapula_[LR]_([a-z]+)/))) return `escapula-${SCAPULA[m[1]]}`
  if ((m = name.match(/^(ilium|ischium|pubis)_[LR]/))) return PELVIS[m[1]]
  if (name === 'pubic_symphysis') return 'sinfisis-pubica'
  if (name.startsWith('sacroiliac_joint')) return 'articulacion-sacroiliaca'
  if ((m = name.match(/^rib_[LR]_(\d+)/))) return +m[1] <= 7 ? 'costillas-verdaderas' : +m[1] <= 10 ? 'costillas-falsas' : 'costillas-flotantes'
  if (name.startsWith('cartilage_')) return 'cartilagos-costales'
  if (name.startsWith('disc_')) return 'discos'
  if (name.startsWith('acromioclavicular_disc')) return 'disco-acromioclavicular'
  if ((m = name.match(/^sternum_([a-z]+)/))) return STERNUM[m[1]]
  if ((m = name.match(/^([CTL])\d\d$/))) return SPINE[m[1]]
  return undefined
}

/** Lo que distingue a una malla dentro de su parte: «C3», «vértebra S2», «5.ª costilla, lado izquierdo», «lado derecho». */
export function meshDetail(name: string): string | null {
  let m: RegExpMatchArray | null
  if ((m = name.match(/^([CTL])(\d\d)$/))) return `${m[1]}${+m[2]}`
  if ((m = name.match(/^sacrum_(S\d)$/))) return `vértebra ${m[1]}`
  if ((m = name.match(/^coccyx_(\d)$/))) return `segmento ${m[1]}`
  const side = (m = name.match(/_([LR])(_|$)/)) ? (m[1] === 'L' ? 'lado izquierdo' : 'lado derecho') : null
  if ((m = name.match(/^(rib|cartilage)_[LR]_(\d+)/))) return `${+m[2]}.ª costilla, ${side}`
  return side
}

/**
 * Devuelve una función nombre de malla → id de parte. Por orden: la asignación
 * propia del modelo, las reglas de nomenclatura y, por último, el alias más largo
 * (español, inglés o latín) contenido en el nombre.
 */
export function buildMatcher(def: ModelDef): (meshName: string) => string | null {
  const aliases: [string, string][] = []
  for (const b of bones) {
    for (const a of [b.name, ...(b.aliases ?? []), ...(b.mesh ?? [])]) aliases.push([normalizeMeshName(a), b.id])
  }
  aliases.sort((x, y) => y[0].length - x[0].length)

  return (meshName) => {
    if (!meshName) return null
    const own = def.resolve?.(meshName)
    if (own !== undefined) return own
    const ruled = byConvention(meshName)
    if (ruled !== undefined) return ruled
    const padded = ` ${normalizeMeshName(meshName)} `
    return aliases.find(([alias]) => padded.includes(` ${alias} `))?.[1] ?? null
  }
}
