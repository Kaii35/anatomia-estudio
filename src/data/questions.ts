import type { Question, RegionId } from '../types'
import { hashString, normalize, seededRandom, shuffle } from '../lib/text'
import { boneById, bones } from './bones'
import { models } from './models'
import { partName, partRegion } from './parts'

/**
 * PREGUNTAS ESCRITAS A MANO
 * Tipos: 'choice' (una correcta), 'multi' (varias correctas), 'write' (respuesta
 * escrita), 'list' (enumerar varios elementos) e 'identify' (seleccionar en el modelo 3D).
 * Cualquier pregunta admite `image: 'img/archivo.jpg'` (dentro de /public).
 * Las opciones se barajan solas; `answer`/`answers` son índices sobre el orden escrito aquí.
 */
const handmade: Question[] = [
  // ───────────── Cráneo ─────────────
  {
    id: 'h:craneo:neuro-n',
    type: 'choice',
    region: 'craneo',
    prompt: '¿Cuántos huesos forman el neurocráneo?',
    options: ['8', '6', '14', '22'],
    answer: 0,
    explanation: 'Ocho: frontal, occipital, esfenoides y etmoides (impares) más dos parietales y dos temporales.',
  },
  {
    id: 'h:craneo:neuro-list',
    type: 'list',
    region: 'craneo',
    prompt: 'Escribe los 6 huesos distintos que forman el neurocráneo.',
    items: [
      { label: 'Frontal' },
      { label: 'Parietal', accept: ['parietales'] },
      { label: 'Temporal', accept: ['temporales'] },
      { label: 'Occipital' },
      { label: 'Esfenoides' },
      { label: 'Etmoides' },
    ],
    explanation: 'Parietales y temporales son pares; por eso 6 nombres dan 8 huesos.',
  },
  {
    id: 'h:craneo:viscero-list',
    type: 'list',
    region: 'craneo',
    prompt: 'Escribe los 8 huesos distintos del viscerocráneo (esqueleto de la cara).',
    items: [
      { label: 'Maxilar', accept: ['maxilares', 'maxilar superior'] },
      { label: 'Cigomático', accept: ['cigomaticos', 'malar', 'malares', 'zigomatico'] },
      { label: 'Nasal', accept: ['nasales', 'huesos propios de la nariz'] },
      { label: 'Lagrimal', accept: ['lagrimales', 'lacrimal', 'unguis'] },
      { label: 'Palatino', accept: ['palatinos'] },
      { label: 'Cornete nasal inferior', accept: ['cornete inferior', 'cornetes inferiores', 'concha nasal inferior'] },
      { label: 'Vómer' },
      { label: 'Mandíbula', accept: ['maxilar inferior'] },
    ],
    explanation: 'Seis son pares y dos impares (vómer y mandíbula): 14 huesos en total.',
  },
  {
    id: 'h:craneo:impares-cara',
    type: 'multi',
    region: 'craneo',
    prompt: '¿Cuáles de estos huesos de la cara son impares?',
    options: ['Vómer', 'Mandíbula', 'Maxilar', 'Palatino', 'Lagrimal'],
    answers: [0, 1],
  },
  {
    id: 'h:craneo:sutura-coronal',
    type: 'choice',
    region: 'craneo',
    prompt: '¿Qué huesos une la sutura coronal?',
    options: ['El frontal con los parietales', 'Los dos parietales entre sí', 'Los parietales con el occipital', 'El temporal con el parietal'],
    answer: 0,
    explanation: 'Sagital: entre los parietales. Lambdoidea: parietales con occipital. Escamosa: temporal con parietal.',
  },
  {
    id: 'h:craneo:sutura-sagital',
    type: 'write',
    region: 'craneo',
    prompt: '¿Cómo se llama la sutura que une los dos parietales entre sí?',
    accept: ['sagital', 'sutura sagital'],
  },
  {
    id: 'h:craneo:lambdoidea',
    type: 'write',
    region: 'craneo',
    prompt: '¿Qué sutura une los parietales con el occipital?',
    accept: ['lambdoidea', 'sutura lambdoidea', 'lamboidea', 'lambdoide'],
  },
  {
    id: 'h:craneo:bregma',
    type: 'choice',
    region: 'craneo',
    prompt: 'El bregma es el punto donde se encuentran las suturas…',
    options: ['Coronal y sagital', 'Sagital y lambdoidea', 'Coronal y escamosa', 'Lambdoidea y escamosa'],
    answer: 0,
    explanation: 'El punto donde se unen la sagital y la lambdoidea es el lambda.',
  },
  {
    id: 'h:craneo:pterion',
    type: 'multi',
    region: 'craneo',
    prompt: '¿Qué huesos confluyen en el pterion?',
    options: ['Frontal', 'Parietal', 'Temporal', 'Esfenoides', 'Occipital', 'Cigomático'],
    answers: [0, 1, 2, 3],
    explanation:
      'Es la zona más delgada de la pared lateral del cráneo; por dentro discurre la arteria meníngea media, por lo que un golpe aquí puede causar un hematoma epidural.',
  },
  {
    id: 'h:craneo:movil',
    type: 'write',
    region: 'craneo',
    prompt: '¿Cuál es el único hueso móvil del cráneo?',
    accept: ['mandíbula', 'maxilar inferior'],
    explanation: 'Articula con los temporales en la articulación temporomandibular (ATM).',
  },
  {
    id: 'h:craneo:hioides',
    type: 'choice',
    region: 'craneo',
    prompt: 'En un cadáver se encuentra fracturado el hioides. ¿Qué mecanismo de muerte sugiere clásicamente?',
    options: ['Estrangulación', 'Caída desde altura', 'Sumersión', 'Traumatismo craneal contuso'],
    answer: 0,
    explanation: 'Es un hallazgo típico de la compresión del cuello, sobre todo en la estrangulación manual.',
  },
  {
    id: 'h:craneo:sexo',
    type: 'multi',
    region: 'craneo',
    prompt: '¿Qué rasgos del cráneo se valoran clásicamente para estimar el sexo?',
    options: ['Apófisis mastoides', 'Glabela', 'Cresta nucal', 'Margen supraorbitario', 'Eminencia mentoniana', 'Agujero parietal'],
    answers: [0, 1, 2, 3, 4],
    explanation: 'Son los cinco rasgos que se puntúan del 1 al 5; los valores altos (más robustos) orientan a sexo masculino.',
  },
  {
    id: 'h:craneo:petrosa',
    type: 'choice',
    region: 'craneo',
    prompt: '¿Qué parte del esqueleto es de las mejores fuentes de ADN en restos muy degradados?',
    options: ['La porción petrosa del temporal', 'El cuerpo del esternón', 'La escama del frontal', 'El hueso nasal'],
    answer: 0,
    explanation: 'Su hueso es extremadamente denso y protege bien el ADN.',
  },
  {
    id: 'h:craneo:atlas',
    type: 'choice',
    region: 'craneo',
    prompt: '¿Qué estructura del cráneo articula con el atlas (C1)?',
    options: ['Los cóndilos occipitales', 'Las apófisis mastoides', 'Las apófisis estiloides', 'Las apófisis pterigoides'],
    answer: 0,
  },

  // ───────────── Cintura escapular ─────────────
  {
    id: 'h:ce:huesos',
    type: 'list',
    region: 'cintura-escapular',
    prompt: 'Escribe los dos huesos que forman la cintura escapular.',
    items: [{ label: 'Clavícula' }, { label: 'Escápula', accept: ['omóplato'] }],
  },
  {
    id: 'h:ce:identify',
    type: 'identify',
    region: 'cintura-escapular',
    model: 'esqueleto',
    prompt: 'Selecciona todos los huesos de la cintura escapular.',
    targets: ['clavicula', 'escapula'],
    all: true,
  },
  {
    id: 'h:ce:clavicula-edad',
    type: 'choice',
    region: 'cintura-escapular',
    prompt: '¿Por qué la clavícula es tan útil para estimar la edad en adultos jóvenes?',
    options: [
      'Su epífisis esternal es la última del esqueleto en fusionarse',
      'Es el último hueso en comenzar a osificarse',
      'Su longitud aumenta de forma constante hasta los 40 años',
      'Sus suturas se cierran a edades conocidas',
    ],
    answer: 0,
    explanation: 'La epífisis medial se fusiona aproximadamente entre los 21 y los 30 años. Además, es el primer hueso en iniciar su osificación.',
  },
  {
    id: 'h:ce:clavicula-art',
    type: 'multi',
    region: 'cintura-escapular',
    prompt: '¿Con qué huesos articula la clavícula?',
    options: ['Esternón', 'Escápula', 'Húmero', 'Primera vértebra torácica'],
    answers: [0, 1],
    explanation: 'Con el manubrio del esternón (medial) y con el acromion de la escápula (lateral).',
  },
  {
    id: 'h:ce:acromial',
    type: 'choice',
    region: 'cintura-escapular',
    prompt: '¿Cómo es la extremidad acromial (lateral) de la clavícula?',
    options: ['Aplanada', 'Gruesa y de sección triangular', 'Esférica', 'Bifurcada'],
    answer: 0,
    explanation: 'La extremidad esternal es la gruesa; diferenciarlas permite orientar el hueso y determinar su lado.',
  },
  {
    id: 'h:ce:glenoidea',
    type: 'write',
    region: 'cintura-escapular',
    prompt: '¿Cómo se llama la cavidad de la escápula que articula con la cabeza del húmero?',
    accept: ['cavidad glenoidea', 'glenoidea', 'glenoides', 'fosa glenoidea', 'cavidad glenoides'],
  },
  {
    id: 'h:ce:acromion',
    type: 'write',
    region: 'cintura-escapular',
    prompt: '¿Qué parte de la escápula articula con la clavícula?',
    accept: ['acromion'],
  },
  {
    id: 'h:ce:fosas',
    type: 'list',
    region: 'cintura-escapular',
    prompt: 'Escribe las tres fosas de la escápula.',
    items: [
      { label: 'Supraespinosa', accept: ['fosa supraespinosa'] },
      { label: 'Infraespinosa', accept: ['fosa infraespinosa'] },
      { label: 'Subescapular', accept: ['fosa subescapular'] },
    ],
    explanation: 'Las dos primeras están en la cara posterior, separadas por la espina; la subescapular ocupa la cara anterior.',
  },
  {
    id: 'h:ce:costillas',
    type: 'choice',
    region: 'cintura-escapular',
    prompt: '¿Entre qué costillas se sitúa normalmente la escápula?',
    options: ['2.ª y 7.ª', '1.ª y 4.ª', '5.ª y 10.ª', '3.ª y 12.ª'],
    answer: 0,
  },

  // ───────────── Brazo y antebrazo ─────────────
  {
    id: 'h:ms:huesos',
    type: 'list',
    region: 'miembro-superior',
    prompt: 'Escribe los tres huesos largos del brazo y el antebrazo.',
    items: [{ label: 'Húmero' }, { label: 'Radio' }, { label: 'Cúbito', accept: ['ulna'] }],
  },
  {
    id: 'h:ms:antebrazo-identify',
    type: 'identify',
    region: 'miembro-superior',
    model: 'esqueleto',
    prompt: 'Selecciona los dos huesos del antebrazo.',
    targets: ['radio', 'cubito'],
    all: true,
  },
  {
    id: 'h:ms:lateral',
    type: 'choice',
    region: 'miembro-superior',
    prompt: 'En posición anatómica, ¿qué hueso del antebrazo es lateral (del lado del pulgar)?',
    options: ['Radio', 'Cúbito', 'Húmero', 'Escafoides'],
    answer: 0,
  },
  {
    id: 'h:ms:troclea',
    type: 'choice',
    region: 'miembro-superior',
    prompt: '¿Con qué articula la tróclea del húmero?',
    options: ['Con la escotadura troclear del cúbito', 'Con la cabeza del radio', 'Con la cavidad glenoidea', 'Con el escafoides'],
    answer: 0,
    explanation: 'La cabeza del radio articula con el capítulo (cóndilo) del húmero.',
  },
  {
    id: 'h:ms:cuello-quirurgico',
    type: 'write',
    region: 'miembro-superior',
    prompt: '¿Qué zona del húmero proximal se fractura con más frecuencia y se relaciona con el nervio axilar?',
    accept: ['cuello quirúrgico', 'cuello quirurgico del humero'],
  },
  {
    id: 'h:ms:olecranon',
    type: 'write',
    region: 'miembro-superior',
    prompt: '¿Cómo se llama la prominencia del cúbito que forma la punta del codo?',
    accept: ['olécranon', 'olecranon'],
  },
  {
    id: 'h:ms:cabezas',
    type: 'choice',
    region: 'miembro-superior',
    prompt: '¿Dónde se encuentra la cabeza del cúbito?',
    options: ['En su extremo distal', 'En su extremo proximal', 'En la mitad de la diáfisis', 'El cúbito no tiene cabeza'],
    answer: 0,
    explanation: 'Al revés que en el radio, cuya cabeza es proximal.',
  },
  {
    id: 'h:ms:defensa',
    type: 'choice',
    region: 'miembro-superior',
    prompt: 'Una fractura aislada de la diáfisis del cúbito sugiere clásicamente…',
    options: [
      'Una lesión de defensa al parar un golpe con el antebrazo',
      'Una caída sobre la mano extendida',
      'Una precipitación cayendo de pie',
      'Una compresión del cuello',
    ],
    answer: 0,
    explanation: 'Es la llamada «fractura de defensa» o del bastonazo. La caída sobre la mano extendida suele fracturar el radio distal (Colles) o el escafoides.',
  },
  {
    id: 'h:ms:radio-carpo',
    type: 'multi',
    region: 'miembro-superior',
    prompt: '¿Con qué huesos del carpo articula el radio?',
    options: ['Escafoides', 'Semilunar', 'Pisiforme', 'Ganchoso', 'Trapecio'],
    answers: [0, 1],
  },
  {
    id: 'h:ms:epitroclea',
    type: 'write',
    region: 'miembro-superior',
    prompt: '¿Con qué otro nombre se conoce al epicóndilo medial del húmero?',
    accept: ['epitróclea', 'epitroclea'],
  },
  {
    id: 'h:ms:fosas',
    type: 'choice',
    region: 'miembro-superior',
    prompt: '¿Qué fosa del húmero se encuentra en su cara posterior?',
    options: ['Fosa olecraniana', 'Fosa coronoidea', 'Fosa radial', 'Fosa subescapular'],
    answer: 0,
    explanation: 'Recibe al olécranon cuando el codo está extendido. Las fosas coronoidea y radial son anteriores.',
  },

  // ───────────── Mano ─────────────
  {
    id: 'h:mano:total',
    type: 'choice',
    region: 'mano',
    prompt: '¿Cuántos huesos tiene una mano?',
    options: ['27', '26', '14', '30'],
    answer: 0,
    explanation: '8 del carpo + 5 metacarpianos + 14 falanges.',
  },
  {
    id: 'h:mano:proximal-list',
    type: 'list',
    region: 'mano',
    prompt: 'Escribe los 4 huesos de la fila proximal del carpo.',
    items: [
      { label: 'Escafoides' },
      { label: 'Semilunar', accept: ['lunado'] },
      { label: 'Piramidal', accept: ['triquetrum'] },
      { label: 'Pisiforme' },
    ],
    explanation: 'De lateral a medial: escafoides, semilunar, piramidal y pisiforme.',
  },
  {
    id: 'h:mano:distal-list',
    type: 'list',
    region: 'mano',
    prompt: 'Escribe los 4 huesos de la fila distal del carpo.',
    items: [
      { label: 'Trapecio' },
      { label: 'Trapezoide' },
      { label: 'Grande', accept: ['capitado', 'hueso grande'] },
      { label: 'Ganchoso', accept: ['hamato', 'unciforme'] },
    ],
    explanation: 'De lateral a medial: trapecio, trapezoide, grande y ganchoso.',
  },
  {
    id: 'h:mano:proximal-identify',
    type: 'identify',
    region: 'mano',
    model: 'mano',
    prompt: 'Selecciona los 4 huesos de la fila proximal del carpo.',
    targets: ['escafoides', 'semilunar', 'piramidal', 'pisiforme'],
    all: true,
  },
  {
    id: 'h:mano:distal-identify',
    type: 'identify',
    region: 'mano',
    model: 'mano',
    prompt: 'Selecciona los 4 huesos de la fila distal del carpo.',
    targets: ['trapecio', 'trapezoide', 'grande', 'ganchoso'],
    all: true,
  },
  {
    id: 'h:mano:metacarpo-identify',
    type: 'identify',
    region: 'mano',
    model: 'mano',
    prompt: 'Selecciona todos los metacarpianos.',
    targets: ['mc-1', 'mc-2', 'mc-3', 'mc-4', 'mc-5'],
    all: true,
  },
  {
    id: 'h:mano:pulgar-identify',
    type: 'identify',
    region: 'mano',
    model: 'mano',
    prompt: 'Selecciona todas las falanges del pulgar.',
    targets: ['fpm-1', 'fdm-1'],
    all: true,
    explanation: 'El pulgar solo tiene dos falanges: proximal y distal.',
  },
  {
    id: 'h:mano:falanges-n',
    type: 'choice',
    region: 'mano',
    prompt: '¿Cuántas falanges hay en una mano?',
    options: ['14', '15', '12', '10'],
    answer: 0,
    explanation: 'Tres por dedo, excepto el pulgar, que tiene dos.',
  },
  {
    id: 'h:mano:escafoides-fx',
    type: 'write',
    region: 'mano',
    prompt: '¿Qué hueso del carpo se fractura con más frecuencia?',
    accept: ['escafoides'],
    explanation: 'Típicamente al caer sobre la mano extendida; duele en la tabaquera anatómica.',
  },
  {
    id: 'h:mano:silla',
    type: 'choice',
    region: 'mano',
    prompt: '¿Con qué hueso del carpo articula el primer metacarpiano?',
    options: ['Trapecio', 'Trapezoide', 'Escafoides', 'Grande'],
    answer: 0,
    explanation: 'Es una articulación en silla de montar, que permite la oposición del pulgar.',
  },
  {
    id: 'h:mano:pisiforme',
    type: 'choice',
    region: 'mano',
    prompt: '¿Qué hueso del carpo se considera sesamoideo y es el último en osificarse?',
    options: ['Pisiforme', 'Grande', 'Semilunar', 'Trapezoide'],
    answer: 0,
  },
  {
    id: 'h:mano:mayor',
    type: 'write',
    region: 'mano',
    prompt: '¿Cuál es el hueso más grande del carpo?',
    accept: ['grande', 'capitado', 'hueso grande'],
  },

  // ───────────── Pelvis ─────────────
  {
    id: 'h:pelvis:coxal-list',
    type: 'list',
    region: 'pelvis',
    prompt: 'Escribe los tres huesos que se fusionan para formar el coxal.',
    items: [{ label: 'Ilion', accept: ['ileon'] }, { label: 'Isquion' }, { label: 'Pubis' }],
    explanation: 'Se unen en el acetábulo y se fusionan hacia los 14–16 años.',
  },
  {
    id: 'h:pelvis:acetabulo',
    type: 'write',
    region: 'pelvis',
    prompt: '¿Cómo se llama la cavidad del coxal que recibe la cabeza del fémur?',
    accept: ['acetábulo', 'cavidad cotiloidea', 'cotilo'],
  },
  {
    id: 'h:pelvis:sexo-mejor',
    type: 'choice',
    region: 'pelvis',
    prompt: '¿Qué parte del esqueleto es la más fiable para estimar el sexo en un adulto?',
    options: ['La pelvis', 'El cráneo', 'El fémur', 'La clavícula'],
    answer: 0,
    explanation: 'Sus diferencias responden a la función del parto. El cráneo es el segundo mejor indicador.',
  },
  {
    id: 'h:pelvis:femenino',
    type: 'multi',
    region: 'pelvis',
    prompt: '¿Qué rasgos de la pelvis orientan a sexo femenino?',
    options: [
      'Escotadura ciática mayor ancha',
      'Ángulo subpúbico amplio',
      'Presencia de arco ventral',
      'Surco preauricular marcado',
      'Estrecho superior en forma de corazón',
      'Acetábulo grande',
    ],
    answers: [0, 1, 2, 3],
    explanation: 'En varones la escotadura es estrecha, el ángulo subpúbico agudo, el estrecho superior acorazonado y el acetábulo mayor.',
  },
  {
    id: 'h:pelvis:phenice',
    type: 'choice',
    region: 'pelvis',
    prompt: 'El método de Phenice estima el sexo observando tres rasgos de…',
    options: ['El pubis', 'El sacro', 'La cresta ilíaca', 'El acetábulo'],
    answer: 0,
    explanation: 'Arco ventral, concavidad subpúbica y aspecto medial de la rama isquiopúbica.',
  },
  {
    id: 'h:pelvis:edad',
    type: 'multi',
    region: 'pelvis',
    prompt: '¿Qué superficies del coxal se usan para estimar la edad en adultos?',
    options: ['Sínfisis del pubis', 'Superficie auricular', 'Agujero obturador', 'Tuberosidad isquiática'],
    answers: [0, 1],
    explanation: 'Métodos de Suchey-Brooks (sínfisis púbica) y de Lovejoy (superficie auricular del ilion).',
  },
  {
    id: 'h:pelvis:sacro-n',
    type: 'choice',
    region: 'pelvis',
    prompt: '¿Cuántas vértebras se fusionan para formar el sacro?',
    options: ['5', '4', '3', '7'],
    answer: 0,
  },
  {
    id: 'h:pelvis:pelvis-list',
    type: 'list',
    region: 'pelvis',
    prompt: 'Escribe los huesos que forman la pelvis ósea (3 nombres distintos).',
    items: [
      { label: 'Coxal', accept: ['coxales', 'ilíaco', 'iliacos', 'hueso coxal', 'innominado'] },
      { label: 'Sacro' },
      { label: 'Cóccix', accept: ['coxis'] },
    ],
  },
  {
    id: 'h:pelvis:sentado',
    type: 'write',
    region: 'pelvis',
    prompt: '¿Sobre qué prominencia del coxal nos apoyamos al sentarnos?',
    accept: ['tuberosidad isquiática', 'tuberosidad isquiatica', 'isquion', 'tuberosidad del isquion'],
  },

  // ───────────── Muslo y pierna ─────────────
  {
    id: 'h:mi:huesos',
    type: 'list',
    region: 'miembro-inferior',
    prompt: 'Escribe los 4 huesos del muslo, la rodilla y la pierna.',
    items: [{ label: 'Fémur' }, { label: 'Rótula', accept: ['patela'] }, { label: 'Tibia' }, { label: 'Peroné', accept: ['fíbula'] }],
  },
  {
    id: 'h:mi:pierna-identify',
    type: 'identify',
    region: 'miembro-inferior',
    model: 'esqueleto',
    prompt: 'Selecciona los dos huesos de la pierna.',
    targets: ['tibia', 'perone'],
    all: true,
  },
  {
    id: 'h:mi:largo',
    type: 'write',
    region: 'miembro-inferior',
    prompt: '¿Cuál es el hueso más largo y resistente del cuerpo humano?',
    accept: ['fémur'],
  },
  {
    id: 'h:mi:estatura',
    type: 'choice',
    region: 'miembro-inferior',
    prompt: '¿Qué hueso ofrece la mejor estimación de la estatura?',
    options: ['Fémur', 'Húmero', 'Clavícula', 'Radio'],
    answer: 0,
    explanation: 'Los huesos largos del miembro inferior son los que mejor se correlacionan con la talla (p. ej. fórmulas de Trotter y Gleser).',
  },
  {
    id: 'h:mi:rotula',
    type: 'choice',
    region: 'miembro-inferior',
    prompt: '¿Qué tipo de hueso es la rótula?',
    options: ['Sesamoideo', 'Corto', 'Plano', 'Irregular'],
    answer: 0,
    explanation: 'Es el sesamoideo más grande del cuerpo y está incluido en el tendón del cuádriceps.',
  },
  {
    id: 'h:mi:medial',
    type: 'choice',
    region: 'miembro-inferior',
    prompt: '¿Qué hueso de la pierna es medial y soporta el peso?',
    options: ['Tibia', 'Peroné', 'Fémur', 'Astrágalo'],
    answer: 0,
  },
  {
    id: 'h:mi:maleolos',
    type: 'choice',
    region: 'miembro-inferior',
    prompt: 'El maléolo lateral pertenece a…',
    options: ['El peroné', 'La tibia', 'El astrágalo', 'El calcáneo'],
    answer: 0,
    explanation: 'El maléolo medial es de la tibia. Entre ambos encaja el astrágalo.',
  },
  {
    id: 'h:mi:perone-rodilla',
    type: 'choice',
    region: 'miembro-inferior',
    prompt: '¿Cuál de estos huesos NO participa en la articulación de la rodilla?',
    options: ['Peroné', 'Fémur', 'Tibia', 'Rótula'],
    answer: 0,
  },
  {
    id: 'h:mi:linea-aspera',
    type: 'write',
    region: 'miembro-inferior',
    prompt: '¿Cómo se llama la cresta longitudinal de la cara posterior de la diáfisis del fémur?',
    accept: ['línea áspera', 'linea aspera'],
  },
  {
    id: 'h:mi:trocanteres',
    type: 'choice',
    region: 'miembro-inferior',
    prompt: '¿En qué hueso están los trocánteres mayor y menor?',
    options: ['Fémur', 'Húmero', 'Tibia', 'Coxal'],
    answer: 0,
    explanation: 'Sus equivalentes en el húmero son los tubérculos mayor y menor.',
  },

  // ───────────── Pie ─────────────
  {
    id: 'h:pie:total',
    type: 'choice',
    region: 'pie',
    prompt: '¿Cuántos huesos tiene un pie?',
    options: ['26', '27', '28', '24'],
    answer: 0,
    explanation: '7 del tarso + 5 metatarsianos + 14 falanges.',
  },
  {
    id: 'h:pie:tarso-list',
    type: 'list',
    region: 'pie',
    prompt: 'Escribe los 7 huesos del tarso.',
    items: [
      { label: 'Astrágalo', accept: ['talus', 'talo'] },
      { label: 'Calcáneo' },
      { label: 'Navicular', accept: ['escafoides', 'escafoides tarsiano'] },
      { label: 'Cuboides' },
      { label: 'Cuneiforme medial', accept: ['primer cuneiforme', 'primera cuña', 'cuña medial', 'cuneiforme 1'] },
      { label: 'Cuneiforme intermedio', accept: ['segundo cuneiforme', 'segunda cuña', 'cuña intermedia', 'cuneiforme 2', 'cuneiforme medio'] },
      { label: 'Cuneiforme lateral', accept: ['tercer cuneiforme', 'tercera cuña', 'cuña lateral', 'cuneiforme 3'] },
    ],
  },
  {
    id: 'h:pie:tarso-identify',
    type: 'identify',
    region: 'pie',
    model: 'pie',
    prompt: 'Selecciona los 7 huesos del tarso.',
    targets: ['astragalo', 'calcaneo', 'navicular', 'cuboides', 'cuneiforme-medial', 'cuneiforme-intermedio', 'cuneiforme-lateral'],
    all: true,
  },
  {
    id: 'h:pie:cuneiformes-identify',
    type: 'identify',
    region: 'pie',
    model: 'pie',
    prompt: 'Selecciona los tres cuneiformes.',
    targets: ['cuneiforme-medial', 'cuneiforme-intermedio', 'cuneiforme-lateral'],
    all: true,
  },
  {
    id: 'h:pie:metatarso-identify',
    type: 'identify',
    region: 'pie',
    model: 'pie',
    prompt: 'Selecciona todos los metatarsianos.',
    targets: ['mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5'],
    all: true,
  },
  {
    id: 'h:pie:tobillo',
    type: 'write',
    region: 'pie',
    prompt: '¿Qué hueso del tarso articula con la tibia y el peroné para formar el tobillo?',
    accept: ['astrágalo', 'talus', 'talo'],
  },
  {
    id: 'h:pie:talon',
    type: 'write',
    region: 'pie',
    prompt: '¿Qué hueso forma el talón y es el más grande del tarso?',
    accept: ['calcáneo'],
  },
  {
    id: 'h:pie:astragalo-musculos',
    type: 'choice',
    region: 'pie',
    prompt: '¿Qué hueso del tarso no tiene ninguna inserción muscular?',
    options: ['Astrágalo', 'Calcáneo', 'Cuboides', 'Navicular'],
    answer: 0,
  },
  {
    id: 'h:pie:cuboides-mt',
    type: 'choice',
    region: 'pie',
    prompt: '¿Con qué metatarsianos articula el cuboides?',
    options: ['IV y V', 'I y II', 'II y III', 'Solo con el V'],
    answer: 0,
    explanation: 'Los tres cuneiformes articulan con los metatarsianos I, II y III.',
  },
  {
    id: 'h:pie:precipitacion',
    type: 'choice',
    region: 'pie',
    prompt: 'En una precipitación en la que la víctima cae de pie, ¿qué hueso del pie se fractura típicamente?',
    options: ['Calcáneo', 'Navicular', 'Quinto metatarsiano', 'Cuneiforme medial'],
    answer: 0,
    explanation: 'La fuerza axial comprime el calcáneo; suele asociarse a fracturas de tibia, pelvis y columna lumbar.',
  },
  {
    id: 'h:pie:hallux',
    type: 'choice',
    region: 'pie',
    prompt: '¿Cuántas falanges tiene el dedo gordo del pie?',
    options: ['2', '3', '1', '4'],
    answer: 0,
    explanation: 'Igual que el pulgar: proximal y distal.',
  },
]

// ───────────── Preguntas generadas a partir de los datos ─────────────

const slug = (s: string) => normalize(s).replace(/\s+/g, '-')

function withDistractors(id: string, correct: string, pool: string[]): string[] {
  const rand = seededRandom(hashString(id))
  const others = shuffle([...new Set(pool)].filter((n) => n !== correct), rand).slice(0, 3)
  return [correct, ...others]
}

function landmarkQuestions(): Question[] {
  const out: Question[] = []
  const named = bones.filter((b) => !b.series)
  for (const b of named) {
    for (const lm of b.landmarks ?? []) {
      if (!lm.quiz) continue
      const id = `g:lm:${b.id}:${slug(lm.name)}`
      const sameRegion = named.filter((o) => o.region === b.region).map((o) => o.name)
      const pool = sameRegion.length >= 4 ? sameRegion : [...sameRegion, ...named.map((o) => o.name)]
      out.push({
        id,
        type: 'choice',
        region: b.region,
        prompt: `¿En qué hueso se encuentra esta estructura?  «${lm.name}»`,
        options: withDistractors(id, b.name, pool),
        answer: 0,
        explanation: lm.note ? `${b.name}. ${lm.note}` : undefined,
      })
    }
  }
  return out
}

function modelQuestions(): Question[] {
  const out: Question[] = []
  for (const model of Object.values(models)) {
    const ids = [...model.parts, ...(model.hotspots ?? []).map((h) => h.id)]
    const names = ids.map((p) => partName(p, model))
    for (const part of ids) {
      const region: RegionId | undefined = partRegion(part, model)
      if (!region) continue
      const name = partName(part, model)
      const bone = boneById[part]
      const key = `${model.id}:${part}`
      const visual = { model: model.id, highlight: [part] }
      out.push({ id: `g:id:${key}`, type: 'identify', region, key, model: model.id, prompt: `Selecciona en el modelo:  ${name}`, targets: [part] })
      const vc = `g:vc:${key}`
      out.push({
        id: vc,
        type: 'choice',
        region,
        key,
        visual,
        prompt: '¿Qué estructura está resaltada?',
        options: withDistractors(vc, name, names),
        answer: 0,
      })
      if (!bone?.series) {
        out.push({
          id: `g:vw:${key}`,
          type: 'write',
          region,
          key,
          visual,
          prompt: 'Escribe el nombre de la estructura resaltada.',
          accept: [name, ...(bone?.aliases ?? [])],
        })
      }
    }
  }
  return out
}

export const questions: Question[] = [...handmade, ...landmarkQuestions(), ...modelQuestions()]

export const questionsByRegion = (region: RegionId) => questions.filter((q) => q.region === region)
