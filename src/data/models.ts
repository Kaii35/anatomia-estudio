/**
 * REGISTRO DE MODELOS 3D (archivos .glb en public/models/)
 *
 * Cada malla del modelo se asigna a una «parte» por su nombre (ver three/meshMatch.ts):
 * un hueso, una zona de un hueso (data/zones.ts) u otra estructura (data/parts.ts).
 * `parts` son las partes sobre las que se generan preguntas automáticamente; el resto
 * de mallas siguen siendo visibles y muestran su nombre al pasar el cursor.
 *
 * Para añadir un modelo: deja el .glb original en modelos-originales/, añádelo a la
 * lista de scripts/optimizar-modelos.mjs, ejecuta `npm run modelos` y registra aquí su entrada.
 * La página /#/modelos?modelo=<id> muestra qué parte recibe cada malla y las
 * coordenadas del punto en que se hace clic (para los `hotspots`).
 */

/** Punto que marca en un modelo un accidente óseo que no es una malla aparte. Su nombre está en data/parts.ts. */
export interface Hotspot {
  id: string
  /** Coordenadas del modelo. */
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
  /**
   * Partes que no se etiquetan en esta vista al estudiar. Hace falta cuando una malla ocupa
   * todo el grosor del hueso: la «fosa infraespinosa» también se ve por delante, donde la cara se llama subescapular.
   */
  hide?: string[]
}

export interface ModelDef {
  id: string
  title: string
  url: string
  /** Partes con preguntas automáticas: ids de huesos, zonas o estructuras. */
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

const model = (id: string, title: string, file: string, parts: string[], extra: Partial<ModelDef> = {}): ModelDef => ({
  id,
  title,
  url: `models/${file}.glb`,
  parts,
  ...extra,
})

// Vistas habituales. Los modelos son del lado izquierdo: su cara lateral mira a +x.
const ANTERIOR: ModelView = { id: 'anterior', label: 'Anterior', dir: [0, 0, 1] }
const POSTERIOR: ModelView = { id: 'posterior', label: 'Posterior', dir: [0, 0, -1] }
const LATERAL: ModelView = { id: 'lateral', label: 'Lateral', dir: [1, 0, 0] }
const MEDIAL: ModelView = { id: 'medial', label: 'Medial', dir: [-1, 0, 0] }
const SUPERIOR: ModelView = { id: 'superior', label: 'Superior', dir: [0, 0.96, 0.28] }

/** Hueso largo entero: sus zonas cuentan como el hueso, para las preguntas que piden señalarlo completo. */
const WHOLE: Record<string, string> = { humerus: 'humero', ulna: 'cubito', radius: 'radio', femur: 'femur', tibia: 'tibia', fibula: 'perone', scapula: 'escapula' }
const wholeBones = (name: string) => WHOLE[name.split('_')[0]]

const HUMERO = ['head', 'anatomical_neck', 'surgical_neck', 'greater_tubercle', 'lesser_tubercle', 'intertubercular_sulcus', 'tubercle_crests', 'deltoid_tuberosity', 'radial_groove', 'shaft', 'supracondylar_ridges', 'medial_epicondyle', 'lateral_epicondyle', 'trochlea', 'capitulum', 'olecranon_fossa', 'ulnar_groove'].map((z) => `humerus_${z}`)
const CUBITO = ['olecranon', 'coronoid', 'trochlear_notch', 'radial_notch', 'tuberosity', 'shaft', 'interosseous_border', 'head', 'articular_circumference', 'styloid'].map((z) => `ulna_${z}`)
const RADIO = ['head', 'articular_circumference', 'neck', 'tuberosity', 'shaft', 'interosseous_border', 'dorsal_tubercle', 'distal_end', 'ulnar_notch', 'carpal_surface', 'styloid'].map((z) => `radius_${z}`)
const FEMUR = ['head', 'fovea_capitis', 'neck', 'greater_trochanter', 'lesser_trochanter', 'intertrochanteric_line', 'intertrochanteric_crest', 'gluteal_tuberosity', 'linea_aspera', 'shaft', 'supracondylar_lines', 'adductor_tubercle', 'medial_epicondyle', 'lateral_epicondyle', 'medial_condyle', 'lateral_condyle', 'intercondylar_fossa', 'patellar_surface'].map((z) => `femur_${z}`)
const TIBIA = ['medial_condyle', 'lateral_condyle', 'glenoid_cavities', 'intercondylar_eminence', 'tibial_tuberosity', 'fibular_facet', 'anterior_crest', 'medial_surface', 'lateral_surface', 'posterior_surface', 'soleal_line', 'nutrient_foramen', 'distal_end', 'medial_malleolus', 'fibular_notch', 'talar_facet'].map((z) => `tibia_${z}`)
const PERONE = ['head', 'apex', 'neck', 'lateral_surface', 'medial_surface', 'interosseous_border', 'anterior_border', 'lateral_malleolus', 'malleolar_facet'].map((z) => `fibula_${z}`)
const SACRO = ['promontory', 'ala', 'superior_articular_process', 'sacral_canal', 'sacral_hiatus', 'median_crest', 'intermediate_crests', 'lateral_crests', 'anterior_foramina', 'posterior_foramina', 'transverse_lines', 'auricular_surface'].map((z) => `sacrum_${z}`)
const ESCAPULA = ['escapula-acromion', 'escapula-coracoides', 'escapula-glenoidea', 'escapula-espina', 'escapula-supraespinosa', 'escapula-infraespinosa']

// Accidentes que no son una malla aparte: se marcan con un punto. Coordenadas leídas en /#/modelos?modelo=<id>.
const PUNTOS_ESCAPULA: Hotspot[] = [
  { id: 'escapula-angulo-superior', position: [0.059, 1.397, -0.07] },
  { id: 'escapula-escotadura', position: [0.112, 1.388, -0.049] },
  { id: 'escapula-cuello', position: [0.135, 1.363, -0.027] },
  { id: 'escapula-borde-medial', position: [0.058, 1.322, -0.073] },
  { id: 'escapula-subescapular', position: [0.09, 1.322, -0.062] },
  { id: 'escapula-borde-lateral', position: [0.115, 1.297, -0.051] },
  { id: 'escapula-angulo-inferior', position: [0.081, 1.243, -0.06] },
]
const PUNTOS_COXAL: Hotspot[] = [
  { id: 'coxal-cresta-iliaca', position: [0.06, 0.111, 0] },
  { id: 'coxal-eias', position: [0.053, 0.072, 0.053] },
  { id: 'coxal-eiai', position: [0.036, 0.005, 0.046] },
  { id: 'coxal-eips', position: [-0.008, 0.066, -0.068] },
  { id: 'coxal-escotadura-mayor', position: [0.003, 0, -0.034] },
  { id: 'coxal-espina-ciatica', position: [-0.003, -0.063, -0.027] },
  { id: 'coxal-escotadura-menor', position: [0.007, -0.088, -0.014] },
  { id: 'coxal-tuberosidad-isquiatica', position: [0.003, -0.113, 0] },
  { id: 'coxal-acetabulo', position: [-0.006, -0.029, 0.022] },
  { id: 'coxal-agujero-obturador', position: [-0.025, -0.071, 0.03] },
  { id: 'coxal-rama-isquiopubica', position: [-0.031, -0.1, 0.032] },
  { id: 'coxal-fosa-iliaca', position: [0.047, 0.066, 0] },
  { id: 'coxal-superficie-auricular', position: [-0.027, 0.03, -0.047] },
]
const ids = (points: Hotspot[]) => points.map((p) => p.id)

export const models: Record<string, ModelDef> = {
  // ───────────── Cráneo ─────────────
  craneo: model('craneo', 'Cráneo', 'craneo-frontal', ['frontal', 'parietal', 'occipital', 'temporal', 'esfenoides', 'cigomatico', 'maxilar', 'nasal', 'mandibula'], {
    views: [
      { id: 'frontal', label: 'Frontal', dir: [0, 0, 1] },
      { id: 'lateral', label: 'Lateral', dir: [1, 0, 0.04] },
      { id: 'orbita', label: 'Órbita', dir: [0.41, 0.02, 0.91], target: [0.022, 1.615, 0.06], distance: 0.27 },
    ],
  }),
  'craneo-sagital': model('craneo-sagital', 'Corte sagital', 'craneo-sagital', ['etmoides', 'vomer', 'palatino', 'cornete-inferior', 'esfenoides', 'frontal', 'occipital'], {
    views: [{ id: 'medial', label: 'Medial', dir: [1, 0, 0.04] }],
  }),
  'craneo-base': model('craneo-base', 'Base (interior)', 'craneo-base', ['frontal', 'etmoides', 'esfenoides', 'temporal', 'occipital'], {
    views: [{ id: 'superior', label: 'Superior', dir: [0, 0.987, -0.161] }],
  }),
  'craneo-inferior': model('craneo-inferior', 'Vista inferior', 'craneo-inferior', ['occipital', 'temporal', 'esfenoides', 'palatino', 'maxilar', 'vomer', 'cigomatico'], {
    views: [{ id: 'inferior', label: 'Inferior', dir: [0, -0.993, 0.115] }],
  }),

  // ───────────── Cintura escapular ─────────────
  hombro: model('hombro', 'Cintura escapular', 'esqueleto-hombro', ['clavicula', 'escapula'], {
    resolve: wholeBones,
    views: [ANTERIOR, POSTERIOR, { id: 'superior', label: 'Superior', dir: [0, 0.98, 0.2] }],
  }),
  escapula: model('escapula', 'Escápula', 'esqueleto-escapula', [...ESCAPULA, ...ids(PUNTOS_ESCAPULA)], {
    hotspots: PUNTOS_ESCAPULA,
    views: [
      { ...POSTERIOR, hide: ['escapula-subescapular'] },
      { ...ANTERIOR, hide: ['escapula-supraespinosa', 'escapula-infraespinosa', 'escapula-espina'] },
      { ...LATERAL, hide: ['escapula-subescapular', 'escapula-borde-medial'] },
    ],
  }),
  'articulacion-hombro': model('articulacion-hombro', 'Articulación del hombro', 'hombro-anterior', [], { views: [ANTERIOR, POSTERIOR, LATERAL] }),
  'hombro-torax': model('hombro-torax', 'Hombro y tórax', 'hombro-vista-anterior', [], { views: [ANTERIOR, POSTERIOR] }),

  // ───────────── Miembro superior ─────────────
  humero: model('humero', 'Húmero', 'humero-anterior', HUMERO, { views: [ANTERIOR, POSTERIOR, LATERAL, MEDIAL] }),
  antebrazo: model('antebrazo', 'Radio y cúbito', 'radio-y-cubito-anterior', [...RADIO, ...CUBITO], {
    views: [ANTERIOR, POSTERIOR, { id: 'proximal', label: 'Articular proximal', dir: [0, 0.94, 0.34] }, { id: 'distal', label: 'Articular distal', dir: [0, -0.94, 0.34] }],
  }),
  // El mismo archivo dos veces: por zonas para estudiar, y con cada hueso entero para las preguntas que lo piden completo.
  'brazo-zonas': model('brazo-zonas', 'Brazo completo', 'brazo-coloreado', [], { views: [ANTERIOR, POSTERIOR] }),
  brazo: model('brazo', 'Miembro superior', 'brazo-coloreado', ['humero', 'radio', 'cubito'], { resolve: wholeBones, views: [ANTERIOR, POSTERIOR] }),
  'miembro-superior': model('miembro-superior', 'Con cintura escapular', 'esqueleto-superior', [], { views: [ANTERIOR, POSTERIOR] }),
  mano: model('mano', 'Mano', 'esqueleto-mano', [
    ...['escafoides', 'semilunar', 'piramidal', 'pisiforme', 'trapecio', 'trapezoide', 'grande', 'ganchoso'],
    ...range('mc', 1, 5),
    ...range('fpm', 1, 5),
    ...range('fmm', 2, 5),
    ...range('fdm', 1, 5),
  ]),

  // ───────────── Pelvis ─────────────
  pelvis: model('pelvis', 'Pelvis', 'pelvis', ['ilion', 'isquion', 'pubis', 'sacro', 'coccix', 'sinfisis-pubica', ...SACRO], {
    views: [ANTERIOR, POSTERIOR, LATERAL, { id: 'superior', label: 'Estrecho superior', dir: [0, 0.96, 0.28] }],
  }),
  coxal: model('coxal', 'Hueso coxal', 'hueso-coxal-lateral', ['ilion', 'isquion', 'pubis', ...ids(PUNTOS_COXAL)], {
    hotspots: PUNTOS_COXAL,
    views: [
      { ...LATERAL, hide: ['coxal-fosa-iliaca', 'coxal-superficie-auricular'] },
      { ...MEDIAL, hide: ['coxal-acetabulo'] },
      { ...ANTERIOR, hide: ['coxal-superficie-auricular'] },
      { ...POSTERIOR, hide: ['coxal-fosa-iliaca'] },
    ],
  }),
  cadera: model('cadera', 'Articulación de la cadera', 'articulacion-de-la-cadera-anterior', [], { views: [ANTERIOR, POSTERIOR, LATERAL] }),
  'cadera-pierna': model('cadera-pierna', 'Pelvis y pierna', 'cadera-articulacion', [], { views: [ANTERIOR, POSTERIOR, LATERAL] }),

  // ───────────── Miembro inferior ─────────────
  femur: model('femur', 'Fémur', 'femur-anterior', FEMUR, { views: [ANTERIOR, POSTERIOR, LATERAL, MEDIAL] }),
  tibia: model('tibia', 'Tibia', 'tibia-cara-anterior', TIBIA, { views: [ANTERIOR, { ...MEDIAL, label: 'Cara interna' }, POSTERIOR, LATERAL, SUPERIOR] }),
  perone: model('perone', 'Peroné', 'perone-anterior', PERONE, { views: [ANTERIOR, LATERAL, MEDIAL, POSTERIOR] }),
  'pierna-huesos': model('pierna-huesos', 'Fémur, tibia y peroné', 'femur-tibia-y-perone-anterior', [], { views: [ANTERIOR, POSTERIOR, LATERAL] }),
  'pierna-zonas': model('pierna-zonas', 'Pierna completa', 'pierna', [], { views: [ANTERIOR, POSTERIOR, LATERAL] }),
  pierna: model('pierna', 'Miembro inferior', 'pierna', ['femur', 'rotula', 'tibia', 'perone'], { resolve: wholeBones, views: [ANTERIOR, POSTERIOR, LATERAL] }),
  pie: model('pie', 'Pie', 'esqueleto-pie', [
    ...['astragalo', 'calcaneo', 'navicular', 'cuboides', 'cuneiforme-medial', 'cuneiforme-intermedio', 'cuneiforme-lateral'],
    ...range('mt', 1, 5),
    ...range('fpp', 1, 5),
    ...range('fmp', 2, 5),
    ...range('fdp', 1, 5),
  ]),

  // ───────────── Tronco ─────────────
  columna: model('columna', 'Columna vertebral', 'esqueleto-columna', ['cervicales', 'toracicas', 'lumbares', 'sacro', 'coccix']),
  torax: model('torax', 'Tórax', 'esqueleto-torax', ['esternon-manubrio', 'esternon-cuerpo', 'xifoides', 'costillas-verdaderas', 'costillas-falsas', 'costillas-flotantes', 'cartilagos-costales']),
}
