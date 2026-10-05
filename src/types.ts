export type RegionId =
  | 'craneo'
  | 'cintura-escapular'
  | 'miembro-superior'
  | 'mano'
  | 'pelvis'
  | 'miembro-inferior'
  | 'pie'

export interface Region {
  id: RegionId
  name: string
  description: string
  /** Color de acento de la región (hex). */
  color: string
  /** Ids de modelos 3D (ver data/models.ts) que se muestran al estudiar la región. */
  models: string[]
}

export type BoneKind = 'largo' | 'corto' | 'plano' | 'irregular' | 'sesamoideo'

export interface Landmark {
  name: string
  note?: string
  /** Si es true se genera la pregunta «¿En qué hueso se encuentra…?». Solo para accidentes de nombre inequívoco. */
  quiz?: boolean
}

export interface Bone {
  id: string
  name: string
  region: RegionId
  /** Subgrupo dentro de la región (p. ej. «Carpo: fila proximal»). */
  group: string
  kind: BoneKind
  paired: boolean
  summary: string
  /** Sinónimos aceptados en respuestas escritas. */
  aliases?: string[]
  /** Nombres en inglés/latín para emparejar automáticamente las mallas de los modelos 3D. */
  mesh?: string[]
  landmarks?: Landmark[]
  articulations?: string[]
  forensic?: string
  image?: string
  /** Hueso de una serie numerada (metacarpianos, falanges…): se muestra compacto y no se pide escribir su nombre. */
  series?: boolean
}

/** Modelo 3D que acompaña a una pregunta, con partes resaltadas. */
export interface Visual {
  model: string
  highlight: string[]
}

interface QBase {
  id: string
  region: RegionId
  prompt: string
  explanation?: string
  /** Ruta de imagen (p. ej. «img/pelvis.jpg», dentro de /public). */
  image?: string
  visual?: Visual
  /** Preguntas con la misma clave no se repiten dentro de una sesión. */
  key?: string
}

export interface ChoiceQ extends QBase {
  type: 'choice'
  options: string[]
  answer: number
}

export interface MultiQ extends QBase {
  type: 'multi'
  options: string[]
  answers: number[]
}

export interface WriteQ extends QBase {
  type: 'write'
  /** Respuestas aceptadas; la primera es la que se muestra como correcta. */
  accept: string[]
}

export interface ListQ extends QBase {
  type: 'list'
  items: { label: string; accept?: string[] }[]
}

export interface IdentifyQ extends QBase {
  type: 'identify'
  model: string
  targets: string[]
  /** true: hay que seleccionar todas las partes de `targets`. false: basta con una. */
  all?: boolean
}

export type Question = ChoiceQ | MultiQ | WriteQ | ListQ | IdentifyQ
