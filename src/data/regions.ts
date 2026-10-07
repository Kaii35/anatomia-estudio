import type { Region, RegionId } from '../types'

export const regions: Region[] = [
  {
    id: 'general',
    name: 'Generalidades',
    description: 'Partes de un hueso largo, médula ósea, sangre y articulaciones.',
    color: '#9aa7b8',
    models: [],
  },
  {
    id: 'craneo',
    name: 'Cráneo y cara',
    description: 'Neurocráneo, viscerocráneo, suturas y puntos craneométricos.',
    color: '#b79cf0',
    models: ['craneo', 'craneo-sagital', 'craneo-base', 'craneo-inferior'],
  },
  {
    id: 'cintura-escapular',
    name: 'Cintura escapular',
    description: 'Clavícula y escápula: la unión del miembro superior con el tronco.',
    color: '#5ecbb4',
    models: ['hombro', 'escapula', 'articulacion-hombro', 'hombro-torax'],
  },
  {
    id: 'miembro-superior',
    name: 'Brazo y antebrazo',
    description: 'Húmero, radio y cúbito con sus accidentes óseos.',
    color: '#f0a756',
    models: ['humero', 'antebrazo', 'brazo-zonas', 'miembro-superior'],
  },
  {
    id: 'mano',
    name: 'Mano',
    description: 'Carpo, metacarpo y falanges: 27 huesos.',
    color: '#ef8478',
    models: ['mano', 'brazo-zonas'],
  },
  {
    id: 'pelvis',
    name: 'Cintura pélvica',
    description: 'Coxal, sacro y cóccix. Clave para estimar sexo y edad.',
    color: '#78a9f5',
    models: ['pelvis', 'coxal', 'cadera', 'cadera-pierna'],
  },
  {
    id: 'miembro-inferior',
    name: 'Muslo y pierna',
    description: 'Fémur, rótula, tibia y peroné.',
    color: '#93c96f',
    models: ['femur', 'tibia', 'perone', 'pierna-huesos', 'pierna-zonas'],
  },
  {
    id: 'pie',
    name: 'Pie',
    description: 'Tarso, metatarso y falanges: 26 huesos.',
    color: '#ee95bb',
    models: ['pie', 'pierna-zonas'],
  },
  {
    id: 'tronco',
    name: 'Columna y tórax',
    description: 'Vértebras, costillas y esternón.',
    color: '#d9b45f',
    models: ['columna', 'torax'],
  },
]

export const regionById = Object.fromEntries(regions.map((r) => [r.id, r])) as Record<RegionId, Region>
