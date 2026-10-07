export type RegionId =
  | 'craneo'
  | 'cintura-escapular'
  | 'miembro-superior'
  | 'mano'
  | 'pelvis'
  | 'miembro-inferior'
  | 'pie'
  | 'tronco'
  | 'general'

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
  /** Concepto general (epífisis, médula ósea…), no un hueso: la ficha no muestra tipo ni lateralidad. */
  concept?: boolean
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

/** Lámina rotulada: de cada parte sale una línea hacia un recuadro donde se escribe su nombre. */
export interface LabelQ extends QBase {
  type: 'label'
  model: string
  /** Partes que hay que nombrar. */
  parts: string[]
  /** Vista inicial del modelo (id de una de sus `views`). */
  view?: string
  /** Partes visibles del modelo; si se omite, se muestra entero. */
  only?: string[]
  /** Deja un solo lado de los huesos pares (una sola extremidad). */
  half?: boolean
  /** Acerca la cámara a las partes preguntadas (un extremo del hueso, una articulación). */
  zoom?: boolean
}

export type Question = ChoiceQ | MultiQ | WriteQ | ListQ | IdentifyQ | LabelQ
