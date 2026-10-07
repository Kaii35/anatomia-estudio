import type { Question, RegionId } from '../types'

/**
 * PREGUNTAS SACADAS DE LAS DIAPOSITIVAS Y LOS APUNTES DE CLASE
 * (Unidad 3: miembro superior, miembro inferior y columna vertebral).
 *
 * Usan los términos de clase (troquíter, epitróclea, maléolo interno…). Donde los
 * apuntes difieren de la nomenclatura habitual, la explicación lo indica.
 */

/** Lámina para rotular: de cada parte sale una línea a un recuadro. */
const lamina = (id: string, region: RegionId, model: string, view: string | undefined, prompt: string, parts: string[], extra: Partial<Extract<Question, { type: 'label' }>> = {}): Question => ({
  id: `c:lamina:${id}`,
  type: 'label',
  region,
  model,
  view,
  prompt,
  parts,
  ...extra,
})

const h = (zones: string) => zones.split(' ').map((z) => `humerus_${z}`)
const u = (zones: string) => zones.split(' ').map((z) => `ulna_${z}`)
const r = (zones: string) => zones.split(' ').map((z) => `radius_${z}`)
const f = (zones: string) => zones.split(' ').map((z) => `femur_${z}`)
const t = (zones: string) => zones.split(' ').map((z) => `tibia_${z}`)
const p = (zones: string) => zones.split(' ').map((z) => `fibula_${z}`)
const s = (zones: string) => zones.split(' ').map((z) => `sacrum_${z}`)
const SOLO_SACRO = ['sacro', 'coccix', ...s('promontory ala superior_articular_process sacral_canal sacral_hiatus median_crest intermediate_crests lateral_crests anterior_foramina posterior_foramina transverse_lines auricular_surface')]

const laminas: Question[] = [
  // ── Escápula ──
  lamina('escapula-anterior', 'cintura-escapular', 'escapula', 'anterior', 'Escápula, visión anterior: pon el nombre a cada parte.', [
    'escapula-angulo-superior',
    'escapula-borde-medial',
    'escapula-subescapular',
    'escapula-angulo-inferior',
    'escapula-coracoides',
    'escapula-acromion',
    'escapula-cuello',
    'escapula-borde-lateral',
  ]),
  lamina('escapula-posterior', 'cintura-escapular', 'escapula', 'posterior', 'Escápula, cara posterior: pon el nombre a cada parte.', [
    'escapula-acromion',
    'escapula-espina',
    'escapula-supraespinosa',
    'escapula-infraespinosa',
    'escapula-glenoidea',
    'escapula-angulo-inferior',
  ]),
  lamina('escapula-bordes', 'cintura-escapular', 'escapula', 'anterior', 'Señala con su nombre los ángulos y los bordes de la escápula.', [
    'escapula-angulo-superior',
    'escapula-angulo-inferior',
    'escapula-borde-medial',
    'escapula-borde-lateral',
  ]),

  // ── Húmero ──
  lamina('humero-anterior', 'miembro-superior', 'humero', 'anterior', 'Húmero, cara anterior: pon el nombre a cada parte.', h('head greater_tubercle lesser_tubercle surgical_neck shaft lateral_epicondyle medial_epicondyle capitulum trochlea')),
  lamina('humero-posterior', 'miembro-superior', 'humero', 'posterior', 'Húmero, cara posterior: pon el nombre a cada parte.', h('head greater_tubercle surgical_neck shaft olecranon_fossa lateral_epicondyle medial_epicondyle trochlea')),
  lamina('humero-proximal', 'miembro-superior', 'humero', 'anterior', 'Epífisis proximal del húmero: nombra sus partes.', h('head anatomical_neck greater_tubercle lesser_tubercle intertubercular_sulcus surgical_neck'), {
    zoom: true,
    explanation: 'Se distinguen dos tuberosidades: una mayor o troquíter y otra menor o troquín, separadas por el surco intertubercular.',
  }),
  lamina('humero-distal', 'miembro-superior', 'humero', 'anterior', 'Epífisis distal del húmero: nombra sus partes.', h('lateral_epicondyle capitulum trochlea medial_epicondyle supracondylar_ridges'), {
    zoom: true,
    explanation: 'De fuera adentro: epicóndilo, cóndilo (articula con el radio), tróclea (articula con el cúbito) y epitróclea.',
  }),

  // ── Radio y cúbito ──
  lamina('antebrazo-anterior', 'miembro-superior', 'antebrazo', 'anterior', 'Radio y cúbito: pon el nombre a cada parte.', [...r('head shaft styloid'), ...u('olecranon radial_notch shaft head styloid')]),
  lamina('radio', 'miembro-superior', 'antebrazo', 'anterior', 'Partes del radio: nómbralas.', r('head neck tuberosity shaft distal_end styloid'), {
    explanation: 'En proximal presenta cabeza, cuello y tuberosidad radial; en distal, escotadura cubital, apófisis estiloides y superficie articular carpiana.',
  }),
  lamina('cubito', 'miembro-superior', 'antebrazo', 'anterior', 'Partes del cúbito: nómbralas.', u('olecranon trochlear_notch coronoid tuberosity shaft head styloid'), {
    explanation: 'Epífisis proximal: olécranon y apófisis coronoides. Distal: cabeza, apófisis estiloides y carilla articular para el radio.',
  }),
  lamina('codo', 'miembro-superior', 'brazo-zonas', 'anterior', 'Articulación del codo: nombra las superficies que se enfrentan.', [...h('capitulum trochlea'), ...r('head'), ...u('coronoid')], {
    zoom: true,
    only: [...h('shaft supracondylar_ridges lateral_epicondyle medial_epicondyle capitulum trochlea olecranon_fossa ulnar_groove'), ...r('head articular_circumference neck tuberosity shaft interosseous_border'), ...u('olecranon coronoid trochlear_notch radial_notch tuberosity shaft interosseous_border')],
    explanation: 'El cóndilo del húmero articula con la cabeza del radio, y la tróclea, con la escotadura troclear del cúbito.',
  }),

  // ── Coxal y sacro ──
  lamina('coxal-lateral', 'pelvis', 'coxal', 'lateral', 'Hueso coxal, cara externa: pon el nombre a cada parte.', [
    'coxal-cresta-iliaca',
    'coxal-eias',
    'coxal-eiai',
    'coxal-acetabulo',
    'coxal-agujero-obturador',
    'coxal-tuberosidad-isquiatica',
    'coxal-espina-ciatica',
    'coxal-escotadura-mayor',
  ]),
  lamina('coxal-borde', 'pelvis', 'coxal', 'lateral', 'Recorre el borde posterior e inferior del coxal: nombra cada accidente.', [
    'coxal-eips',
    'coxal-escotadura-mayor',
    'coxal-espina-ciatica',
    'coxal-escotadura-menor',
    'coxal-tuberosidad-isquiatica',
    'coxal-rama-isquiopubica',
  ]),
  lamina('coxal-interna', 'pelvis', 'coxal', 'medial', 'Hueso coxal, cara interna: nombra lo señalado.', ['coxal-fosa-iliaca', 'coxal-superficie-auricular', 'coxal-agujero-obturador', 'ilion', 'isquion', 'pubis']),
  lamina('sacro-anterior', 'pelvis', 'pelvis', 'anterior', 'Sacro, vista anterior: pon el nombre a cada parte.', [...s('promontory ala anterior_foramina transverse_lines'), 'coccix'], { only: SOLO_SACRO }),
  lamina('sacro-posterior', 'pelvis', 'pelvis', 'posterior', 'Sacro, vista posterior: pon el nombre a cada parte.', s('superior_articular_process sacral_canal median_crest lateral_crests posterior_foramina sacral_hiatus'), { only: SOLO_SACRO }),

  // ── Fémur ──
  lamina('femur-anterior', 'miembro-inferior', 'femur', 'anterior', 'Fémur, vista anterior: pon el nombre a cada parte.', f('head neck greater_trochanter intertrochanteric_line shaft lateral_epicondyle medial_epicondyle patellar_surface')),
  lamina('femur-posterior', 'miembro-inferior', 'femur', 'posterior', 'Fémur, vista posterior: pon el nombre a cada parte.', f('head greater_trochanter lesser_trochanter intertrochanteric_crest linea_aspera lateral_condyle medial_condyle intercondylar_fossa')),
  lamina('femur-proximal', 'miembro-inferior', 'femur', 'posterior', 'Epífisis proximal del fémur: nombra sus partes.', f('head fovea_capitis neck greater_trochanter lesser_trochanter intertrochanteric_crest gluteal_tuberosity'), {
    zoom: true,
    explanation: 'Cabeza, cuello, trocánter mayor y trocánter menor; por detrás los une la cresta intertrocantérica.',
  }),

  // ── Tibia y peroné ──
  lamina('tibia-anterior', 'miembro-inferior', 'tibia', 'anterior', 'Tibia, cara anterior: pon el nombre a cada parte.', t('lateral_condyle medial_condyle tibial_tuberosity anterior_crest medial_surface medial_malleolus')),
  lamina('tibia-posterior', 'miembro-inferior', 'tibia', 'posterior', 'Tibia, cara posterior: pon el nombre a cada parte.', t('medial_condyle lateral_condyle intercondylar_eminence soleal_line posterior_surface medial_malleolus')),
  lamina('perone', 'miembro-inferior', 'perone', 'lateral', 'Peroné: pon el nombre a cada parte.', p('head apex neck lateral_surface lateral_malleolus')),
  lamina('pierna-huesos', 'miembro-inferior', 'pierna-huesos', 'anterior', 'Tibia y peroné: nombra lo señalado.', [...t('lateral_condyle medial_condyle tibial_tuberosity medial_malleolus'), ...p('head lateral_malleolus')], {
    only: [...t('medial_condyle lateral_condyle glenoid_cavities intercondylar_eminence tibial_tuberosity fibular_facet anterior_crest medial_surface lateral_surface posterior_surface soleal_line nutrient_foramen distal_end medial_malleolus fibular_notch talar_facet'), ...p('head apex neck lateral_surface medial_surface interosseous_border anterior_border lateral_malleolus malleolar_facet')],
  }),
  lamina('rodilla', 'miembro-inferior', 'pierna-huesos', 'anterior', 'Articulación de la rodilla: nombra los huesos y superficies que la forman.', [...f('lateral_condyle medial_condyle patellar_surface'), ...t('lateral_condyle medial_condyle tibial_tuberosity'), 'rotula'], {
    zoom: true,
    only: [...f('shaft supracondylar_lines adductor_tubercle medial_epicondyle lateral_epicondyle medial_condyle lateral_condyle intercondylar_fossa patellar_surface linea_aspera'), 'rotula', ...t('medial_condyle lateral_condyle glenoid_cavities intercondylar_eminence tibial_tuberosity fibular_facet anterior_crest medial_surface lateral_surface posterior_surface soleal_line'), ...p('head apex neck lateral_surface medial_surface interosseous_border anterior_border')],
    explanation: 'La forman los cóndilos del fémur, los cóndilos de la tibia, los cartílagos semilunares (meniscos) y la rótula. El peroné no participa.',
  }),
]

const texto: Question[] = [
  // ───────────── Generalidades (apuntes) ─────────────
  { id: 'c:gen:epifisis', type: 'write', region: 'general', prompt: '¿Cómo se llaman las partes ensanchadas y terminales de un hueso largo?', accept: ['epífisis', 'epifisis proximal y distal'], explanation: 'Hay una proximal y otra distal.' },
  { id: 'c:gen:diafisis', type: 'write', region: 'general', prompt: '¿Cómo se llama la zona alargada de un hueso largo, la «caña»?', accept: ['diáfisis'] },
  { id: 'c:gen:metafisis', type: 'choice', region: 'general', prompt: '¿Qué parte del hueso es la unión entre la epífisis y la diáfisis, útil para estimar la edad?', options: ['Metáfisis', 'Apófisis', 'Periostio', 'Médula'], answer: 0, explanation: 'Ahí está el cartílago de crecimiento, que se va cerrando con la edad.' },
  { id: 'c:gen:apofisis', type: 'choice', region: 'general', prompt: '¿Qué es una apófisis?', options: ['Un saliente del hueso', 'El extremo ensanchado de un hueso largo', 'El cuerpo de un hueso largo', 'Un orificio para vasos'], answer: 0 },
  { id: 'c:gen:partes', type: 'list', region: 'general', prompt: 'Escribe las tres partes de un hueso largo.', items: [{ label: 'Epífisis' }, { label: 'Diáfisis' }, { label: 'Metáfisis' }], explanation: 'Epífisis (extremos), diáfisis (cuerpo) y metáfisis (unión entre ambas).' },
  { id: 'c:gen:206', type: 'choice', region: 'general', prompt: '¿Cuántos huesos tiene el esqueleto de un adulto?', options: ['206', '186', '226', '300'], answer: 0 },
  { id: 'c:gen:estribo', type: 'write', region: 'general', prompt: '¿Cuál es el hueso más pequeño del cuerpo, situado en el oído medio?', accept: ['estribo'] },
  { id: 'c:gen:estatura', type: 'write', region: 'general', prompt: '¿Qué hueso se usa para determinar la estatura?', accept: ['fémur'] },
  { id: 'c:gen:sexo', type: 'choice', region: 'general', prompt: '¿Qué parte del esqueleto se usa principalmente para determinar el sexo?', options: ['La pelvis', 'El fémur', 'La escápula', 'La columna'], answer: 0 },
  { id: 'c:gen:medula', type: 'choice', region: 'general', prompt: '¿Qué se encuentra en la médula ósea?', options: ['Las células sanguíneas', 'El líquido sinovial', 'Las fibras musculares', 'El cartílago articular'], answer: 0, explanation: 'En la médula ósea se forman las células de la sangre: la línea roja (eritrocitos) y la línea blanca (leucocitos).' },
  { id: 'c:gen:eritrocitos', type: 'choice', region: 'general', prompt: '¿Qué función tienen los eritrocitos?', options: ['Transportar oxígeno mediante la hemoglobina', 'Combatir patógenos', 'Regenerar tejidos', 'Producir anticuerpos'], answer: 0, explanation: 'La hemoglobina contiene hierro (Fe) y es la que transporta el oxígeno.' },
  { id: 'c:gen:leucocitos', type: 'choice', region: 'general', prompt: '¿A qué sistema pertenecen los leucocitos (células blancas)?', options: ['Al sistema inmune', 'Al sistema endocrino', 'Al sistema nervioso', 'Al sistema digestivo'], answer: 0 },
  { id: 'c:gen:leucocitos-lista', type: 'multi', region: 'general', prompt: '¿Cuáles de estas células son leucocitos?', options: ['Linfocitos', 'Basófilos', 'Monocitos', 'Macrófagos', 'Eritrocitos', 'Plaquetas'], answers: [0, 1, 2, 3] },
  { id: 'c:gen:plaquetas', type: 'choice', region: 'general', prompt: '¿Qué hacen las plaquetas, que flotan en el plasma sanguíneo?', options: ['Aportan factores de crecimiento que reparan los tejidos', 'Transportan oxígeno', 'Fabrican anticuerpos', 'Almacenan calcio'], answer: 0 },
  { id: 'c:gen:diartrosis', type: 'write', region: 'general', prompt: '¿Cómo se llaman las articulaciones móviles, las que permiten muchos movimientos?', accept: ['diartrosis'] },
  { id: 'c:gen:semimoviles', type: 'choice', region: 'general', prompt: '¿Dónde hay un ejemplo de articulaciones semimóviles, que solo permiten ciertos movimientos?', options: ['En la columna vertebral', 'En el hombro', 'En la cadera', 'En la rodilla'], answer: 0 },
  { id: 'c:gen:arterias', type: 'choice', region: 'general', prompt: '¿Qué sangre llevan las arterias y de qué color se representa?', options: ['Oxigenada, roja', 'Sin oxígeno, rojo oscuro', 'Oxigenada, azul', 'Sin oxígeno, roja'], answer: 0, explanation: 'Las venas llevan sangre sin oxígeno, de color rojo oscuro.' },

  // ───────────── Caja torácica (apuntes) ─────────────
  { id: 'c:tronco:protege', type: 'multi', region: 'tronco', prompt: '¿Qué órganos protege la caja torácica?', options: ['Corazón', 'Pulmones', 'Riñones', 'Estómago'], answers: [0, 1] },
  { id: 'c:tronco:louis', type: 'choice', region: 'tronco', prompt: '¿Qué es el ángulo de Louis?', options: ['La unión del manubrio con el cuerpo del esternón', 'El extremo inferior del esternón', 'El ángulo posterior de una costilla', 'La unión de la clavícula con el acromion'], answer: 0 },
  { id: 'c:tronco:horquilla', type: 'write', region: 'tronco', prompt: '¿Con qué otro nombre se conoce la escotadura yugular del esternón?', accept: ['horquilla esternal', 'horquilla'], explanation: 'Está en el borde superior del manubrio.' },
  { id: 'c:tronco:falsas', type: 'choice', region: 'tronco', prompt: '¿A qué se unen las costillas falsas (8.ª, 9.ª y 10.ª)?', options: ['Al cartílago de la 7.ª costilla', 'Directamente al esternón', 'A nada: quedan libres', 'A la clavícula'], answer: 0 },
  { id: 'c:tronco:flotantes', type: 'choice', region: 'tronco', prompt: '¿Qué caracteriza a las costillas flotantes?', options: ['Son dos pares, no tienen cartílago hacia el esternón y protegen los riñones', 'Son tres pares y se unen a la 7.ª costilla', 'Son siete pares y llegan al esternón', 'Se articulan con la clavícula'], answer: 0 },
  { id: 'c:tronco:costilla-partes', type: 'list', region: 'tronco', prompt: 'Escribe las cuatro partes de una costilla, de atrás adelante.', items: [{ label: 'Cabeza costal', accept: ['cabeza'] }, { label: 'Tuberosidad costal', accept: ['tuberosidad', 'tubérculo costal', 'tubérculo'] }, { label: 'Ángulo costal', accept: ['ángulo'] }, { label: 'Extremo esternal', accept: ['extremo anterior'] }], explanation: 'El extremo esternal es el que se conecta con el cartílago costal.' },
  { id: 'c:tronco:cuarta', type: 'choice', region: 'tronco', prompt: '¿Qué costilla se usa para estimar la edad?', options: ['La 4.ª', 'La 1.ª', 'La 7.ª', 'La 12.ª'], answer: 0 },
  { id: 'c:tronco:septima', type: 'choice', region: 'tronco', prompt: 'Según los apuntes de clase, ¿cuál es la costilla más ancha?', options: ['La 7.ª', 'La 1.ª', 'La 4.ª', 'La 12.ª'], answer: 0 },
  { id: 'c:tronco:33', type: 'choice', region: 'tronco', prompt: '¿Cuántas vértebras forman la columna vertebral?', options: ['33', '24', '26', '31'], answer: 0, explanation: '7 cervicales, 12 torácicas, 5 lumbares, 5 sacras (el sacro) y 4 coccígeas (el coxis).' },
  { id: 'c:tronco:atipicas', type: 'list', region: 'tronco', prompt: 'Escribe las tres vértebras cervicales atípicas.', items: [{ label: 'Atlas', accept: ['c1'] }, { label: 'Axis', accept: ['c2'] }, { label: 'C7 (vértebra prominente)', accept: ['c7', 'vértebra prominente', 'prominente', 'séptima cervical'] }] },
  { id: 'c:tronco:atlas-partes', type: 'multi', region: 'tronco', prompt: '¿Qué posee el atlas, la primera vértebra cervical?', options: ['Un arco anterior y otro posterior', 'Tubérculo anterior y tubérculo posterior', 'Agujero transverso', 'Apófisis odontoides', 'Cuerpo vertebral'], answers: [0, 1, 2], explanation: 'Es una vértebra atípica, sin cuerpo. La apófisis odontoides pertenece al axis.' },
  { id: 'c:tronco:odontoides', type: 'write', region: 'tronco', prompt: '¿Cómo se llama la apófisis característica del axis?', accept: ['apófisis odontoides', 'odontoides', 'diente', 'diente del axis'] },
  { id: 'c:tronco:cervical-tipica', type: 'multi', region: 'tronco', prompt: '¿Qué presentan las vértebras cervicales típicas (de la 3.ª a la 6.ª)?', options: ['Agujero vertebral triangular', 'Agujero transverso en la apófisis transversa', 'Apófisis espinosa bífida', 'Carilla articular para la costilla', 'Cuerpo en forma de riñón'], answers: [0, 1, 2] },
  { id: 'c:tronco:toracica', type: 'choice', region: 'tronco', prompt: '¿Qué distingue a una vértebra torácica?', options: ['Agujero vertebral circular y carilla articular para la costilla', 'Apófisis espinosa bífida', 'Cuerpo en forma de riñón', 'Agujero transverso'], answer: 0 },
  { id: 'c:tronco:lumbar', type: 'choice', region: 'tronco', prompt: '¿Cómo es una vértebra lumbar?', options: ['Cuerpo en forma de riñón, apófisis espinosa en forma de hacha y agujero triangular', 'Cuerpo pequeño y apófisis espinosa bífida', 'Agujero circular y carillas costales', 'Sin cuerpo, con dos arcos'], answer: 0 },
  { id: 'c:tronco:promontorio', type: 'choice', region: 'tronco', prompt: '¿Con qué articula el promontorio del sacro?', options: ['Con la 5.ª vértebra lumbar', 'Con el coxis', 'Con el ilion', 'Con la 12.ª torácica'], answer: 0 },
  { id: 'c:tronco:canal-sacro', type: 'write', region: 'tronco', prompt: '¿Cómo se denomina el orificio vertebral del sacro?', accept: ['conducto sacro', 'canal sacro', 'conducto o canal sacro'] },
  { id: 'c:tronco:coxis', type: 'choice', region: 'tronco', prompt: '¿Cuántas piezas forman el coxis?', options: ['4, a veces 5', '2', '7', '5, a veces 6'], answer: 0, explanation: 'Es corto, impar, central y de forma triangular: la última porción de la columna.' },
  { id: 'c:tronco:sacroiliaca', type: 'write', region: 'tronco', prompt: '¿Cómo se llama la articulación entre el sacro y los coxales?', accept: ['sacroilíaca', 'articulación sacroilíaca', 'sacro iliaca'] },
  { id: 'c:tronco:trauma', type: 'choice', region: 'tronco', prompt: 'En un traumatismo de columna, ¿cuándo es más grave la lesión?', options: ['Cuanto más arriba se produce', 'Cuanto más abajo se produce', 'Solo si afecta al sacro', 'La altura no influye'], answer: 0 },

  // ───────────── Cintura escapular ─────────────
  { id: 'c:ce:subescapular', type: 'write', region: 'cintura-escapular', prompt: '¿Cómo se llama la fosa que ocupa casi toda la cara anterior de la escápula?', accept: ['fosa subescapular', 'subescapular'], explanation: 'La atraviesan tres o cuatro crestas que irradian desde el cuello hacia el borde medial.' },
  { id: 'c:ce:espina', type: 'choice', region: 'cintura-escapular', prompt: '¿Qué saliente divide la cara posterior de la escápula en dos fosas?', options: ['La espina de la escápula', 'El acromion', 'La apófisis coracoides', 'El cuello'], answer: 0, explanation: 'Por encima queda la fosa supraespinosa y por debajo, la infraespinosa.' },
  { id: 'c:ce:glenoidea-lado', type: 'choice', region: 'cintura-escapular', prompt: '¿Hacia dónde mira la cavidad glenoidea de la escápula?', options: ['Hacia lateral', 'Hacia medial', 'Hacia abajo', 'Hacia atrás'], answer: 0 },
  { id: 'c:ce:manguito', type: 'choice', region: 'cintura-escapular', prompt: '¿Qué es el manguito de los rotadores?', options: ['El conjunto de músculos y tendones que dan estabilidad al hombro', 'El cartílago de la cavidad glenoidea', 'El ligamento entre clavícula y acromion', 'La cápsula del codo'], answer: 0, explanation: 'Sus músculos conectan la escápula con la cabeza del húmero.' },
  { id: 'c:ce:clavicula-extremos', type: 'list', region: 'cintura-escapular', prompt: 'Escribe los dos extremos de la clavícula.', items: [{ label: 'Extremo esternal', accept: ['esternal', 'extremidad esternal'] }, { label: 'Extremo acromial', accept: ['acromial', 'extremidad acromial'] }], explanation: 'El esternal se une al manubrio del esternón y el acromial, a la escápula.' },
  { id: 'c:ce:subclavio', type: 'choice', region: 'cintura-escapular', prompt: '¿Hacia dónde mira el surco subclavio de la clavícula?', options: ['Hacia abajo', 'Hacia arriba', 'Hacia delante', 'Hacia atrás'], answer: 0, explanation: 'Está en la cara inferior: sirve para orientar el hueso.' },

  // ───────────── Brazo y antebrazo ─────────────
  { id: 'c:ms:troquiter', type: 'write', region: 'miembro-superior', prompt: '¿Cómo se llama la tuberosidad mayor del húmero?', accept: ['troquíter', 'tubérculo mayor'] },
  { id: 'c:ms:troquin', type: 'write', region: 'miembro-superior', prompt: '¿Cómo se llama la tuberosidad menor del húmero?', accept: ['troquín', 'tubérculo menor'] },
  { id: 'c:ms:cuello-edad', type: 'choice', region: 'miembro-superior', prompt: '¿Qué zona del húmero se calcifica más con la edad?', options: ['El cuello quirúrgico', 'La tróclea', 'El troquín', 'La fosa olecraniana'], answer: 0 },
  { id: 'c:ms:fosa', type: 'choice', region: 'miembro-superior', prompt: '¿Hacia dónde mira la fosa olecraniana del húmero?', options: ['Hacia atrás', 'Hacia delante', 'Hacia lateral', 'Hacia medial'], answer: 0, explanation: 'Es el hueco donde encaja el olécranon del cúbito: el codo inicia ahí.' },
  { id: 'c:ms:epitroclea', type: 'choice', region: 'miembro-superior', prompt: '¿Hacia dónde mira la epitróclea del húmero?', options: ['Hacia adentro (medial)', 'Hacia afuera (lateral)', 'Hacia atrás', 'Hacia arriba'], answer: 0 },
  { id: 'c:ms:distal-lista', type: 'list', region: 'miembro-superior', prompt: 'Escribe las cuatro partes de la epífisis distal del húmero.', items: [{ label: 'Epitróclea', accept: ['epicóndilo medial'] }, { label: 'Tróclea' }, { label: 'Cóndilo humeral', accept: ['cóndilo', 'capítulo'] }, { label: 'Epicóndilo lateral', accept: ['epicóndilo'] }] },
  {
    id: 'c:ms:radio-humero',
    type: 'choice',
    region: 'miembro-superior',
    prompt: '¿Con qué parte del húmero articula la cabeza del radio?',
    options: ['Con el cóndilo, junto al epicóndilo lateral', 'Con la tróclea', 'Con la epitróclea', 'Con la fosa olecraniana'],
    answer: 0,
    explanation: 'En los apuntes de clase aparece como «el radio articula con el epicóndilo»: la superficie exacta es el cóndilo humeral (capítulo), que queda pegado al epicóndilo lateral.',
  },
  { id: 'c:ms:olecranon', type: 'choice', region: 'miembro-superior', prompt: '¿Con qué articula el olécranon del cúbito?', options: ['Con la fosa olecraniana del húmero', 'Con la cabeza del radio', 'Con el escafoides', 'Con la cavidad glenoidea'], answer: 0 },
  { id: 'c:ms:cubito-carpo', type: 'choice', region: 'miembro-superior', prompt: '¿Qué hueso del antebrazo NO articula con los huesos del carpo?', options: ['El cúbito', 'El radio', 'Los dos articulan', 'Ninguno articula'], answer: 0, explanation: 'En distal el cúbito tiene apófisis estiloides y una carilla para el radio, pero no llega al carpo.' },
  { id: 'c:ms:radio-forma', type: 'choice', region: 'miembro-superior', prompt: '¿Cómo cambia el grosor del radio a lo largo del hueso?', options: ['Es angosto en proximal y se ensancha en distal', 'Es ancho en proximal y se estrecha en distal', 'Es igual de ancho en todo su recorrido', 'Es más ancho en el centro'], answer: 0, explanation: 'Al revés que el cúbito.' },
  { id: 'c:ms:radio-proximal', type: 'list', region: 'miembro-superior', prompt: 'Escribe las tres partes de la epífisis proximal del radio.', items: [{ label: 'Cabeza' }, { label: 'Cuello' }, { label: 'Tuberosidad radial', accept: ['tuberosidad', 'tuberosidad del radio'] }] },
  { id: 'c:ms:radio-distal', type: 'list', region: 'miembro-superior', prompt: 'Escribe las tres partes de la epífisis distal del radio.', items: [{ label: 'Escotadura cubital' }, { label: 'Apófisis estiloides', accept: ['estiloides'] }, { label: 'Superficie articular carpiana', accept: ['carilla articular carpiana', 'superficie carpiana'] }] },
  { id: 'c:ms:cabeza-radio', type: 'choice', region: 'miembro-superior', prompt: '¿Qué forma tiene la cabeza del radio?', options: ['De plato', 'De gancho', 'De polea', 'De esfera'], answer: 0 },
  { id: 'c:ms:flexores', type: 'multi', region: 'miembro-superior', prompt: '¿Qué músculos flexores ocupan la cara anterior del brazo?', options: ['Bíceps braquial', 'Coracobraquial', 'Braquial anterior', 'Tríceps braquial'], answers: [0, 1, 2], explanation: 'Los inerva el nervio musculocutáneo. En la cara posterior está el extensor: el tríceps braquial.' },

  // ───────────── Mano ─────────────
  { id: 'c:mano:esqueleto', type: 'list', region: 'mano', prompt: 'Escribe las tres partes del esqueleto de la mano.', items: [{ label: 'Carpo', accept: ['carpos', 'carpianos'] }, { label: 'Metacarpo', accept: ['metacarpos', 'metacarpianos'] }, { label: 'Falanges', accept: ['dedos'] }] },
  { id: 'c:mano:falanges', type: 'list', region: 'mano', prompt: 'Escribe los tres tipos de falange de un dedo.', items: [{ label: 'Proximal', accept: ['falange proximal', 'falange'] }, { label: 'Media', accept: ['medial', 'falange media', 'falangina'] }, { label: 'Distal', accept: ['falange distal', 'falangeta'] }], explanation: 'También se llaman falange, falangina y falangeta. El dedo número 1 solo tiene dos.' },
  { id: 'c:mano:orden', type: 'choice', region: 'mano', prompt: 'En la hilera superior del carpo, ¿cuál es el orden correcto?', options: ['Escafoides, semilunar, piramidal, pisiforme', 'Trapecio, trapezoide, grande, ganchoso', 'Escafoides, trapecio, semilunar, grande', 'Pisiforme, piramidal, ganchoso, grande'], answer: 0, explanation: 'La hilera inferior es: trapecio, trapezoide, grande y ganchoso.' },

  // ───────────── Pelvis ─────────────
  { id: 'c:pelvis:bordes', type: 'choice', region: 'pelvis', prompt: '¿Qué se encuentra en el borde superior del hueso coxal?', options: ['La cresta ilíaca', 'La tuberosidad isquiática', 'La rama isquiopúbica', 'El agujero obturador'], answer: 0 },
  { id: 'c:pelvis:externa', type: 'multi', region: 'pelvis', prompt: '¿Qué se observa en la superficie externa del coxal?', options: ['El acetábulo', 'El agujero obturador', 'La fosa ilíaca', 'La superficie articular para el sacro'], answers: [0, 1], explanation: 'La fosa ilíaca y la superficie articular para el sacro están en la superficie interna.' },
  { id: 'c:pelvis:acetabulo', type: 'choice', region: 'pelvis', prompt: '¿Para qué sirve el acetábulo?', options: ['Es donde encaja la cabeza del fémur', 'Da paso al nervio ciático', 'Articula con el sacro', 'Es donde nos apoyamos al sentarnos'], answer: 0 },
  {
    id: 'c:pelvis:obturador',
    type: 'choice',
    region: 'pelvis',
    prompt: '¿Qué pasa por el agujero obturador?',
    options: ['El nervio y los vasos obturadores', 'La médula espinal', 'El nervio ciático', 'La uretra'],
    answer: 0,
    explanation: 'En los apuntes figura «paso de arteria femoral»: lo que lo atraviesa es el paquete obturador (nervio, arteria y vena obturadores). La arteria femoral pasa por delante, bajo el ligamento inguinal.',
  },
  { id: 'c:pelvis:pubis-edad', type: 'choice', region: 'pelvis', prompt: 'Según los apuntes, ¿para qué sirve el pubis en la identificación?', options: ['Para estimar la edad', 'Para estimar la estatura', 'Para saber el lado', 'Para estimar el peso'], answer: 0, explanation: 'Se estudia la sínfisis pubiana. El isquion ayuda a saber si el coxal es derecho o izquierdo.' },
  { id: 'c:pelvis:borde-lista', type: 'list', region: 'pelvis', prompt: 'Recorriendo el borde del coxal de arriba abajo, escribe los cuatro accidentes que siguen a las espinas ilíacas.', items: [{ label: 'Escotadura ciática mayor' }, { label: 'Espina ciática' }, { label: 'Escotadura ciática menor' }, { label: 'Tuberosidad isquiática' }] },

  // ───────────── Muslo y pierna ─────────────
  { id: 'c:mi:proximal', type: 'list', region: 'miembro-inferior', prompt: 'Escribe las cuatro partes de la epífisis proximal del fémur.', items: [{ label: 'Cabeza' }, { label: 'Cuello' }, { label: 'Trocánter mayor' }, { label: 'Trocánter menor' }] },
  { id: 'c:mi:distal', type: 'multi', region: 'miembro-inferior', prompt: '¿Qué presenta la epífisis distal del fémur?', options: ['Cóndilos externo e interno', 'Epicóndilos externo e interno', 'Fosa intercondílea', 'Superficie poplítea', 'Trocánter menor'], answers: [0, 1, 2, 3] },
  { id: 'c:mi:aspera', type: 'choice', region: 'miembro-inferior', prompt: '¿En qué cara del fémur está la línea áspera?', options: ['En la posterior', 'En la anterior', 'En la lateral', 'En la medial'], answer: 0 },
  { id: 'c:mi:intercondilea', type: 'choice', region: 'miembro-inferior', prompt: '¿Dónde está la fosa (o surco) intercondílea del fémur?', options: ['Entre los dos cóndilos', 'Entre los dos trocánteres', 'Bajo la cabeza', 'Sobre la rótula'], answer: 0 },
  { id: 'c:mi:rotuliana', type: 'write', region: 'miembro-inferior', prompt: '¿Cómo se llama la superficie del fémur sobre la que se desliza la rótula?', accept: ['carilla rotuliana', 'superficie rotuliana', 'cara rotuliana'] },
  { id: 'c:mi:cadera', type: 'choice', region: 'miembro-inferior', prompt: '¿Entre qué estructuras se realiza la articulación fémur-cadera?', options: ['La cabeza del fémur y el acetábulo', 'El trocánter mayor y el ilion', 'El cuello del fémur y el pubis', 'Los cóndilos y el isquion'], answer: 0 },
  { id: 'c:mi:tibia-proximal', type: 'multi', region: 'miembro-inferior', prompt: '¿Qué presenta la tibia en proximal?', options: ['Cóndilos interno y externo', 'Eminencia intercondílea', 'Tuberosidad de la tibia', 'Carilla articular para el peroné', 'Maléolo interno'], answers: [0, 1, 2, 3], explanation: 'El maléolo interno está en distal, junto con la escotadura peronea.' },
  { id: 'c:mi:espinilla', type: 'write', region: 'miembro-inferior', prompt: '¿Con qué nombre común se conoce el borde anterior prominente de la tibia?', accept: ['espinilla'] },
  { id: 'c:mi:maleolo-interno', type: 'choice', region: 'miembro-inferior', prompt: '¿A qué hueso pertenece el maléolo interno, el tobillo de dentro?', options: ['A la tibia', 'Al peroné', 'Al astrágalo', 'Al calcáneo'], answer: 0, explanation: 'El maléolo externo es del peroné.' },
  { id: 'c:mi:tibia-tamano', type: 'choice', region: 'miembro-inferior', prompt: '¿Dónde se ubica la tibia y cómo es respecto al peroné?', options: ['En la parte interna de la pierna; es más grande', 'En la parte externa; es más delgada', 'En la parte interna; es más delgada', 'En la parte externa; es más grande'], answer: 0 },
  { id: 'c:mi:perone-partes', type: 'multi', region: 'miembro-inferior', prompt: '¿Qué presenta el peroné?', options: ['Cabeza y apófisis estiloides en proximal', 'Maléolo externo en distal', 'Borde interno interóseo en la diáfisis', 'Tuberosidad anterior', 'Cóndilos'], answers: [0, 1, 2] },
  { id: 'c:mi:rodilla', type: 'multi', region: 'miembro-inferior', prompt: '¿Qué forma la articulación de la rodilla?', options: ['Cóndilos del fémur', 'Cóndilos de la tibia', 'Cartílagos semilunares', 'Rótula', 'Cabeza del peroné'], answers: [0, 1, 2, 3] },
  { id: 'c:mi:tobillo', type: 'choice', region: 'miembro-inferior', prompt: '¿Qué ligamento del tobillo es el más débil?', options: ['El lateral', 'El medial', 'El anterior', 'El posterior'], answer: 0, explanation: 'El tobillo está entre el extremo inferior de la tibia, los maléolos interno y externo y el cuerpo del astrágalo.' },

  // ───────────── Pie ─────────────
  { id: 'c:pie:metatarso', type: 'list', region: 'pie', prompt: 'Escribe las tres partes de cada metatarsiano.', items: [{ label: 'Epífisis proximal', accept: ['base'] }, { label: 'Diáfisis', accept: ['cuerpo'] }, { label: 'Epífisis distal o cabeza', accept: ['epífisis distal', 'cabeza'] }] },
  { id: 'c:pie:artejos', type: 'choice', region: 'pie', prompt: '¿Cómo se llaman los dedos del pie?', options: ['Artejos', 'Falangetas', 'Cuñas', 'Maléolos'], answer: 0, explanation: 'Cada uno tiene tres falanges, salvo el dedo gordo, que tiene dos.' },
  { id: 'c:pie:primer-tarso', type: 'choice', region: 'pie', prompt: '¿Qué hueso del tarso recibe a la tibia y al peroné?', options: ['El astrágalo', 'El calcáneo', 'El escafoides', 'El cuboides'], answer: 0 },
  { id: 'c:pie:cunas', type: 'choice', region: 'pie', prompt: '¿Cuántas cuñas (cuneiformes) tiene el tarso?', options: ['3', '2', '4', '5'], answer: 0, explanation: 'Medial, intermedia y lateral.' },
]

export const preguntasDeClase: Question[] = [...laminas, ...texto]
