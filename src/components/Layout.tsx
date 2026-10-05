import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Bone, Box, Dumbbell, Home, Moon, Sun } from 'lucide-react'
import { useProgress } from '../store/progress'
import { cn } from '../lib/text'

const links = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/practica', label: 'Practicar', icon: Dumbbell },
  { to: '/progreso', label: 'Progreso', icon: BarChart3 },
  { to: '/modelos', label: 'Modelos', icon: Box },
]

export function Layout({ children }: { children: ReactNode }) {
  const theme = useProgress((s) => s.theme)
  const toggleTheme = useProgress((s) => s.toggleTheme)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <NavLink to="/" className="mr-auto flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-ink">
              <Bone size={19} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">OsteoLab</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                <Icon size={17} />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            className="cursor-pointer rounded-xl p-2.5 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}

export function ProgressBar({ value, color, className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-line', className)}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </div>
  )
}

export function Ring({ value, size = 132, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 8
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={9} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className="stroke-accent transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold">{Math.round(value * 100)}%</span>
        {label && <span className="text-xs text-muted">{label}</span>}
      </div>
    </div>
  )
}
