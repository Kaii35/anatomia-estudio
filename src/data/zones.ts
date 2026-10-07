/**
 * ZONAS DE LOS HUESOS
 *
 * Los modelos detallados traen cada hueso dividido en mallas con nombre
 * (humerus_L_head, femur_L_linea_aspera…). La clave de cada zona es ese nombre
 * sin el lado («humerus_head»), y es también su id de parte en toda la app.
 *
 * `name` es el término que se muestra; `aliases`, lo que además se acepta al
 * escribir. Se usan los términos de los apuntes de clase (troquíter, epitróclea,
 * maléolo interno…) junto a los de la nomenclatura internacional.
 */
export interface Zone {
  name: string
  /** Id del hueso al que pertenece (data/bones.ts). */
  bone: string
  aliases?: string[]
  /** Dato breve que acompaña a la zona en la ficha y como explicación de las preguntas. */
  note?: string
}

const z = (bone: string, name: string, aliases: string[] = [], note?: string): Zone => ({ bone, name, aliases, note })

export const zones: Record<string, Zone> = {
  // ───────────── Húmero ─────────────
  humerus_head: z('humero', 'Cabeza del húmero', ['cabeza', 'cabeza humeral'], 'Epífisis proximal. Articula con la cavidad glenoidea de la escápula.'),
  humerus_anatomical_neck: z('humero', 'Cuello anatómico', ['cuello anatomico del humero'], 'Surco que rodea la cabeza, justo por debajo de la superficie articular.'),
  humerus_surgical_neck: z('humero', 'Cuello quirúrgico', ['cuello quirurgico del humero'], 'Por debajo de los tubérculos. Es la zona que más se fractura y se calcifica más con la edad.'),
  humerus_greater_tubercle: z('humero', 'Troquíter (tubérculo mayor)', ['troquiter', 'tuberculo mayor', 'tuberosidad mayor'], 'Tuberosidad mayor, lateral a la cabeza.'),
  humerus_lesser_tubercle: z('humero', 'Troquín (tubérculo menor)', ['troquin', 'tuberculo menor', 'tuberosidad menor'], 'Tuberosidad menor, en la cara anterior.'),
  humerus_intertubercular_sulcus: z('humero', 'Surco intertubercular (corredera bicipital)', ['surco intertubercular', 'corredera bicipital', 'surco bicipital', 'canal bicipital'], 'Canal entre el troquíter y el troquín; por él pasa el tendón largo del bíceps.'),
  humerus_tubercle_crests: z('humero', 'Crestas de los tubérculos', ['crestas tuberculares', 'crestas del troquiter y del troquin'], 'Prolongan hacia abajo los bordes del surco intertubercular.'),
  humerus_deltoid_tuberosity: z('humero', 'Tuberosidad deltoidea', ['v deltoidea'], 'Rugosidad lateral de la diáfisis donde se inserta el deltoides.'),
  humerus_radial_groove: z('humero', 'Surco del nervio radial', ['canal radial', 'surco radial'], 'Canal oblicuo en la cara posterior de la diáfisis.'),
  humerus_shaft: z('humero', 'Diáfisis del húmero', ['diafisis', 'cuerpo', 'cuerpo del humero'], 'Parte alargada del hueso, entre las dos epífisis.'),
  humerus_supracondylar_ridges: z('humero', 'Crestas supracondíleas', ['crestas supracondileas medial y lateral'], 'Bordes que suben desde los epicóndilos.'),
  humerus_medial_epicondyle: z('humero', 'Epitróclea (epicóndilo medial)', ['epitroclea', 'epicondilo medial', 'epicondilo interno'], 'Saliente interno del codo: mira hacia adentro.'),
  humerus_lateral_epicondyle: z('humero', 'Epicóndilo lateral', ['epicondilo', 'epicondilo externo', 'epicondilo lateral del humero'], 'Saliente externo del codo, junto al cóndilo que articula con la cabeza del radio.'),
  humerus_trochlea: z('humero', 'Tróclea', ['troclea humeral', 'troclea del humero'], 'Superficie en forma de polea. Articula con la escotadura troclear del cúbito.'),
  humerus_capitulum: z('humero', 'Cóndilo humeral (capítulo)', ['condilo humeral', 'capitulo', 'condilo', 'condilo del humero'], 'Superficie redondeada lateral a la tróclea. Articula con la cabeza del radio.'),
  humerus_olecranon_fossa: z('humero', 'Fosa olecraniana', ['fosa olecraneana', 'fosa del olecranon'], 'Hueco en la cara posterior: recibe al olécranon del cúbito al extender el codo.'),
  humerus_ulnar_groove: z('humero', 'Surco del nervio cubital', ['canal epitrocleo olecraniano', 'surco cubital'], 'Detrás de la epitróclea.'),

  // ───────────── Cúbito ─────────────
  ulna_olecranon: z('cubito', 'Olécranon', ['olecranon'], 'Forma la punta del codo y encaja en la fosa olecraniana del húmero.'),
  ulna_coronoid: z('cubito', 'Apófisis coronoides', ['coronoides', 'apofisis coronoides del cubito'], 'Saliente anterior de la epífisis proximal.'),
  ulna_trochlear_notch: z('cubito', 'Escotadura troclear', ['cavidad sigmoidea mayor', 'incisura troclear'], 'Abraza la tróclea del húmero.'),
  ulna_radial_notch: z('cubito', 'Escotadura radial', ['cavidad sigmoidea menor', 'incisura radial'], 'Carilla lateral donde gira la cabeza del radio.'),
  ulna_tuberosity: z('cubito', 'Tuberosidad del cúbito', ['tuberosidad cubital'], 'Bajo la apófisis coronoides.'),
  ulna_shaft: z('cubito', 'Diáfisis del cúbito', ['cuerpo del cubito'], 'Cuerpo del hueso.'),
  ulna_interosseous_border: z('cubito', 'Borde interóseo del cúbito', ['borde interoseo cubital'], 'Borde lateral, donde se fija la membrana interósea.'),
  ulna_head: z('cubito', 'Cabeza del cúbito', ['cabeza cubital'], 'Está en el extremo distal, al contrario que la del radio.'),
  ulna_articular_circumference: z('cubito', 'Circunferencia articular del cúbito', ['carilla articular para el radio'], 'Carilla de la cabeza que articula con la escotadura cubital del radio.'),
  ulna_styloid: z('cubito', 'Apófisis estiloides del cúbito', ['estiloides del cubito', 'estiloides cubital'], 'Punta distal y medial. El cúbito no articula con los huesos del carpo.'),

  // ───────────── Radio ─────────────
  radius_head: z('radio', 'Cabeza del radio', ['cabeza radial'], 'Proximal, en forma de platillo. Articula con el cóndilo del húmero.'),
  radius_articular_circumference: z('radio', 'Circunferencia articular del radio', ['circunferencia articular de la cabeza'], 'Borde de la cabeza que gira en la escotadura radial del cúbito.'),
  radius_neck: z('radio', 'Cuello del radio', ['cuello radial'], 'Estrechamiento bajo la cabeza.'),
  radius_tuberosity: z('radio', 'Tuberosidad del radio', ['tuberosidad radial', 'tuberosidad bicipital'], 'Inserción del bíceps braquial.'),
  radius_shaft: z('radio', 'Diáfisis del radio', ['cuerpo del radio'], 'Cuerpo del hueso.'),
  radius_interosseous_border: z('radio', 'Borde interóseo del radio', ['borde interoseo radial'], 'Borde medial, donde se fija la membrana interósea.'),
  radius_dorsal_tubercle: z('radio', 'Tubérculo dorsal (de Lister)', ['tuberculo dorsal', 'tuberculo de lister'], 'Saliente de la cara posterior del extremo distal.'),
  radius_distal_end: z('radio', 'Extremo distal del radio', ['epifisis distal del radio'], 'El radio es angosto arriba y se ensancha abajo.'),
  radius_ulnar_notch: z('radio', 'Escotadura cubital', ['incisura cubital', 'escotadura cubital del radio'], 'Carilla medial distal para la cabeza del cúbito.'),
  radius_carpal_surface: z('radio', 'Superficie articular carpiana', ['carilla articular carpiana', 'superficie carpiana'], 'Articula con el escafoides y el semilunar.'),
  radius_styloid: z('radio', 'Apófisis estiloides del radio', ['estiloides del radio', 'estiloides radial'], 'Punta distal y lateral.'),

  // ───────────── Fémur ─────────────
  femur_head: z('femur', 'Cabeza del fémur', ['cabeza', 'cabeza femoral'], 'Encaja en el acetábulo del coxal.'),
  femur_fovea_capitis: z('femur', 'Fosita de la cabeza (fóvea capitis)', ['fovea capitis', 'fosita de la cabeza', 'fovea'], 'Inserción del ligamento de la cabeza del fémur.'),
  femur_neck: z('femur', 'Cuello del fémur', ['cuello', 'cuello femoral'], 'Une la cabeza con la diáfisis.'),
  femur_greater_trochanter: z('femur', 'Trocánter mayor', ['trocanter mayor del femur'], 'Saliente lateral y superior.'),
  femur_lesser_trochanter: z('femur', 'Trocánter menor', ['trocanter menor del femur'], 'Saliente posteromedial, bajo el cuello.'),
  femur_intertrochanteric_line: z('femur', 'Línea intertrocantérica', ['linea intertrocanterea'], 'Une los trocánteres por delante.'),
  femur_intertrochanteric_crest: z('femur', 'Cresta intertrocantérica', ['cresta intertrocanterea'], 'Une los trocánteres por detrás.'),
  femur_gluteal_tuberosity: z('femur', 'Tuberosidad glútea', [], 'Inserción del glúteo mayor, en la cara posterior.'),
  femur_linea_aspera: z('femur', 'Línea áspera', [], 'Cresta longitudinal de la cara posterior de la diáfisis.'),
  femur_shaft: z('femur', 'Diáfisis del fémur', ['diafisis', 'cuerpo', 'cuerpo del femur'], 'Cuerpo del hueso.'),
  femur_supracondylar_lines: z('femur', 'Líneas supracondíleas', [], 'Divergen desde la línea áspera y limitan la superficie poplítea.'),
  femur_adductor_tubercle: z('femur', 'Tubérculo del aductor', ['tuberculo aductor'], 'Sobre el epicóndilo medial.'),
  femur_medial_epicondyle: z('femur', 'Epicóndilo medial del fémur', ['epicondilo medial', 'epicondilo interno'], 'Saliente por encima del cóndilo medial.'),
  femur_lateral_epicondyle: z('femur', 'Epicóndilo lateral del fémur', ['epicondilo lateral', 'epicondilo externo'], 'Saliente por encima del cóndilo lateral.'),
  femur_medial_condyle: z('femur', 'Cóndilo medial del fémur', ['condilo medial', 'condilo interno', 'condilo femoral medial'], 'Articula con el cóndilo medial de la tibia.'),
  femur_lateral_condyle: z('femur', 'Cóndilo lateral del fémur', ['condilo lateral', 'condilo externo', 'condilo femoral lateral'], 'Articula con el cóndilo lateral de la tibia.'),
  femur_intercondylar_fossa: z('femur', 'Fosa intercondílea', ['escotadura intercondilea', 'muesca intercondilar', 'surco intercondileo'], 'Hueco posterior entre los dos cóndilos.'),
  femur_patellar_surface: z('femur', 'Superficie rotuliana', ['carilla rotuliana', 'cara rotuliana', 'superficie patelar'], 'Cara anterior distal, donde se desliza la rótula.'),

  // ───────────── Tibia ─────────────
  tibia_medial_condyle: z('tibia', 'Cóndilo medial de la tibia', ['condilo medial', 'condilo interno', 'condilo tibial medial', 'tuberosidad interna'], 'Epífisis proximal, lado interno.'),
  tibia_lateral_condyle: z('tibia', 'Cóndilo lateral de la tibia', ['condilo lateral', 'condilo externo', 'condilo tibial lateral'], 'Epífisis proximal, lado externo.'),
  tibia_glenoid_cavities: z('tibia', 'Platillos tibiales (cavidades glenoideas)', ['platillos tibiales', 'cavidades glenoideas', 'meseta tibial'], 'Superficies superiores donde apoyan los cóndilos del fémur.'),
  tibia_intercondylar_eminence: z('tibia', 'Eminencia intercondílea', ['espina tibial', 'espina de la tibia'], 'Saliente entre los dos platillos.'),
  tibia_tibial_tuberosity: z('tibia', 'Tuberosidad de la tibia', ['tuberosidad tibial', 'tuberculo tibial', 'tuberosidad anterior'], 'Inserción del ligamento rotuliano.'),
  tibia_fibular_facet: z('tibia', 'Carilla articular para el peroné', ['carilla peronea', 'carilla articular peronea'], 'Bajo el cóndilo lateral: articula con la cabeza del peroné.'),
  tibia_anterior_crest: z('tibia', 'Borde anterior (espinilla)', ['borde anterior', 'cresta tibial', 'espinilla', 'cresta anterior'], 'Borde afilado y subcutáneo de la diáfisis.'),
  tibia_medial_surface: z('tibia', 'Cara medial de la tibia', ['cara medial', 'cara interna'], 'Subcutánea: es la cara que se palpa en la pierna.'),
  tibia_lateral_surface: z('tibia', 'Cara lateral de la tibia', ['cara lateral', 'cara externa'], 'Mira hacia el peroné.'),
  tibia_posterior_surface: z('tibia', 'Cara posterior de la tibia', ['cara posterior'], 'Cruzada por la línea del sóleo.'),
  tibia_soleal_line: z('tibia', 'Línea del sóleo', ['linea oblicua', 'cresta del soleo'], 'Cresta oblicua de la cara posterior.'),
  tibia_nutrient_foramen: z('tibia', 'Agujero nutricio', ['foramen nutricio'], 'Entrada de los vasos que nutren el hueso.'),
  tibia_distal_end: z('tibia', 'Extremo distal de la tibia', ['epifisis distal de la tibia'], 'Forma el techo de la articulación del tobillo.'),
  tibia_medial_malleolus: z('tibia', 'Maléolo medial', ['maleolo interno', 'maleolo tibial'], 'Tobillo interno: mira hacia adentro.'),
  tibia_fibular_notch: z('tibia', 'Escotadura peronea', ['incisura fibular', 'escotadura fibular', 'faceta para el perone'], 'Carilla lateral distal donde encaja el peroné.'),
  tibia_talar_facet: z('tibia', 'Superficie articular para el astrágalo', ['carilla articular para el astragalo', 'superficie articular inferior', 'superficie articular tarsiana', 'faceta para el astragalo'], 'Articula con el cuerpo del astrágalo.'),

  // ───────────── Peroné ─────────────
  fibula_head: z('perone', 'Cabeza del peroné', ['cabeza', 'cabeza peronea'], 'Epífisis proximal redondeada. Articula con el cóndilo lateral de la tibia.'),
  fibula_apex: z('perone', 'Apófisis estiloides del peroné', ['vertice de la cabeza', 'apice de la cabeza', 'estiloides del perone', 'apice', 'apofisis estiloides'], 'Punta de la cabeza.'),
  fibula_neck: z('perone', 'Cuello del peroné', ['cuello'], 'Bajo la cabeza; lo rodea el nervio peroneo común.'),
  fibula_lateral_surface: z('perone', 'Cara lateral del peroné', ['cara lateral', 'cara externa'], 'Cara de la diáfisis que mira hacia fuera.'),
  fibula_medial_surface: z('perone', 'Cara medial del peroné', ['cara medial', 'cara interna'], 'Cara de la diáfisis que mira hacia la tibia.'),
  fibula_interosseous_border: z('perone', 'Borde interóseo del peroné', ['borde interoseo', 'borde interno'], 'Borde interno de la diáfisis, donde se fija la membrana interósea.'),
  fibula_anterior_border: z('perone', 'Borde anterior del peroné', ['borde anterior'], 'Borde delantero de la diáfisis.'),
  fibula_lateral_malleolus: z('perone', 'Maléolo lateral', ['maleolo externo', 'maleolo peroneo'], 'Tobillo externo. Desciende más que el maléolo medial.'),
  fibula_malleolar_facet: z('perone', 'Carilla articular del maléolo', ['carilla maleolar', 'superficie articular para el astragalo'], 'Cara interna del maléolo: articula con el astrágalo.'),

  // ───────────── Sacro ─────────────
  sacrum_promontory: z('sacro', 'Promontorio sacro', ['promontorio'], 'Borde anterior saliente de S1. Articula con la quinta lumbar.'),
  sacrum_ala: z('sacro', 'Alas del sacro', ['alas', 'ala del sacro'], 'Expansiones laterales de la base.'),
  sacrum_superior_articular_process: z('sacro', 'Apófisis articulares superiores', ['carillas articulares superiores', 'apofisis articulares'], 'Articulan con las apófisis articulares inferiores de L5.'),
  sacrum_sacral_canal: z('sacro', 'Canal sacro', ['conducto sacro', 'conducto o canal sacro'], 'Continuación del conducto vertebral: es el orificio vertebral del sacro.'),
  sacrum_sacral_hiatus: z('sacro', 'Hiato sacro', ['hiato'], 'Abertura inferior del canal sacro.'),
  sacrum_median_crest: z('sacro', 'Cresta sacra media', ['cresta sacra medial', 'cresta sacra mediana', 'cresta sacra'], 'Apófisis espinosas fusionadas, en la línea media posterior.'),
  sacrum_intermediate_crests: z('sacro', 'Crestas sacras intermedias', ['cresta sacra intermedia'], 'Apófisis articulares fusionadas.'),
  sacrum_lateral_crests: z('sacro', 'Crestas sacras laterales', ['cresta sacra lateral'], 'Apófisis transversas fusionadas.'),
  sacrum_anterior_foramina: z('sacro', 'Agujeros sacros anteriores', ['foramenes sacros anteriores', 'agujeros sacros', 'foramenes sacros'], 'Cuatro pares, en la cara pélvica.'),
  sacrum_posterior_foramina: z('sacro', 'Agujeros sacros posteriores', ['foramenes sacros posteriores'], 'Cuatro pares, en la cara dorsal.'),
  sacrum_transverse_lines: z('sacro', 'Líneas transversas', ['lineas transversales', 'crestas transversas'], 'Huellas de la fusión de las cinco vértebras sacras: son cuatro.'),
  sacrum_auricular_surface: z('sacro', 'Superficie auricular del sacro', ['superficie auricular', 'carilla auricular'], 'Articula con el ilion: articulación sacroilíaca.'),
}

/** Clave de zona de una malla: «femur_L_head» → «femur_head». */
export const zoneKey = (meshName: string) => meshName.replace(/_[LR](?=_|$)/, '')
