import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { onDisconnect, onValue, ref, remove, set, update } from 'firebase/database';
import { Trophy, Users, X } from 'lucide-react';
import RespiraGame from '../components/RespiraGame';
import { db } from '../lib/firebase';

/** Un jugador sin señal durante más de este tiempo deja de mostrarse. */
const EDAD_MAX = 20000;
/** Sin o, I ni 0 ni 1 para que el código no se confunda al leerlo. */
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODIGO = /^[A-Z0-9]{4,8}$/;

interface Jugador {
  nombre: string;
  x: number;
  y: number;
  dir: string;
  av: Record<string, unknown>;
  t: number;
}

interface Resultado {
  nombre: string;
  puntos: number;
  tiempo: number;
  t: number;
}

/** Identificador de esta pestaña: se conserva mientras la pestaña esté abierta. */
function identificador(): string {
  let id = sessionStorage.getItem('respira_uid');
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('respira_uid', id);
  }
  return id;
}

function codigoNuevo(): string {
  return Array.from({ length: 5 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
}

function formatoTiempo(segundos: number): string {
  return `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
}

export default function RespiraSala() {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [sala, setSala] = useState<string | null>(null);
  const [jugadores, setJugadores] = useState<Record<string, Jugador>>({});
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});
  const [panel, setPanel] = useState(false);
  const [error, setError] = useState('');
  const [ahora, setAhora] = useState(Date.now());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const yo = useMemo(identificador, []);

  // Entrar a la sala (o crearla): valida el código y el nombre.
  const entrar = (cod: string) => {
    const limpio = cod.trim().toUpperCase();
    if (!CODIGO.test(limpio)) return setError('El código tiene de 4 a 8 letras o números.');
    if (nombre.trim().length < 2) return setError('Escribe tu nombre (mínimo 2 letras).');
    setError('');
    setSala(limpio);
    setCodigo(limpio);
  };

  // Presencia: mientras estés en la sala, apareces en el mapa. Si se cierra la pestaña, desapareces.
  useEffect(() => {
    if (!sala) return;
    const miRef = ref(db, `salas/${sala}/jugadores/${yo}`);
    onDisconnect(miRef).remove();
    // Aparece en la sala desde que entra (aún sin posición: x = -1 significa «todavía creando su personaje»).
    set(miRef, { nombre, x: -1, y: -1, dir: 'down', av: {}, t: Date.now() } satisfies Jugador).catch(() => {});
    const latido = window.setInterval(() => update(miRef, { t: Date.now() }).catch(() => {}), 5000);
    const quitarJugadores = onValue(ref(db, `salas/${sala}/jugadores`), (s) => setJugadores(s.val() ?? {}));
    const quitarResultados = onValue(ref(db, `salas/${sala}/resultados`), (s) => setResultados(s.val() ?? {}));
    const reloj = window.setInterval(() => setAhora(Date.now()), 2000);
    return () => {
      quitarJugadores();
      quitarResultados();
      window.clearInterval(reloj);
      window.clearInterval(latido);
      remove(miRef).catch(() => {});
      onDisconnect(miRef).cancel().catch(() => {});
    };
  }, [sala, yo, nombre]);

  // Lo que ve el juego: los demás jugadores que siguen conectados.
  const otros = useMemo(
    () => Object.entries(jugadores).filter(([id, j]) => id !== yo && ahora - j.t < EDAD_MAX && j.x >= 0).map(([, j]) => j),
    [jugadores, yo, ahora],
  );
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ tipo: 'otros', jugadores: otros }, '*');
  }, [otros]);

  // Mensajes del juego: posición (para los demás) y fin de partida (para la clasificación).
  const alRecibir = useCallback(
    (datos: { tipo?: string; x?: number; y?: number; dir?: string; av?: Record<string, unknown>; nombre?: string; puntos?: number; tiempo?: number }) => {
      if (!sala || !datos) return;
      if (datos.tipo === 'pos') {
        set(ref(db, `salas/${sala}/jugadores/${yo}`), {
          nombre: (datos.nombre || nombre).slice(0, 12),
          x: Math.round(datos.x ?? 0),
          y: Math.round(datos.y ?? 0),
          dir: datos.dir ?? 'down',
          av: datos.av ?? {},
          t: Date.now(),
        } satisfies Jugador);
      }
      if (datos.tipo === 'fin') {
        set(ref(db, `salas/${sala}/resultados/${yo}`), {
          nombre: (datos.nombre || nombre).slice(0, 12),
          puntos: datos.puntos ?? 0,
          tiempo: datos.tiempo ?? 0,
          t: Date.now(),
        } satisfies Resultado);
      }
    },
    [sala, yo, nombre],
  );

  const ranking = useMemo(
    () =>
      Object.entries(resultados)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => b.puntos - a.puntos || a.tiempo - b.tiempo),
    [resultados],
  );
  const enJuego = Object.values(jugadores).filter((j) => ahora - j.t < EDAD_MAX).length;

  if (!sala) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <section className="card space-y-5 p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">Sala de clase</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Entra con el código</h1>
            <p className="mt-2 text-sm text-muted">Todos con el mismo código aparecen en el mismo mapa. No necesitas cuenta.</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">Tu nombre</span>
            <input className="field" value={nombre} maxLength={12} placeholder="Ej. Ana" onChange={(e) => setNombre(e.target.value)} />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">Código de la sala</span>
            <input
              className="field font-mono tracking-widest uppercase"
              value={codigo}
              maxLength={8}
              placeholder="AB7K2"
              onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
          </label>

          {error && <p className="text-sm text-bad">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-primary flex-1 py-3" onClick={() => entrar(codigo)}>
              Entrar a la sala
            </button>
            <button
              type="button"
              className="btn-soft flex-1 py-3"
              onClick={() => {
                const nuevo = codigoNuevo();
                setCodigo(nuevo);
                entrar(nuevo);
              }}
            >
              Crear sala nueva
            </button>
          </div>
        </section>
        <Link to="/" className="block text-center text-sm text-muted hover:text-ink">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0F2A36]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0F2A36] px-3 text-[#F6F4EF]">
        <span className="font-mono text-sm tracking-widest">SALA {sala}</span>
        <span className="flex items-center gap-1.5 text-xs text-[#9ED0C4]">
          <Users size={14} /> {enJuego} conectados
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs" onClick={() => setPanel((p) => !p)}>
            <Trophy size={14} /> Clasificación ({ranking.length})
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs"
            onClick={() => {
              remove(ref(db, `salas/${sala}/jugadores/${yo}`)).catch(() => {});
              setSala(null);
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <RespiraGame
          height="100%"
          src={`/respira/index.html?sala=${sala}&nombre=${encodeURIComponent(nombre.trim())}`}
          iframeRef={iframeRef}
          onMensaje={alRecibir}
        />

        {panel && (
          <aside className="absolute top-2 right-2 bottom-2 z-30 flex w-[min(340px,calc(100vw-1rem))] flex-col gap-3 overflow-hidden rounded-2xl border border-white/15 bg-[#17121a] p-4 text-[#F6F4EF] shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Clasificación</h2>
              <button type="button" aria-label="Cerrar" onClick={() => setPanel(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[#9ED0C4]">Ordenado por puntaje: 100 pts por acierto a la primera y 50 si fallaste antes. En empate, gana quien terminó antes.</p>
            <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {ranking.length === 0 && <li className="text-sm text-white/60">Todavía nadie ha terminado.</li>}
              {ranking.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="w-6 font-display text-lg font-semibold text-accent">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{r.nombre}</span>
                  <span className="text-sm tabular-nums">{r.puntos} pts</span>
                  <span className="w-14 text-right font-mono text-xs text-white/70 tabular-nums">{formatoTiempo(r.tiempo)}</span>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
