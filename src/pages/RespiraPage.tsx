import { useState } from 'react';
import RespiraGame from '../components/RespiraGame';

/**
 * RESPIRA.EXE a pantalla completa (siempre de noche).
 * La página ocupa toda la ventana (sin la cabecera de la app). Un primer clic activa
 * la pantalla completa del navegador, que no se puede abrir sin una acción del usuario.
 */
export default function RespiraPage() {
  const [empezado, setEmpezado] = useState(false);

  const entrar = () => {
    // Si el navegador no permite pantalla completa, el juego se abre igual en la ventana.
    document.documentElement.requestFullscreen?.().catch(() => {});
    setEmpezado(true);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0F2A36]">
      <RespiraGame salirHref="#/" />

      {!empezado && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-[#0F2A36]/90 p-6 text-center text-[#F6F4EF]">
          <p style={{ fontFamily: "'Silkscreen', monospace" }} className="text-3xl tracking-wider">
            RESPIRA.EXE
          </p>
          <p className="max-w-sm text-sm text-[#9ED0C4]">Se abre en pantalla completa. Pulsa el botón para entrar.</p>
          <button type="button" onClick={entrar} className="btn-primary px-8 py-4 text-lg">
            Entrar en pantalla completa
          </button>
          <button type="button" onClick={() => setEmpezado(true)} className="text-sm text-[#F6F4EF]/70 underline underline-offset-4 hover:text-[#F6F4EF]">
            Seguir en la ventana
          </button>
        </div>
      )}

    </div>
  );
}
