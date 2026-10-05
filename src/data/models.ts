import type { RegionId } from '../types'

/**
 * REGISTRO DE MODELOS 3D (archivos .glb en public/models/)
 *
 * Cada malla del modelo se asigna a una «parte» por su nombre (ver three/meshMatch.ts).
 * `parts` son las partes sobre las que se generan preguntas automáticamente; el resto
 * de mallas siguen siendo visibles y muestran su nombre al pasar el cursor.
 *
 * Para añadir un modelo: copia el .glb en public/models/, ábrelo en la página «Modelos»
 * para comprobar qué parte se asigna a cada malla, y añade aquí su entrada.
 */

/** Punto marcado sobre un modelo para accidentes óseos que no son una malla aparte. */
export interface Hotspot {
  id: string
  label: string
  region: RegionId
  /** Coordenadas locales del modelo; la página «Modelos» las muestra al hacer clic. */
  position: [number, number, number]
}

/** Punto de vista de la cámara sobre un modelo. */
export interface ModelView {
  id: string
  label: string
  /** Dirección desde el modelo hacia la cámara. */
  dir: [number, number, number]
  /** Para primeros planos: punto al que mira la cámara y distancia a él. Si faltan, se encuadra el modelo entero. */
  target?: [number, number, number]
  distance?: number
}

export interface ModelDef {
  id: string
  title: string
  url: string
  /** Partes con preguntas automáticas: ids de huesos (data/bones.ts) o de estructuras (data/parts.ts). */
  parts: string[]
  /** Asignación propia de este modelo: nombre de malla → parte. `undefined` deja actuar a las reglas generales. */
  resolve?: (meshName: string) => string | null | undefined
  hotspots?: Hotspot[]
  /** Rotación en radianes para modelos exportados con otro eje vertical. */
  rotation?: [number, number, number]
  /** Vistas disponibles; la primera es la inicial. Sin ellas, el modelo se ve de frente. */
  views?: ModelView[]
}

const range = (prefix: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}-${from + i}`)

const glb = (id: string, title: string, parts: string[], extra: Partial<ModelDef> = {}): ModelDef => ({
  id,
  title,
  url: `models/esqueleto-${id}.glb`,
  parts,
  ...extra,
})

/** En el modelo de la cintura escapular la escápula cuenta como un solo hueso, no por porciones. */
const wholeBones = (name: string) => (name.startsWith('scapula') ? 'escapula' : undefined)

export const models: Record<string, ModelDef> = {
  // Los modelos del cráneo vienen de otro juego de archivos (craneo-*.glb), con todos sus huesos.
  craneo: glb('craneo', 'Cráneo', ['frontal', 'parietal', 'occipital', 'temporal', 'esfenoides', 'cigomatico', 'maxilar', 'nasal', 'mandibula'], {
    url: 'models/craneo-frontal.glb',
    views: [
      { id: 'frontal', label: 'Frontal', dir: [0, 0, 1] },
      { id: 'lateral', label: 'Lateral', dir: [1, 0, 0.04] },
      { id: 'orbita', label: 'Órbita', dir: [0.41, 0.02, 0.91], target: [0.022, 1.615, 0.06], distance: 0.27 },
    ],
  }),
  'craneo-sagital': glb('craneo-sagital', 'Corte sagital', ['etmoides', 'vomer', 'palatino', 'cornete-inferior', 'esfenoides', 'frontal', 'occipital'], {
    url: 'models/craneo-sagital.glb',
    views: [{ id: 'medial', label: 'Medial', dir: [1, 0, 0.04] }],
  }),
  'craneo-base': glb('craneo-base', 'Base (interior)', ['frontal', 'etmoides', 'esfenoides', 'temporal', 'occipital'], {
    url: 'models/craneo-base.glb',
    views: [{ id: 'superior', label: 'Superior', dir: [0, 0.987, -0.161] }],
  }),
  'craneo-inferior': glb('craneo-inferior', 'Vista inferior', ['occipital', 'temporal', 'esfenoides', 'palatino', 'maxilar', 'vomer', 'cigomatico'], {
    url: 'models/craneo-inferior.glb',
    views: [{ id: 'inferior', label: 'Inferior', dir: [0, -0.993, 0.115] }],
  }),
  hombro: glb('hombro', 'Cintura escapular', ['clavicula', 'escapula'], {
    resolve: wholeBones,
    views: [
      { id: 'anterior', label: 'Anterior', dir: [0, 0, 1] },
      { id: 'posterior', label: 'Posterior', dir: [0, 0, -1] },
      { id: 'superior', label: 'Superior', dir: [0, 0.98, 0.2] },
    ],
  }),
  escapula: glb('escapula', 'Escápula', ['escapula-acromion', 'escapula-coracoides', 'escapula-glenoidea', 'escapula-espina', 'escapula-supraespinosa', 'escapula-infraespinosa'], {
    views: [
      { id: 'posterior', label: 'Posterior', dir: [0, 0, -1] },
      { id: 'anterior', label: 'Anterior', dir: [0, 0, 1] },
      { id: 'lateral', label: 'Lateral', dir: [1, 0, 0] },
    ],
  }),
  brazo: glb('brazo', 'Miembro superior', ['humero', 'radio', 'cubito']),
  mano: glb('mano', 'Mano', [
    ...['escafoides', 'semilunar', 'piramidal', 'pisiforme', 'trapecio', 'trapezoide', 'grande', 'ganchoso'],
    ...range('mc', 1, 5),
    ...range('fpm', 1, 5),
    ...range('fmm', 2, 5),
    ...range('fdm', 1, 5),
  ]),
  pelvis: glb('pelvis', 'Pelvis', ['ilion', 'isquion', 'pubis', 'sacro', 'coccix', 'sinfisis-pubica'], {
    views: [
      { id: 'anterior', label: 'Anterior', dir: [0, 0, 1] },
      { id: 'posterior', label: 'Posterior', dir: [0, 0, -1] },
      { id: 'lateral', label: 'Lateral', dir: [1, 0, 0] },
      { id: 'superior', label: 'Superior', dir: [0, 0.96, 0.28] },
    ],
  }),
  pierna: glb('pierna', 'Miembro inferior', ['femur', 'rotula', 'tibia', 'perone']),
  pie: glb('pie', 'Pie', [
    ...['astragalo', 'calcaneo', 'navicular', 'cuboides', 'cuneiforme-medial', 'cuneiforme-intermedio', 'cuneiforme-lateral'],
    ...range('mt', 1, 5),
    ...range('fpp', 1, 5),
    ...range('fmp', 2, 5),
    ...range('fdp', 1, 5),
  ]),
  columna: glb('columna', 'Columna vertebral', ['cervicales', 'toracicas', 'lumbares', 'sacro', 'coccix']),
  torax: glb('torax', 'Tórax', ['esternon-manubrio', 'esternon-cuerpo', 'xifoides', 'costillas-verdaderas', 'costillas-falsas', 'costillas-flotantes', 'cartilagos-costales']),
}
