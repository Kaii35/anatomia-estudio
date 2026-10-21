import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

export interface RespiraGameProps {
  /** Fuerza los controles táctiles (joystick + botón A) aunque se abra en computador. */
  forzarTactil?: boolean;
  /** Ruta donde copiaste el juego dentro de /public. Por defecto: '/respira/index.html'. */
  src?: string;
  /** Alto del juego. Por defecto ocupa toda la pantalla (100dvh). */
  height?: number | string;
  /** Muestra el botón para pasar a pantalla completa. Por defecto: true. */
  botonPantallaCompleta?: boolean;
  /** Si se indica, aparece un botón para salir a esa ruta (por ejemplo '#/'). */
  salirHref?: string;
  className?: string;
  style?: CSSProperties;
}

/** En pantallas de este ancho o menores, los botones van dentro de un menú hamburguesa. */
const MOVIL = '(max-width: 768px)';

const estilo = {
  boton: {
    background: '#0F2A36',
    color: '#F6F4EF',
    border: '2px solid #F6F4EF',
    boxShadow: '3px 3px 0 #3D6B7A',
    fontFamily: "'Silkscreen', monospace",
    cursor: 'pointer',
  },
} as const;

/**
 * RESPIRA.EXE — juego pixel art del sistema respiratorio (ambientación de noche).
 * El juego vive como un archivo HTML autocontenido en /public/respira/index.html
 * y se monta aquí dentro de un iframe, así no choca con tus estilos, rutas ni dependencias.
 */
export default function RespiraGame({
  forzarTactil = false,
  src = '/respira/index.html',
  height = '100dvh',
  botonPantallaCompleta = true,
  salirHref,
  className,
  style,
}: RespiraGameProps) {
  const url = useMemo(() => (forzarTactil ? `${src}?touch=1` : src), [forzarTactil, src]);

  const iframe = useRef<HTMLIFrameElement>(null);
  const [completa, setCompleta] = useState(false);
  const [movil, setMovil] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const cambio = () => setCompleta(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', cambio);
    return () => document.removeEventListener('fullscreenchange', cambio);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOVIL);
    const aplicar = () => setMovil(mq.matches);
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, []);

  // En móvil, los botones propios del juego se ocultan: su menú está en el menú hamburguesa.
  // Se revisa cada poco porque el juego vuelve a dibujar su interfaz.
  useEffect(() => {
    if (!movil) return;
    const ocultar = () => {
      const doc = iframe.current?.contentDocument;
      if (!doc) return;
      doc.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
        const texto = (b.textContent ?? '').trim();
        if (texto === 'Mapa' || texto === '¡Hey!' || b.getAttribute('aria-label') === 'Sonido') b.style.display = 'none';
      });
    };
    ocultar();
    const id = window.setInterval(ocultar, 400);
    return () => window.clearInterval(id);
  }, [movil, url]);

  // Pulsa un botón del juego (Mapa, Sonido o ¡Hey!) desde fuera.
  const pulsarJuego = (buscar: (b: HTMLButtonElement) => boolean) => {
    const doc = iframe.current?.contentDocument;
    const boton = doc ? [...doc.querySelectorAll<HTMLButtonElement>('button')].find(buscar) : undefined;
    boton?.click();
    iframe.current?.focus();
  };
  const accion = {
    mapa: () => pulsarJuego((b) => (b.textContent ?? '').trim() === 'Mapa'),
    sonido: () => pulsarJuego((b) => b.getAttribute('aria-label') === 'Sonido'),
    hey: () => pulsarJuego((b) => (b.textContent ?? '').trim() === '¡Hey!'),
  };

  // Pantalla completa sobre toda la página. Los navegadores solo la permiten tras un clic.
  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      return;
    }
    // Devuelve el teclado al juego para que WASD y flechas funcionen de inmediato.
    iframe.current?.focus();
  };

  const elementosMenu: { texto: string; accion: () => void; salir?: boolean }[] = [
    { texto: completa ? 'Salir de pantalla completa' : 'Pantalla completa', accion: alternar },
    { texto: 'Mapa', accion: accion.mapa },
    { texto: 'Sonido ♪', accion: accion.sonido },
    { texto: '¡Hey!', accion: accion.hey },
  ];
  if (salirHref) elementosMenu.push({ texto: 'Salir', accion: () => (window.location.hash = salirHref.replace(/^#/, '')), salir: true });

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height, background: '#0F2A36', overflow: 'hidden', ...style }}
    >
      <iframe
        ref={iframe}
        key={url}
        src={url}
        title="Respira.exe · Sistema respiratorio"
        allow="fullscreen; autoplay"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, display: 'block' }}
      />

      {movil ? (
        <>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menu}
            style={{ ...estilo.boton, position: 'absolute', top: 10, right: 10, zIndex: 30, width: 42, height: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            {menu ? (
              <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
            ) : (
              [0, 1, 2].map((i) => <span key={i} style={{ width: 18, height: 2, background: '#F6F4EF' }} />)
            )}
          </button>
          {menu && (
            <div
              role="menu"
              style={{ ...estilo.boton, position: 'absolute', top: 60, right: 10, zIndex: 30, width: 220, padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {elementosMenu.map((e) => (
                <button
                  key={e.texto}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    e.accion();
                  }}
                  style={{
                    ...estilo.boton,
                    boxShadow: 'none',
                    border: '1px solid #F6F4EF',
                    padding: '10px 12px',
                    fontSize: 12,
                    textAlign: 'left',
                    background: e.salir ? '#B5492F' : '#0F2A36',
                  }}
                >
                  {e.texto}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ position: 'absolute', top: 56, right: 10, zIndex: 2, display: 'flex', gap: 8 }}>
          {botonPantallaCompleta && (
            <button type="button" onClick={alternar} title={completa ? 'Salir de pantalla completa' : 'Pantalla completa'} style={{ ...estilo.boton, padding: '6px 10px', fontSize: 11 }}>
              {completa ? 'SALIR ⤫' : 'PANTALLA ⛶'}
            </button>
          )}
        </div>
      )}

      {salirHref && !movil && (
        <a
          href={salirHref}
          style={{ ...estilo.boton, position: 'absolute', bottom: 12, left: 12, zIndex: 2, padding: '6px 10px', fontSize: 11, textDecoration: 'none', color: '#F6F4EF' }}
        >
          ← SALIR
        </a>
      )}
    </div>
  );
}
