/** Minúsculas, sin tildes, sin puntuación ni artículos: «El Peroné» → «perone». */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(el|la|los|las|un|una|hueso|huesos)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

/** Errores de tecleo tolerados según la longitud. Conservador: «metacarpiano» y «metatarsiano» distan 2. */
function tolerance(len: number): number {
  return len >= 14 ? 2 : len >= 5 ? 1 : 0
}

export type Match = 'exact' | 'fuzzy' | null

export function matchAnswer(input: string, accept: string[]): Match {
  const n = normalize(input)
  if (!n) return null
  const targets = accept.map(normalize)
  if (targets.includes(n)) return 'exact'
  return targets.some((t) => levenshtein(n, t) <= tolerance(t.length)) ? 'fuzzy' : null
}

/** Índice del primer grupo de respuestas que coincide; prioriza coincidencias exactas sobre aproximadas. */
export function findMatch(input: string, groups: string[][], skip: Set<number>): number {
  let fuzzy = -1
  for (let i = 0; i < groups.length; i++) {
    if (skip.has(i)) continue
    const m = matchAnswer(input, groups[i])
    if (m === 'exact') return i
    if (m === 'fuzzy' && fuzzy < 0) fuzzy = i
  }
  return fuzzy
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Generador pseudoaleatorio determinista (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
