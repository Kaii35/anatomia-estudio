import type { Region, RegionId } from '../types'

export const regions: Region[] = [
  {
    id: 'craneo',
    name: 'Cráneo y cara',
    description: 'Neurocráneo, viscerocráneo, suturas y puntos craneométricos.',
    color: '#b79cf0',
    models: [],
  },
  {
    id: 'cintura-escapular',
    name: 'Cintura escapular',
    description: 'Clavícula y escápula: la unión del miembro superior con el tronco.',
    color: '#5ecbb4',
    models: ['esqueleto'],
  },
  {
    id: 'miembro-superior',
    name: 'Brazo y antebrazo',
    description: 'Húmero, radio y cúbito con sus accidentes óseos.',
    color: '#f0a756',
    models: ['esqueleto'],
  },
  {
    id: 'mano',
    name: 'Mano',
    description: 'Carpo, metacarpo y falanges: 27 huesos.',
    color: '#ef8478',
    models: ['mano'],
  },
  {
    id: 'pelvis',
    name: 'Cintura pélvica',
    description: 'Coxal, sacro y cóccix. Clave para estimar sexo y edad.',
    color: '#78a9f5',
    models: ['esqueleto'],
  },
  {
    id: 'miembro-inferior',
    name: 'Muslo y pierna',
    description: 'Fémur, rótula, tibia y peroné.',
    color: '#93c96f',
    models: ['esqueleto'],
  },
  {
    id: 'pie',
    name: 'Pie',
    description: 'Tarso, metatarso y falanges: 26 huesos.',
    color: '#ee95bb',
    models: ['pie'],
  },
]

export const regionById = Object.fromEntries(regions.map((r) => [r.id, r])) as Record<RegionId, Region>
