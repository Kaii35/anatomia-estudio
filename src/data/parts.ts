import type { RegionId } from '../types'
import { boneById } from './bones'
import type { ModelDef } from './models'
import { zones } from './zones'

interface Structure {
  name: string
  /** Con región, la estructura genera preguntas en los modelos que la declaren en `parts`. */
  region?: RegionId
  /** Hueso del que forma parte: al hacer clic se abre la ficha de ese hueso. */
  bone?: string
  aliases?: string[]
  note?: string
  /** Nombre ya completo: no se acepta su forma abreviada («Cabeza» por «Cabeza del radio»). */
  exact?: boolean
}

/**
 * Accidentes óseos que en los modelos no son una malla aparte (bordes, ángulos,
 * espinas…). Cada modelo indica dónde está cada uno con un punto (ver `hotspots`
 * en data/models.ts); aquí va su nombre y a qué hueso pertenece.
 */
const points: Record<string, Structure> = {
  'escapula-angulo-superior': { name: 'Ángulo superior', bone: 'escapula', note: 'Unión del borde superior con el borde medial.' },
  'escapula-angulo-inferior': { name: 'Ángulo inferior', bone: 'escapula', note: 'Vértice inferior del triángulo; queda a la altura de la 7.ª costilla.' },
  'escapula-borde-medial': { name: 'Borde medial', bone: 'escapula', aliases: ['borde vertebral', 'borde interno'], note: 'Paralelo a la columna vertebral.' },
  'escapula-borde-lateral': { name: 'Borde lateral', bone: 'escapula', aliases: ['borde axilar', 'borde externo'], note: 'Va de la cavidad glenoidea al ángulo inferior.' },
  'escapula-cuello': { name: 'Cuello de la escápula', bone: 'escapula', aliases: ['cuello'], note: 'Estrechamiento que sostiene la cavidad glenoidea.' },
  'escapula-crestas': { name: 'Crestas subescapulares', bone: 'escapula', aliases: ['crestas escapulares', 'crestas de la fosa subescapular', 'crestas'], note: 'Tres o cuatro crestas oblicuas que cruzan la fosa subescapular desde el borde medial hacia el cuello; en ellas se insertan los tendones del músculo subescapular.' },
  'escapula-escotadura': { name: 'Escotadura supraescapular', bone: 'escapula', aliases: ['muesca supraescapular', 'escotadura coracoidea'], note: 'En el borde superior, junto a la base de la apófisis coracoides.' },
  // Escápula y clavícula
  'escapula-borde-superior': { name: 'Borde superior', bone: 'escapula', aliases: ['borde superior de la escapula'], note: 'El más corto y delgado; en él está la escotadura supraescapular.' },
  'escapula-angulo-lateral': { name: 'Ángulo lateral', bone: 'escapula', aliases: ['angulo externo'], note: 'El más grueso de los tres: sostiene la cavidad glenoidea.' },
  'clavicula-esternal': { name: 'Extremo esternal', bone: 'clavicula', aliases: ['extremidad esternal', 'extremo medial'], note: 'Grueso; articula con el manubrio del esternón (articulación esternoclavicular).' },
  'clavicula-acromial': { name: 'Extremo acromial', bone: 'clavicula', aliases: ['extremidad acromial', 'extremo lateral'], note: 'Aplanado; articula con el acromion de la escápula.' },
  'clavicula-surco': { name: 'Surco subclavio', bone: 'clavicula', aliases: ['surco del subclavio', 'surco del musculo subclavio'], note: 'En la cara inferior: mira hacia abajo y sirve para orientar el hueso.' },
  // Húmero, radio y fémur
  'humero-fosa-coronoidea': { name: 'Fosa coronoidea', bone: 'humero', aliases: ['fosa coronoides'], note: 'Cara anterior, sobre la tróclea: recibe a la apófisis coronoides del cúbito al flexionar el codo.' },
  'radio-fovea': { name: 'Fóvea articular del radio', bone: 'radio', aliases: ['fovea articular', 'fosita articular', 'cupula radial'], note: 'Cara superior, cóncava, de la cabeza del radio: el «plato» que articula con el cóndilo del húmero.' },
  'femur-poplitea': { name: 'Superficie poplítea', bone: 'femur', aliases: ['cara poplitea', 'triangulo popliteo'], note: 'Triángulo de la cara posterior distal, entre las dos líneas supracondíleas.' },
  // Coxal
  'coxal-rama-superior': { name: 'Rama superior del pubis', bone: 'coxal', aliases: ['rama superior', 'rama iliopubica'], note: 'Une el cuerpo del pubis con el acetábulo; limita por arriba el agujero obturador.' },
  'coxal-cresta-pubica': { name: 'Cresta púbica', bone: 'coxal', aliases: ['cresta del pubis'], note: 'Borde superior del cuerpo del pubis, junto a la sínfisis.' },
  'coxal-linea-terminal': { name: 'Línea terminal', bone: 'coxal', aliases: ['linea arqueada', 'linea innominada'], note: 'Cresta de la cara interna que marca el estrecho superior de la pelvis.' },
  // Atlas y axis
  'atlas-arco-anterior': { name: 'Arco anterior del atlas', bone: 'cervicales', aliases: ['arco anterior'], note: 'El atlas no tiene cuerpo: lo forman dos arcos unidos por las masas laterales.' },
  'atlas-arco-posterior': { name: 'Arco posterior del atlas', bone: 'cervicales', aliases: ['arco posterior'], note: 'Sobre él pasa la arteria vertebral.' },
  'atlas-tuberculo-anterior': { name: 'Tubérculo anterior', bone: 'cervicales', aliases: ['tuberculo articular anterior'], note: 'Saliente en el centro del arco anterior.' },
  'atlas-tuberculo-posterior': { name: 'Tubérculo posterior', bone: 'cervicales', aliases: ['tuberculo articular posterior'], note: 'Sustituye a la apófisis espinosa, que el atlas no tiene.' },
  'atlas-transverso': { name: 'Proceso transverso', bone: 'cervicales', aliases: ['apofisis transversa', 'proceso transverso del atlas'], note: 'Lo atraviesa el agujero del proceso transverso (agujero transverso).' },
  'atlas-fosita': { name: 'Fosita articular superior', bone: 'cervicales', aliases: ['fosa articular', 'fosa articular superior', 'cavidad glenoidea del atlas', 'carilla articular superior'], note: 'Recibe al cóndilo del occipital.' },
  'atlas-agujero': { name: 'Agujero vertebral', bone: 'cervicales', aliases: ['foramen vertebral', 'orificio vertebral'], note: 'Muy amplio: aloja la médula y, por delante, el diente del axis.' },
  'axis-odontoides': { name: 'Apófisis odontoides (diente)', bone: 'cervicales', aliases: ['odontoides', 'diente', 'diente del axis', 'apofisis odontoides'], note: 'Sube desde el cuerpo del axis y hace de eje al girar la cabeza.' },

  'axis-cuerpo': { name: 'Cuerpo vertebral', bone: 'cervicales', aliases: ['cuerpo'], note: 'Parte anterior y maciza: soporta el peso.' },
  'axis-espinosa': { name: 'Apófisis espinosa', bone: 'cervicales', aliases: ['proceso espinoso', 'espinosa'], note: 'En las cervicales típicas es corta y bífida; en C7 es larga y se palpa.' },
  'axis-transversa': { name: 'Apófisis transversa', bone: 'cervicales', aliases: ['proceso transverso', 'apofisis transversal', 'transversa'], note: 'En las cervicales la atraviesa el agujero transverso, por donde sube la arteria vertebral.' },
  'axis-articular': { name: 'Apófisis articular superior', bone: 'cervicales', aliases: ['carilla articular superior', 'proceso articular superior', 'apofisis articular'], note: 'Articula con la apófisis articular inferior de la vértebra de encima.' },
  'axis-agujero': { name: 'Agujero vertebral', bone: 'cervicales', aliases: ['foramen vertebral', 'orificio vertebral', 'agujero raquideo'], note: 'Triangular. Por él pasa la médula espinal.' },
  'cerv-cuerpo': { name: 'Cuerpo vertebral', bone: 'cervicales', aliases: ['cuerpo'], note: 'Parte anterior y maciza: soporta el peso.' },
  'cerv-espinosa': { name: 'Apófisis espinosa', bone: 'cervicales', aliases: ['proceso espinoso', 'espinosa'], note: 'En las cervicales típicas es corta y bífida; en C7 es larga y se palpa.' },
  'cerv-transversa': { name: 'Apófisis transversa', bone: 'cervicales', aliases: ['proceso transverso', 'apofisis transversal', 'transversa'], note: 'En las cervicales la atraviesa el agujero transverso, por donde sube la arteria vertebral.' },
  'cerv-articular': { name: 'Apófisis articular superior', bone: 'cervicales', aliases: ['carilla articular superior', 'proceso articular superior', 'apofisis articular'], note: 'Articula con la apófisis articular inferior de la vértebra de encima.' },
  'cerv-agujero': { name: 'Agujero vertebral', bone: 'cervicales', aliases: ['foramen vertebral', 'orificio vertebral', 'agujero raquideo'], note: 'Triangular. Por él pasa la médula espinal.' },
  'cerv-lamina': { name: 'Lámina', bone: 'cervicales', aliases: ['lamina vertebral'], note: 'Une la apófisis espinosa con las apófisis articulares y cierra el arco por detrás.' },
  'c7-cuerpo': { name: 'Cuerpo vertebral', bone: 'cervicales', aliases: ['cuerpo'], note: 'Parte anterior y maciza: soporta el peso.' },
  'c7-espinosa': { name: 'Apófisis espinosa', bone: 'cervicales', aliases: ['proceso espinoso', 'espinosa'], note: 'En las cervicales típicas es corta y bífida; en C7 es larga y se palpa.' },
  'c7-transversa': { name: 'Apófisis transversa', bone: 'cervicales', aliases: ['proceso transverso', 'apofisis transversal', 'transversa'], note: 'En las cervicales la atraviesa el agujero transverso, por donde sube la arteria vertebral.' },
  'c7-articular': { name: 'Apófisis articular superior', bone: 'cervicales', aliases: ['carilla articular superior', 'proceso articular superior', 'apofisis articular'], note: 'Articula con la apófisis articular inferior de la vértebra de encima.' },
  'c7-agujero': { name: 'Agujero vertebral', bone: 'cervicales', aliases: ['foramen vertebral', 'orificio vertebral', 'agujero raquideo'], note: 'Triangular. Por él pasa la médula espinal.' },
  'tor-cuerpo': { name: 'Cuerpo vertebral', bone: 'toracicas', aliases: ['cuerpo'], note: 'Parte anterior y maciza: soporta el peso.' },
  'tor-espinosa': { name: 'Apófisis espinosa', bone: 'toracicas', aliases: ['proceso espinoso', 'espinosa'], note: 'Larga e inclinada hacia abajo.' },
  'tor-transversa': { name: 'Apófisis transversa', bone: 'toracicas', aliases: ['proceso transverso', 'apofisis transversal', 'transversa'], note: 'Lleva una carilla articular para el tubérculo de la costilla.' },
  'tor-articular': { name: 'Apófisis articular superior', bone: 'toracicas', aliases: ['carilla articular superior', 'proceso articular superior', 'apofisis articular'], note: 'Articula con la apófisis articular inferior de la vértebra de encima.' },
  'tor-agujero': { name: 'Agujero vertebral', bone: 'toracicas', aliases: ['foramen vertebral', 'orificio vertebral', 'agujero raquideo'], note: 'Circular en las torácicas. Por él pasa la médula espinal.' },
  'lum-cuerpo': { name: 'Cuerpo vertebral', bone: 'lumbares', aliases: ['cuerpo'], note: 'Parte anterior y maciza: soporta el peso.' },
  'lum-espinosa': { name: 'Apófisis espinosa', bone: 'lumbares', aliases: ['proceso espinoso', 'espinosa'], note: 'Corta y cuadrilátera, en forma de hacha.' },
  'lum-transversa': { name: 'Apófisis transversa', bone: 'lumbares', aliases: ['proceso transverso', 'apofisis transversal', 'transversa'], note: 'Larga y delgada (apófisis costiforme).' },
  'lum-articular': { name: 'Apófisis articular superior', bone: 'lumbares', aliases: ['carilla articular superior', 'proceso articular superior', 'apofisis articular'], note: 'Articula con la apófisis articular inferior de la vértebra de encima.' },
  'lum-agujero': { name: 'Agujero vertebral', bone: 'lumbares', aliases: ['foramen vertebral', 'orificio vertebral', 'agujero raquideo'], note: 'Triangular. Por él pasa la médula espinal.' },
  'coxal-cresta-iliaca': { name: 'Cresta ilíaca', bone: 'coxal', note: 'Borde superior del coxal.' },
  'coxal-eias': { name: 'Espina ilíaca anterosuperior', bone: 'coxal', aliases: ['espina iliaca antero superior', 'eias'], note: 'Extremo anterior de la cresta ilíaca.' },
  'coxal-eiai': { name: 'Espina ilíaca anteroinferior', bone: 'coxal', aliases: ['espina iliaca antero inferior', 'eiai'], note: 'Por debajo de la anterosuperior, sobre el acetábulo.' },
  'coxal-eips': { name: 'Espina ilíaca posterosuperior', bone: 'coxal', aliases: ['espina iliaca postero superior', 'eips'], note: 'Extremo posterior de la cresta ilíaca.' },
  'coxal-escotadura-mayor': { name: 'Escotadura ciática mayor', bone: 'coxal', aliases: ['escotadura isquiatica mayor'], note: 'Ancha en la mujer y estrecha en el varón: rasgo clave para estimar el sexo.' },
  'coxal-espina-ciatica': { name: 'Espina ciática', bone: 'coxal', aliases: ['espina isquiatica'], note: 'Separa la escotadura ciática mayor de la menor.' },
  'coxal-escotadura-menor': { name: 'Escotadura ciática menor', bone: 'coxal', aliases: ['escotadura isquiatica menor'], note: 'Entre la espina ciática y la tuberosidad isquiática.' },
  'coxal-tuberosidad-isquiatica': { name: 'Tuberosidad isquiática', bone: 'coxal', aliases: ['tuberosidad del isquion'], note: 'Punto de apoyo al sentarse.' },
  'coxal-rama-isquiopubica': { name: 'Rama isquiopúbica', bone: 'coxal', aliases: ['rama isquiopubiana', 'rama inferior'], note: 'Borde inferior: une el isquion con el pubis.' },
  'coxal-acetabulo': { name: 'Acetábulo', bone: 'coxal', aliases: ['cavidad cotiloidea', 'cotilo'], note: 'Cavidad de la cara externa donde encaja la cabeza del fémur.' },
  'coxal-agujero-obturador': { name: 'Agujero obturador', bone: 'coxal', aliases: ['orificio obturador', 'foramen obturador', 'agujero obturado'], note: 'Entre el isquion y el pubis; lo atraviesan el nervio y los vasos obturadores.' },
  'coxal-fosa-iliaca': { name: 'Fosa ilíaca', bone: 'coxal', note: 'Concavidad de la cara interna del ilion.' },
  'coxal-superficie-auricular': { name: 'Superficie auricular', bone: 'coxal', aliases: ['superficie articular para el sacro', 'carilla auricular'], note: 'En la cara interna: articula con el sacro.' },
}

/** Partes seleccionables en los modelos que no son un hueso con ficha propia. */
const structures: Record<string, Structure> = {
  'escapula-coracoides': { name: 'Apófisis coracoides', region: 'cintura-escapular', bone: 'escapula', aliases: ['coracoides'] },
  'escapula-acromion': { name: 'Acromion', region: 'cintura-escapular', bone: 'escapula' },
  'escapula-glenoidea': { name: 'Cavidad glenoidea', region: 'cintura-escapular', bone: 'escapula', aliases: ['glenoidea', 'glenoides', 'fosa glenoidea'] },
  'escapula-supraespinosa': { name: 'Fosa supraespinosa', region: 'cintura-escapular', bone: 'escapula', aliases: ['supraespinosa'] },
  'escapula-infraespinosa': { name: 'Fosa infraespinosa', region: 'cintura-escapular', bone: 'escapula', aliases: ['infraespinosa'] },
  'escapula-espina': { name: 'Espina de la escápula', region: 'cintura-escapular', bone: 'escapula', aliases: ['espina escapular'] },
  'escapula-subescapular': { name: 'Fosa subescapular', region: 'cintura-escapular', bone: 'escapula', aliases: ['subescapular', 'cara anterior', 'cara costal'], note: 'Ocupa casi toda la cara anterior (costal); la cruzan tres o cuatro crestas. En ella se origina el músculo subescapular.', exact: true },
  ilion: { name: 'Ilion', region: 'pelvis', bone: 'coxal', aliases: ['ileon'] },
  isquion: { name: 'Isquion', region: 'pelvis', bone: 'coxal' },
  pubis: { name: 'Pubis', region: 'pelvis', bone: 'coxal' },
  'sinfisis-pubica': { name: 'Sínfisis del pubis', region: 'pelvis', bone: 'coxal', aliases: ['sínfisis púbica', 'sínfisis pubiana'] },
  'cartilagos-costales': { name: 'Cartílagos costales', region: 'tronco', aliases: ['cartílago costal'] },
  'articulacion-sacroiliaca': { name: 'Articulación sacroilíaca' },
  'cartilago-femoral': { name: 'Cartílago de la cabeza del fémur' },
  discos: { name: 'Discos intervertebrales' },
  'disco-acromioclavicular': { name: 'Disco acromioclavicular' },
  'disco-esternoclavicular': { name: 'Disco esternoclavicular' },
  dientes: { name: 'Dientes' },
  'sesamoideos-mano': { name: 'Huesos sesamoideos' },
  'sesamoideos-pie': { name: 'Huesos sesamoideos' },
  // Zonas y puntos pertenecen a la región de su hueso y ya llevan su nombre completo.
  ...Object.fromEntries(Object.entries({ ...zones, ...points }).map(([id, s]) => [id, { ...s, region: boneById[s.bone!].region, exact: true }])),
}

export const isPoint = (id: string) => id in points

export function partName(id: string, _model?: ModelDef): string {
  return boneById[id]?.name ?? structures[id]?.name ?? id
}

/** Dato breve sobre una zona o punto, para la ficha y las explicaciones. */
export const partNote = (id: string): string | undefined => structures[id]?.note

/**
 * Respuestas escritas válidas para una parte: el nombre, sus sinónimos y, si el
 * nombre lleva una aclaración entre paréntesis, cada mitad por separado
 * («Troquíter (tubérculo mayor)» → «troquíter», «tubérculo mayor»).
 * En los huesos y estructuras generales se acepta además la forma corta sin el
 * dedo o la región («falange proximal»), porque el modelo ya muestra cuál es.
 */
export function partAccept(id: string, model?: ModelDef): string[] {
  const name = partName(id, model)
  const halves = name.match(/^(.+?) \((.+)\)$/)
  const short = structures[id]?.exact ? [] : [name.replace(/^(Primer|Segundo|Tercer|Cuarto|Quinto) /, '').split(/ del? /)[0]]
  return [...new Set([name, ...(halves ? [halves[1], halves[2]] : []), ...(boneById[id]?.aliases ?? structures[id]?.aliases ?? []), ...short])]
}

export function partRegion(id: string, _model?: ModelDef): RegionId | undefined {
  return boneById[id]?.region ?? structures[id]?.region
}

/** Id del hueso con ficha al que pertenece una parte (ella misma, si es un hueso). */
export function partBone(id: string): string | undefined {
  return boneById[id] ? id : structures[id]?.bone
}

/** Un hueso y las porciones suyas que algunos modelos traen como mallas separadas. */
export function partsOfBone(boneId: string): string[] {
  return [boneId, ...Object.keys(structures).filter((s) => structures[s].bone === boneId)]
}
