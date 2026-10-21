/**
 * «RUTA DEL AIRE» · juego para la exposición de Sistema respiratorio.
 *
 * Las cuatro paradas siguen el orden de «public/docs/Sistema respiratorio.html».
 * Cada pregunta indica la lámina donde está el contenido, para repasarla antes de jugar.
 * `rapida: true` marca las preguntas del modo rápido (unos 12 minutos con tres equipos).
 */

export type ParadaId = 1 | 2 | 3 | 4

export interface Parada {
  id: ParadaId
  nombre: string
  subtitulo: string
  color: string
  laminas: string
}

export const paradas: Parada[] = [
  { id: 1, nombre: 'Anatomía', subtitulo: 'De la nariz al alvéolo', color: '#5ecbb4', laminas: '04–07' },
  { id: 2, nombre: 'Fisiología', subtitulo: 'Ventilar, intercambiar y controlar', color: '#78a9f5', laminas: '08–11' },
  { id: 3, nombre: 'Lectura forense', subtitulo: 'Cuando la respiración se detiene', color: '#ef8478', laminas: '12–13' },
  { id: 4, nombre: 'Artículo científico', subtitulo: 'La prueba de las diatomeas', color: '#d9b45f', laminas: '14–22' },
]

interface Base {
  id: string
  parada: ParadaId
  /** Número de lámina de la exposición donde está el contenido. */
  lamina: number
  prompt: string
  /** Se muestra al resolver la pregunta: lo que el equipo debe llevarse. */
  explica: string
  rapida?: boolean
}

/** Selección: un equipo responde; si falla, otro puede robar. */
export interface OpcionItem extends Base {
  tipo: 'opcion'
  opciones: string[]
  respuesta: number
}

/** Ordenar: los pasos se dan en el orden correcto y el juego los baraja. */
export interface OrdenarItem extends Base {
  tipo: 'ordenar'
  pasos: string[]
}

/** Emparejar: cada par es [concepto, definición]. */
export interface EmparejarItem extends Base {
  tipo: 'emparejar'
  pares: [string, string][]
}

/** Caso: las pistas aparecen de una en una; cuanto antes se acierte, más puntos. */
export interface CasoItem extends Base {
  tipo: 'caso'
  titulo: string
  pistas: string[]
  opciones: string[]
  respuesta: number
}

/** Mímica: un integrante del equipo activo mima y el resto adivina sin hablar. */
export interface MimicaItem extends Base {
  tipo: 'mimica'
}

export type Item = OpcionItem | OrdenarItem | EmparejarItem | CasoItem | MimicaItem

export const items: Item[] = [
  // ───────────── Parada 1 · Anatomía (láminas 4–7) ─────────────
  {
    id: 'a-ruta',
    parada: 1,
    lamina: 4,
    tipo: 'ordenar',
    prompt: 'Ordena el viaje del aire, desde que entra por la nariz hasta el alvéolo.',
    pasos: ['Fosas nasales', 'Faringe', 'Laringe', 'Tráquea', 'Bronquios principales', 'Bronquios lobares y segmentarios', 'Bronquiolos terminales', 'Bronquiolos respiratorios', 'Alvéolos'],
    explica: 'Las cuatro primeras son la vía aérea superior y el resto, la inferior. Solo desde los bronquiolos respiratorios hacia abajo hay intercambio de gases.',
  },
  {
    id: 'a-epiglotis',
    parada: 1,
    lamina: 4,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Qué hace la epiglotis cuando tragamos?',
    opciones: ['Cierra la vía aérea para que el alimento no entre', 'Calienta el aire que entra', 'Produce el sonido de la voz', 'Filtra el polvo del aire'],
    respuesta: 0,
    explica: 'La epiglotis cierra la vía aérea al tragar. En la faringe se cruzan la vía del aire y la del alimento.',
  },
  {
    id: 'a-nariz',
    parada: 1,
    lamina: 4,
    tipo: 'opcion',
    prompt: '¿Qué hacen los cornetes y la mucosa de la nariz con el aire?',
    opciones: ['Lo hacen turbulento, lo calientan y lo humedecen', 'Lo convierten en oxígeno puro', 'Lo mandan directo a los alvéolos', 'Lo enfrían antes de la tráquea'],
    respuesta: 0,
    explica: 'Los cornetes generan turbulencia; la mucosa, muy vascularizada, calienta y humedece; los vellos y el moco atrapan partículas.',
  },
  {
    id: 'a-traquea',
    parada: 1,
    lamina: 5,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Cuántos anillos de cartílago en forma de «C» tiene la tráquea?',
    opciones: ['16 a 20', '8 a 10', '30 a 40', '2 a 4'],
    respuesta: 0,
    explica: 'Mide unos 10 a 12 cm en el adulto. Los anillos están abiertos por detrás.',
  },
  {
    id: 'a-derecho',
    parada: 1,
    lamina: 5,
    tipo: 'opcion',
    rapida: true,
    prompt: 'Un cuerpo extraño que cae en la vía aérea suele ir a parar a…',
    opciones: ['El bronquio derecho', 'El bronquio izquierdo', 'La tráquea', 'La laringe'],
    respuesta: 0,
    explica: 'El derecho es más corto, ancho y vertical: allí caen más los cuerpos extraños.',
  },
  {
    id: 'a-espacio',
    parada: 1,
    lamina: 5,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Cuánto aire de cada respiración no llega a intercambiarse con la sangre (espacio muerto)?',
    opciones: ['≈ 150 mL', '≈ 500 mL', '≈ 3000 mL', '≈ 1200 mL'],
    respuesta: 0,
    explica: 'Ese aire llena la vía aérea de conducción, pero no llega a los alvéolos. Por eso respirar despacio y hondo es más eficaz que hacerlo rápido y superficial.',
  },
  {
    id: 'a-alveolo',
    parada: 1,
    lamina: 7,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Dónde ocurre realmente el intercambio de gases?',
    opciones: ['En la tráquea', 'En los bronquios principales', 'Solo en la zona respiratoria, en los alvéolos', 'En la laringe'],
    respuesta: 2,
    explica: 'Desde los bronquiolos respiratorios hacia abajo (generaciones 17 a 23). Aquí, y solo aquí, hay intercambio de gases.',
  },
  {
    id: 'a-celulas',
    parada: 1,
    lamina: 7,
    tipo: 'emparejar',
    prompt: 'Une cada célula del alvéolo con su función.',
    pares: [
      ['Neumocito tipo I', 'Células planas que dejan pasar los gases'],
      ['Neumocito tipo II', 'Producen surfactante, que evita que el alvéolo colapse'],
      ['Macrófago alveolar', 'Fagocita partículas y microorganismos'],
    ],
    explica: 'Los neumocitos tipo I forman casi toda la superficie de intercambio; los tipo II fabrican el surfactante.',
  },
  {
    id: 'a-pleura',
    parada: 1,
    lamina: 6,
    tipo: 'opcion',
    prompt: 'Si entra aire entre las hojas de la pleura, ¿qué ocurre?',
    opciones: ['El pulmón colapsa (neumotórax)', 'El pulmón se hace más grande', 'Nada, es normal', 'Se produce más surfactante'],
    respuesta: 0,
    explica: 'La pleura tiene una fina capa de líquido y presión negativa entre sus hojas. Si entra aire, la presión se iguala y el pulmón colapsa.',
  },
  {
    id: 'a-mimica-epiglotis',
    parada: 1,
    lamina: 4,
    tipo: 'mimica',
    prompt: 'Mima la epiglotis cerrando la vía aérea al tragar.',
    explica: 'Al tragar, la epiglotis baja y cierra la laringe. Si no lo hiciera, el alimento entraría en la vía aérea.',
  },

  // ───────────── Parada 2 · Fisiología (láminas 8–11) ─────────────
  {
    id: 'f-volumenes',
    parada: 2,
    lamina: 9,
    tipo: 'emparejar',
    prompt: 'Empareja cada volumen o capacidad con su valor en un adulto joven.',
    pares: [
      ['Volumen corriente (cada respiración)', '500 mL'],
      ['Reserva inspiratoria', '3000 mL'],
      ['Reserva espiratoria', '1100 mL'],
      ['Volumen residual', '1200 mL'],
      ['Capacidad vital', '4600 mL'],
      ['Capacidad pulmonar total', '5800 mL'],
    ],
    explica: 'Capacidad vital = volumen corriente + reserva inspiratoria + reserva espiratoria (500 + 3000 + 1100 = 4600 mL). La capacidad pulmonar total suma el volumen residual.',
  },
  {
    id: 'f-frenico',
    parada: 2,
    lamina: 8,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Qué nervio activa el diafragma?',
    opciones: ['Nervio frénico (raíces C3 a C5)', 'Nervio vago', 'Nervio ciático', 'Nervio mediano'],
    respuesta: 0,
    explica: 'Nace de C3 a C5: el dicho «C3, C4 y C5 mantienen vivo el diafragma» lo recuerda.',
  },
  {
    id: 'f-inspiracion',
    parada: 2,
    lamina: 8,
    tipo: 'ordenar',
    prompt: 'Ordena los pasos de una inspiración.',
    pasos: [
      'El diafragma se contrae y desciende',
      'Los intercostales externos elevan las costillas',
      'Aumenta el volumen del tórax',
      'La presión alveolar baja por debajo de la atmosférica y entra aire',
    ],
    explica: 'La espiración en reposo es pasiva: el diafragma se relaja, el pulmón retrocede elásticamente y sale el aire.',
  },
  {
    id: 'f-estimulo',
    parada: 2,
    lamina: 11,
    tipo: 'opcion',
    rapida: true,
    prompt: 'Según la diapositiva, ¿cuál es el principal estímulo para respirar?',
    opciones: ['La falta de oxígeno', 'El exceso de CO₂', 'El frío del aire', 'La subida de la temperatura corporal'],
    respuesta: 1,
    explica: 'No es la falta de oxígeno, sino el exceso de CO₂. Los quimiorreceptores centrales detectan CO₂ y H⁺; los periféricos (carotídeos y aórticos) detectan la caída de O₂.',
  },
  {
    id: 'f-bulbo',
    parada: 2,
    lamina: 11,
    tipo: 'opcion',
    prompt: '¿Qué estructura marca el ritmo básico de la respiración?',
    opciones: ['El bulbo raquídeo', 'La protuberancia', 'El cerebelo', 'El hipotálamo'],
    respuesta: 0,
    explica: 'El grupo respiratorio dorsal del bulbo marca el ritmo inspiratorio. La protuberancia, con su centro neumotáxico, limita la inspiración y ajusta la frecuencia.',
  },
  {
    id: 'f-co2',
    parada: 2,
    lamina: 10,
    tipo: 'opcion',
    prompt: '¿En qué forma viaja la mayor parte del CO₂ en la sangre?',
    opciones: ['Como bicarbonato (≈ 70 %)', 'Disuelto en el plasma (≈ 7 %)', 'Unido a la hemoglobina (≈ 23 %)', 'Como oxígeno libre'],
    respuesta: 0,
    explica: 'Del CO₂ que transporta la sangre, la mayor parte va como bicarbonato. La hemoglobina transporta sobre todo oxígeno.',
  },
  {
    id: 'f-oxigeno',
    parada: 2,
    lamina: 10,
    tipo: 'opcion',
    prompt: '¿Qué parte del oxígeno viaja unida a la hemoglobina?',
    opciones: ['≈ 3 %', '≈ 50 %', '≈ 97 %', '100 %'],
    respuesta: 2,
    explica: 'El 3 % restante viaja disuelto en el plasma. Por eso la hemoglobina es clave para el transporte.',
  },
  {
    id: 'f-mimica-inspiracion',
    parada: 2,
    lamina: 8,
    tipo: 'mimica',
    prompt: 'Mima una inspiración tranquila: el diafragma baja y las costillas suben.',
    explica: 'En reposo la inspiración es activa: el diafragma y los intercostales externos aumentan el volumen del tórax.',
  },

  // ───────────── Parada 3 · Lectura forense (láminas 12–13) ─────────────
  {
    id: 'l-asfixias',
    parada: 3,
    lamina: 13,
    tipo: 'emparejar',
    prompt: 'Une cada tipo de asfixia con lo que falla.',
    pares: [
      ['Sofocación', 'Se obstruyen la boca, la nariz o la vía aérea'],
      ['Compresión del cuello', 'Se cierran la vía aérea y los vasos del cuello'],
      ['Compresión torácica', 'El tórax no puede expandirse'],
      ['Sumersión', 'Un líquido ocupa la vía aérea'],
      ['Ambiental o química', 'Falta O₂ en el aire o en la hemoglobina'],
    ],
    explica: 'Son cinco formas de impedir la respiración. Petequias, cianosis y edema son signos inespecíficos: solos no confirman la causa.',
  },
  {
    id: 'l-torax',
    parada: 3,
    lamina: 13,
    tipo: 'opcion',
    rapida: true,
    prompt: 'Una persona queda aplastada bajo un peso, pero su vía aérea está libre. ¿Qué tipo de asfixia es?',
    opciones: ['Compresión torácica', 'Sofocación', 'Sumersión', 'Ambiental o química'],
    respuesta: 0,
    explica: 'Aunque la vía aérea esté libre, si el tórax no puede expandirse no entra aire. Un peso, una multitud o una mala postura pueden causarlo.',
  },
  {
    id: 'l-caso-cuello',
    parada: 3,
    lamina: 13,
    tipo: 'caso',
    titulo: 'Caso 1 · La marca en el cuello',
    prompt: '¿Cuál es la causa de la muerte más probable?',
    pistas: [
      'El cadáver tiene un surco horizontal alrededor del cuello.',
      'En estas muertes se examinan siempre el hueso hioides y el cartílago tiroides.',
      'El hioides aparece fracturado.',
    ],
    opciones: ['Compresión del cuello (ahorcamiento o estrangulación)', 'Ahogamiento', 'Intoxicación por CO', 'Sofocación con una bolsa'],
    respuesta: 0,
    explica: 'En la compresión del cuello se cierran la vía aérea y los vasos del cuello. Por eso el hioides y el tiroides son las piezas clave.',
  },
  {
    id: 'l-caso-garaje',
    parada: 3,
    lamina: 13,
    tipo: 'caso',
    titulo: 'Caso 2 · El garaje cerrado',
    prompt: '¿Qué ha causado la muerte?',
    pistas: [
      'Dos personas aparecen dentro de un coche en un garaje cerrado, con el motor encendido.',
      'Tienen livideces de color rojo cereza.',
      'El monóxido de carbono se une a la hemoglobina unas 200 a 250 veces más que el O₂.',
    ],
    opciones: ['Intoxicación por monóxido de carbono', 'Ahogamiento', 'Compresión torácica', 'Sumersión'],
    respuesta: 0,
    explica: 'El CO forma carboxihemoglobina: la sangre no lleva oxígeno y los tejidos se quedan sin él. Es una asfixia ambiental o química.',
  },
  {
    id: 'l-caso-recien',
    parada: 3,
    lamina: 11,
    tipo: 'caso',
    titulo: 'Caso 3 · El recién nacido',
    prompt: '¿Qué prueba permite saber si el bebé respiró después de nacer?',
    pistas: [
      'Un recién nacido llega sin vida al hospital.',
      'Al extraer los pulmones, uno de ellos flota en el agua.',
      'El cuerpo lleva varios días: la putrefacción puede falsear el resultado.',
    ],
    opciones: ['Docimasia pulmonar hidrostática', 'Prueba de diatomeas', 'Análisis de la hemoglobina', 'Espirometría'],
    respuesta: 0,
    explica: 'Un pulmón que ya respiró conserva aire y flota. La putrefacción y la reanimación pueden hacer flotar un pulmón que no respiró, así que el resultado se interpreta con cuidado.',
  },
  {
    id: 'l-mimica-compresion',
    parada: 3,
    lamina: 13,
    tipo: 'mimica',
    prompt: 'Mima una asfixia por compresión torácica: alguien tiene un peso encima.',
    explica: 'El tórax no se expande y el aire no entra, aunque la vía aérea esté libre.',
  },

  // ───────────── Parada 4 · Artículo científico (láminas 14–22) ─────────────
  {
    id: 'd-signo',
    parada: 4,
    lamina: 15,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Existe un signo que confirme por sí solo el ahogamiento?',
    opciones: ['Sí: la espuma en las vías aéreas', 'Sí: el enfisema pulmonar', 'Sí: el edema pulmonar', 'No: no existe ningún signo patognomónico'],
    respuesta: 3,
    explica: 'Espuma, enfisema y edema solo son muy indicativos en cadáveres bien conservados, con menos de 48 h de muerte.',
  },
  {
    id: 'd-vf',
    parada: 4,
    lamina: 15,
    tipo: 'opcion',
    prompt: 'Verdadero o falso: con la putrefacción desaparecen la espuma, el enfisema y el edema, y el diagnóstico se hace por exclusión.',
    opciones: ['Verdadero', 'Falso'],
    respuesta: 0,
    explica: 'Por eso el diagnóstico de ahogamiento necesita pruebas complementarias, como la de diatomeas.',
  },
  {
    id: 'd-ruta',
    parada: 4,
    lamina: 16,
    tipo: 'ordenar',
    prompt: 'Ordena el recorrido de las diatomeas en un ahogamiento.',
    pasos: ['Agua con diatomeas', 'Inhalada hasta los alvéolos', 'Cruzan la barrera alveolocapilar', 'Viajan por la circulación', 'Se depositan en órganos cerrados'],
    explica: 'Solo un corazón que late las lleva a los órganos. En quien muere al entrar al agua, las diatomeas llegan al pulmón pero no pasan de ahí.',
  },
  {
    id: 'd-umbral',
    parada: 4,
    lamina: 18,
    tipo: 'opcion',
    prompt: '¿Cuántas diatomeas en el residuo de digerir 10 g de pulmón indican ahogamiento?',
    opciones: ['≥ 20', '≥ 5', '≥ 100', '≥ 1'],
    respuesta: 0,
    explica: 'En otros órganos (hígado, riñón, médula) el umbral es ≥ 5 por cada 10 g. Y un cociente pulmón/agua L/D > 2 es muy indicativo.',
  },
  {
    id: 'd-requisito',
    parada: 4,
    lamina: 18,
    tipo: 'opcion',
    prompt: 'Además del número de diatomeas, ¿qué debe cumplirse?',
    opciones: ['Que las especies coincidan, en tipo y cantidad, con las del agua de referencia', 'Que haya espuma en la boca', 'Que el cuerpo esté en el mar', 'Que se hayan encontrado al menos dos órganos'],
    respuesta: 0,
    explica: 'Sin agua de referencia no hay comparación, y esa agua solo se puede tomar en el lugar y en el momento del hallazgo.',
  },
  {
    id: 'd-muestra',
    parada: 4,
    lamina: 17,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Qué muestra del cuerpo es la más fiable y la menos expuesta?',
    opciones: ['Médula ósea del fémur', 'Pulmón', 'Hígado', 'Cerebro'],
    respuesta: 0,
    explica: 'Se toman cuñas de al menos 10 g de pulmón, hígado, riñón o cerebro, pero la médula del fémur es la más confiable.',
  },
  {
    id: 'd-digestion',
    parada: 4,
    lamina: 17,
    tipo: 'opcion',
    prompt: '¿Qué método de extracción es el más usado y barato?',
    opciones: ['Digestión ácida', 'Incineración', 'Enzimas', 'Peróxido caliente'],
    respuesta: 0,
    explica: 'Después se cuentan, miden e identifican las especies al microscopio de luz, a 630–1000×.',
  },
  {
    id: 'd-ia',
    parada: 4,
    lamina: 20,
    tipo: 'opcion',
    prompt: '¿Qué avance usa redes neuronales convolucionales para identificar diatomeas?',
    opciones: ['Inteligencia artificial', 'Microscopía electrónica automatizada', 'Métodos moleculares (ADN)', 'Nuevos sustratos, como el humor vítreo'],
    respuesta: 0,
    explica: 'Acertó con un 97,67 % de exactitud y fue más del doble de rápida que los expertos.',
  },
  {
    id: 'd-limitaciones',
    parada: 4,
    lamina: 19,
    tipo: 'opcion',
    prompt: '¿Qué puede dar falsos positivos en la prueba de diatomeas?',
    opciones: ['Instrumentos, recipientes viejos o filtros de papel contaminados', 'La sangre del propio cuerpo', 'El humor vítreo', 'El agua de referencia tomada en el lugar'],
    respuesta: 0,
    explica: 'La contaminación es una limitación de la prueba. También lo son la falta de un protocolo único y la necesidad de un diatomólogo experto.',
  },
  {
    id: 'd-diatomea',
    parada: 4,
    lamina: 16,
    tipo: 'opcion',
    rapida: true,
    prompt: '¿Qué es una diatomea?',
    opciones: ['Un alga unicelular con pared de sílice', 'Una bacteria del agua', 'Un glóbulo blanco', 'Un hongo microscópico'],
    respuesta: 0,
    explica: 'Su pared de sílice (la frústula) resiste la putrefacción y los ácidos. Por eso sobrevive en el cuerpo.',
  },
  {
    id: 'd-mimica-diatomea',
    parada: 4,
    lamina: 16,
    tipo: 'mimica',
    prompt: 'Mima cómo viaja una diatomea desde el pulmón hasta un órgano cerrado.',
    explica: 'Solo llega a órganos como el hígado o el cerebro si hay circulación: por eso no aparece en quien murió antes de entrar al agua.',
  },
  {
    id: 'd-caso-final',
    parada: 4,
    lamina: 15,
    tipo: 'caso',
    rapida: true,
    titulo: 'Caso final · ¿Ahogado o arrojado al agua?',
    prompt: '¿Qué conclusión es la más sólida?',
    pistas: [
      'Un cuerpo se encuentra en un río, con espuma en las vías aéreas.',
      'No hay putrefacción: se encontró en menos de 48 h.',
      'En el pulmón hay 45 diatomeas por cada 10 g, con las mismas especies que el agua de referencia y L/D > 2.',
    ],
    opciones: ['Ahogamiento: estaba viva al entrar al agua', 'Sumersión post mortem: murió antes y lo arrojaron', 'No se puede saber nunca', 'Murió por intoxicación con CO'],
    respuesta: 0,
    explica: 'Con la prueba de diatomeas tomada bien desde la escena, la conclusión es ahogamiento. Aun así, ningún signo es patognomónico por sí solo.',
  },
]
