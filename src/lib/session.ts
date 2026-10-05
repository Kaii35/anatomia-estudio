import type { Question } from '../types'
import { models } from '../data/models'
import { partName } from '../data/parts'
import { dayKey, type QStat } from '../store/progress'
import { shuffle } from './text'

export type Bucket = 'choice' | 'write' | '3d'

export const BUCKETS: { id: Bucket; label: string; hint: string }[] = [
  { id: 'choice', label: 'Selección múltiple', hint: 'Elige la opción correcta' },
  { id: 'write', label: 'Escribir', hint: 'Teclea la respuesta o enumera' },
  { id: '3d', label: 'Modelo 3D', hint: 'Señala, reconoce o rotula el modelo' },
]

export function bucketOf(q: Question): Bucket {
  if (q.type === 'identify' || q.type === 'label' || q.visual) return '3d'
  return q.type === 'choice' || q.type === 'multi' ? 'choice' : 'write'
}

export interface SessionItem {
  q: Question
  /** Orden barajado de las opciones (choice/multi). */
  order: number[]
}

/** Las preguntas falladas y las nuevas salen más; las ya dominadas, menos. */
function weight(stat: QStat | undefined): number {
  if (!stat) return 3
  if (!stat.lastOk) return 5
  return stat.streak >= 2 ? 0.6 : 1.5
}

function takeWeighted(pool: Question[], stats: Record<string, QStat>): Question | undefined {
  const weights = pool.map((q) => weight(stats[q.id]))
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  const i = weights.findIndex((w) => (r -= w) <= 0)
  return pool.splice(i < 0 ? pool.length - 1 : i, 1)[0]
}

/** Elige `count` preguntas alternando entre los tipos disponibles para que la sesión sea variada. */
export function buildSession(pool: Question[], stats: Record<string, QStat>, count: number): SessionItem[] {
  const byBucket = new Map<Bucket, Question[]>()
  for (const q of pool) {
    const b = bucketOf(q)
    byBucket.set(b, [...(byBucket.get(b) ?? []), q])
  }
  const order = shuffle([...byBucket.keys()])
  const usedKeys = new Set<string>()
  const picked: Question[] = []
  for (let turn = 0; picked.length < count && [...byBucket.values()].some((b) => b.length); turn++) {
    const bucket = byBucket.get(order[turn % order.length])!
    let q: Question | undefined
    while ((q = takeWeighted(bucket, stats)) && q.key && usedKeys.has(q.key)) {
      // misma parte ya preguntada de otra forma: se descarta y se saca otra
    }
    if (!q) continue
    if (q.key) usedKeys.add(q.key)
    picked.push(q)
  }
  return shuffle(picked).map((q) => ({
    q,
    order: q.type === 'choice' || q.type === 'multi' ? shuffle(q.options.map((_, i) => i)) : [],
  }))
}

/** Texto de la respuesta correcta, para el repaso final. */
export function answerText(q: Question): string {
  switch (q.type) {
    case 'choice':
      return q.options[q.answer]
    case 'multi':
      return q.answers.map((i) => q.options[i]).join(' · ')
    case 'write':
      return q.accept[0]
    case 'list':
      return q.items.map((i) => i.label).join(' · ')
    case 'identify':
      return q.targets.map((t) => partName(t, models[q.model])).join(' · ')
    case 'label':
      return q.parts.map((p) => partName(p, models[q.model])).join(' · ')
  }
}

/** Dominio de un conjunto de preguntas, de 0 a 1: cada una aporta hasta 2 aciertos seguidos. */
export function mastery(qs: Question[], stats: Record<string, QStat>): number {
  if (!qs.length) return 0
  return qs.reduce((sum, q) => sum + Math.min(stats[q.id]?.streak ?? 0, 2), 0) / (qs.length * 2)
}

/** Días consecutivos de estudio hasta hoy (o hasta ayer, si hoy aún no se ha estudiado). */
export function dayStreak(days: string[]): number {
  const set = new Set(days)
  const d = new Date()
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(dayKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}
