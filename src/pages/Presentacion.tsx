import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import Modelo3D from '../presentacion/Modelo3D';
import { useGLTF } from '@react-three/drei';

/** Tamaño de diseño de las láminas. Se escalan para caber en cualquier pantalla. */
const W = 1920;
const H = 1080;
/** Tiempo que dura cada tarjeta de los ciclos (igual que en la presentación original). */
const DURACION_CICLO = 7000;
/** Distancia horizontal con la que entran y salen las láminas. */
const DESPLAZAMIENTO = 80;

/** Animaciones de las láminas: las mismas de la presentación original, con el movimiento suavizado. */
const CSS = `
.presentacion .deck-slide{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;opacity:0;visibility:hidden;
  transition:opacity .8s cubic-bezier(.4,0,.2,1),transform .8s cubic-bezier(.4,0,.2,1),visibility 0s linear .8s;will-change:opacity,transform;backface-visibility:hidden}
.presentacion .deck-slide[data-deck-active]{visibility:visible;transition-delay:0s,0s,0s}
@keyframes a-up{from{opacity:0;transform:translateY(28px)}}
@keyframes a-fade{from{opacity:0}}
@keyframes a-line{from{transform:scaleX(0)}}
@keyframes a-vline{from{transform:scaleY(0)}}
@keyframes a-pop{from{opacity:0;transform:scale(.6)}}
@keyframes a-left{from{opacity:0;transform:translateX(-36px)}}
@keyframes a-tree{from{opacity:0;transform:translateY(-40px) scale(.96)}}
@keyframes a-breathe{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.07);opacity:1}}
@media (prefers-reduced-motion:no-preference){
  .presentacion [data-deck-active] [data-a="up"]{animation:a-up .9s cubic-bezier(.16,.8,.24,1) both}
  .presentacion [data-deck-active] [data-a="fade"]{animation:a-fade 1.1s ease both}
  .presentacion [data-deck-active] [data-a="left"]{animation:a-left .9s cubic-bezier(.16,.8,.24,1) both}
  .presentacion [data-deck-active] [data-a="line"]{animation:a-line 1.2s cubic-bezier(.6,0,.2,1) both;transform-origin:left center}
  .presentacion [data-deck-active] [data-a="vline"]{animation:a-vline 1.4s cubic-bezier(.6,0,.2,1) both;transform-origin:center top}
  .presentacion [data-deck-active] [data-a="pop"]{animation:a-pop .8s cubic-bezier(.3,1.5,.5,1) both}
  .presentacion [data-deck-active] [data-a="tree"]{animation:a-tree 1.8s cubic-bezier(.16,.8,.24,1) both}
  .presentacion [data-deck-active] [data-a="breathe"]{animation:a-breathe 7s ease-in-out infinite}
}
.presentacion [data-cycle-item]{transition:opacity .9s ease}
`;

interface Modelo {
  id: number;
  lamina: number;
  url: string;
  destino: HTMLElement;
}

/** ¿Está a la vista este elemento? Si cuelga de una tarjeta de ciclo que no es la visible, no. */
function visibleEnCiclo(el: HTMLElement): boolean {
  for (let nodo: HTMLElement | null = el; nodo; nodo = nodo.parentElement) {
    if (nodo.hasAttribute('data-cycle-item') && nodo.style.opacity === '0') return false;
  }
  return true;
}

/** Cambia la tarjeta visible de un ciclo y reinicia su barra de progreso. */
function mostrarTarjeta(ciclo: HTMLElement, indice: number, inicio: WeakMap<HTMLElement, { idx: number; t: number }>) {
  inicio.set(ciclo, { idx: indice, t: Date.now() });
  ciclo.querySelectorAll<HTMLElement>('[data-cycle-item]').forEach((el) => {
    const activa = Number(el.dataset.cycleItem) === indice;
    el.style.opacity = activa ? '1' : '0';
    el.style.pointerEvents = activa ? 'auto' : 'none';
  });
  ciclo.querySelectorAll<HTMLElement>('[data-cycle-tab]').forEach((b) => {
    b.style.color = Number(b.dataset.cycleTab) === indice ? '#F6F4EF' : '#8FA6AD';
  });
}

export default function Presentacion() {
  const area = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const ciclos = useRef(new WeakMap<HTMLElement, { idx: number; t: number }>());
  const [listo, setListo] = useState(false);
  const [total, setTotal] = useState(0);
  const [idx, setIdx] = useState(0);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  // Modelos que hay que dibujar ahora: solo los de la lámina activa y de la tarjeta visible.
  const [dibujando, setDibujando] = useState<number[]>([]);
  const idxRef = useRef(0);
  idxRef.current = idx;
  const [escala, setEscala] = useState(1);
  const [completa, setCompleta] = useState(false);
  const [titulos, setTitulos] = useState<string[]>([]);
  const [inicioX, setInicioX] = useState<number | null>(null);

  // Carga las láminas y sustituye cada visor de modelo por un contenedor que React llena con el modelo 3D.
  useEffect(() => {
    let vivo = true;
    fetch('/presentacion/diapositivas.html')
      .then((r) => r.text())
      .then((html) => {
        if (!vivo || !lienzo.current) return;
        const cont = lienzo.current;
        cont.innerHTML = html;
        const laminas = [...cont.querySelectorAll<HTMLElement>('section[data-label]')];
        laminas.forEach((s) => s.classList.add('deck-slide'));
        const nuevos: Modelo[] = [];
        laminas.forEach((s, i) => {
          s.querySelectorAll<HTMLElement>('model-viewer[data-src]').forEach((mv) => {
            const destino = document.createElement('div');
            destino.setAttribute('style', mv.getAttribute('style') ?? '');
            mv.replaceWith(destino);
            nuevos.push({ id: nuevos.length, lamina: i, url: mv.dataset.src ?? '', destino });
          });
        });
        // Se descargan todos los modelos al entrar (son ligeros tras optimizarlos), así no hay pausas al cambiar de lámina.
        nuevos.forEach((m) => useGLTF.preload(m.url));
        setTitulos(laminas.map((s) => s.dataset.label ?? ''));
        setTotal(laminas.length);
        setModelos(nuevos);
        setListo(true);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  // Ajusta el tamaño de la presentación al espacio disponible.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const medir = () => setEscala(Math.min(el.clientWidth / W, el.clientHeight / H));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Muestra la lámina activa, oculta las demás (entran y salen con un desplazamiento) y marca la activa para sus animaciones.
  useEffect(() => {
    if (!listo || !lienzo.current) return;
    const laminas = [...lienzo.current.querySelectorAll<HTMLElement>('section.deck-slide')];
    laminas.forEach((s, i) => {
      const activa = i === idx;
      if (activa) s.setAttribute('data-deck-active', '');
      else s.removeAttribute('data-deck-active');
      s.style.opacity = activa ? '1' : '0';
      s.style.transform = activa ? 'translate3d(0,0,0)' : `translate3d(${i < idx ? -DESPLAZAMIENTO : DESPLAZAMIENTO}px,0,0)`;
      s.style.pointerEvents = activa ? 'auto' : 'none';
      s.setAttribute('aria-hidden', String(!activa));
    });
  }, [idx, listo]);

  // Ciclos de tarjetas: rotan solos cada 7 segundos y se pueden cambiar con sus pestañas.
  // Cada vez, también se decide qué modelos están a la vista para dibujarlos.
  useEffect(() => {
    if (!listo) return;
    const timer = window.setInterval(() => {
      lienzo.current?.querySelectorAll<HTMLElement>('[data-cycle]').forEach((ciclo) => {
        const n = ciclo.querySelectorAll('[data-cycle-item]').length;
        if (n < 2) return;
        if (!ciclos.current.has(ciclo)) mostrarTarjeta(ciclo, 0, ciclos.current);
        const estado = ciclos.current.get(ciclo)!;
        const p = Math.min(1, (Date.now() - estado.t) / DURACION_CICLO);
        ciclo.querySelectorAll<HTMLElement>('[data-cycle-bar]').forEach((barra) => {
          barra.style.width = (Number(barra.dataset.cycleBar) === estado.idx ? p * 100 : 0) + '%';
        });
        if (p >= 1) mostrarTarjeta(ciclo, (estado.idx + 1) % n, ciclos.current);
      });
      const a = modelos
        .filter((m) => m.lamina === idxRef.current && visibleEnCiclo(m.destino))
        .map((m) => m.id);
      setDibujando((previo) => (previo.join() === a.join() ? previo : a));
    }, 100);
    return () => window.clearInterval(timer);
  }, [listo, modelos]);

  const ir = useCallback(
    (delta: number) => setIdx((i) => Math.max(0, Math.min(total - 1, i + delta))),
    [total],
  );

  const alternarCompleta = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  // Teclado: flechas, espacio, inicio y fin, y F para pantalla completa.
  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        ir(1);
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        ir(-1);
      } else if (e.key === 'Home') setIdx(0);
      else if (e.key === 'End') setIdx(Math.max(0, total - 1));
      else if (e.key.toLowerCase() === 'f') alternarCompleta();
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [ir, total, alternarCompleta]);

  useEffect(() => {
    const cambio = () => setCompleta(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', cambio);
    return () => document.removeEventListener('fullscreenchange', cambio);
  }, []);

  // Pulsar una pestaña de ciclo lo muestra al instante.
  const alPulsar = (e: ReactMouseEvent<HTMLDivElement>) => {
    const pestana = (e.target as HTMLElement).closest<HTMLElement>('[data-cycle-tab]');
    const ciclo = pestana?.closest<HTMLElement>('[data-cycle]');
    if (pestana && ciclo) mostrarTarjeta(ciclo, Number(pestana.dataset.cycleTab), ciclos.current);
  };

  // Deslizar con el dedo (tablet o celular) para cambiar de lámina.
  const alTocar = (x: number | null) => setInicioX(x);
  const alSoltar = (x: number) => {
    if (inicioX === null) return;
    const d = x - inicioX;
    if (Math.abs(d) > 60) ir(d < 0 ? 1 : -1);
    setInicioX(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0F2A36] text-[#F6F4EF]">
      <style>{CSS}</style>

      <div
        ref={area}
        className="relative min-h-0 flex-1 overflow-hidden"
        onTouchStart={(e) => alTocar(e.touches[0].clientX)}
        onTouchEnd={(e) => alSoltar(e.changedTouches[0].clientX)}
      >
        <div
          ref={lienzo}
          className="presentacion"
          onClick={alPulsar}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: W,
            height: H,
            transform: `translate(-50%, -50%) scale(${escala})`,
            transformOrigin: 'center center',
          }}
        />

        {listo &&
          modelos
            .filter((m) => dibujando.includes(m.id))
            .map((m) => createPortal(<Modelo3D key={m.id} url={m.url} />, m.destino, `modelo-${m.id}`))}

        {!listo && <p className="absolute inset-0 grid place-items-center text-sm text-[#9ED0C4]">Cargando presentación…</p>}
      </div>

      <nav className="flex h-14 shrink-0 items-center gap-3 border-t border-white/10 bg-[#0B2029] px-3 text-sm">
        <Link to="/" className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs">
          ← Inicio
        </Link>
        <button type="button" aria-label="Anterior" className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 disabled:opacity-30" disabled={idx === 0} onClick={() => ir(-1)}>
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[4.5rem] text-center tabular-nums">
          {total ? idx + 1 : 0} / {total}
        </span>
        <button type="button" aria-label="Siguiente" className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 disabled:opacity-30" disabled={idx >= total - 1} onClick={() => ir(1)}>
          <ChevronRight size={18} />
        </button>
        <span className="hidden min-w-0 flex-1 truncate text-[#9ED0C4] md:block">{titulos[idx] ?? ''}</span>
        <div className="hidden h-1 w-40 overflow-hidden rounded-full bg-white/15 md:block">
          <div className="h-full bg-[#E9A48F] transition-[width] duration-500" style={{ width: total ? `${((idx + 1) / total) * 100}%` : '0%' }} />
        </div>
        <button type="button" aria-label={completa ? 'Salir de pantalla completa' : 'Pantalla completa'} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-white/20" onClick={alternarCompleta}>
          {completa ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </nav>
    </div>
  );
}
