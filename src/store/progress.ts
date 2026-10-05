import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RegionId } from '../types'

export interface QStat {
  seen: number
  ok: number
  /** Aciertos consecutivos. */
  streak: number
  lastOk: boolean
  last: number
}

export interface SessionLog {
  at: number
  regions: RegionId[]
  score: number
  total: number
}

interface ProgressState {
  stats: Record<string, QStat>
  sessions: SessionLog[]
  /** Días (AAAA-MM-DD, hora local) en los que se respondió al menos una pregunta. */
  days: string[]
  theme: 'dark' | 'light'
  /** Modelos 3D con cada hueso de su color (true) o en color hueso uniforme (false). */
  colors: boolean
  record: (questionId: string, score: number) => void
  logSession: (log: SessionLog) => void
  toggleTheme: () => void
  toggleColors: () => void
  reset: () => void
}

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      stats: {},
      sessions: [],
      days: [],
      theme: 'dark',
      colors: false,
      record: (id, score) =>
        set((s) => {
          const prev = s.stats[id] ?? { seen: 0, ok: 0, streak: 0, lastOk: false, last: 0 }
          const ok = score >= 0.999
          const today = dayKey()
          return {
            stats: {
              ...s.stats,
              [id]: { seen: prev.seen + 1, ok: prev.ok + (ok ? 1 : 0), streak: ok ? prev.streak + 1 : 0, lastOk: ok, last: Date.now() },
            },
            days: s.days.includes(today) ? s.days : [...s.days, today],
          }
        }),
      logSession: (log) => set((s) => ({ sessions: [log, ...s.sessions].slice(0, 60) })),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleColors: () => set((s) => ({ colors: !s.colors })),
      reset: () => set({ stats: {}, sessions: [], days: [] }),
    }),
    { name: 'osteolab-progreso' },
  ),
)
