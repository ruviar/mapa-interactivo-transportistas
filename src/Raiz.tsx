import { createContext, useContext, useEffect, useState } from 'react';

import App from './App';
import { Landing } from './landing/Landing';

type Vista = 'landing' | 'app';

function vistaDeUrl(): Vista {
  return new URLSearchParams(window.location.search).has('app') ? 'app' : 'landing';
}

/**
 * La herramienta lleva su propio tema (`html.tema-app`, ver theme.css) y la
 * landing el de marca. Se aplica ANTES de `setVista`: los componentes del mapa
 * leen la paleta computada durante su montaje, y un efecto llegaría tarde.
 */
function aplicarTema(vista: Vista) {
  document.documentElement.classList.toggle('tema-app', vista === 'app');
}

const ContextoNavegacion = createContext<(destino: Vista) => void>(() => {});

/** Lo usan los enlaces "abrir la herramienta a pantalla completa" de la landing. */
export function useIrAVista() {
  return useContext(ContextoNavegacion);
}

/**
 * Alterna landing/herramienta como estado en cliente, no como navegación
 * dura: así el salto puede envolverse en una View Transition nativa. La URL
 * (`?app`) se sincroniza con `history.pushState` — sigue siendo enlazable y
 * recargable exactamente igual que antes — y `popstate` mantiene atrás/
 * adelante del navegador funcionando.
 */
export function Raiz() {
  const [vista, setVista] = useState<Vista>(vistaDeUrl);

  useEffect(() => {
    const alNavegar = () => {
      const destino = vistaDeUrl();
      aplicarTema(destino);
      setVista(destino);
    };
    window.addEventListener('popstate', alNavegar);
    return () => window.removeEventListener('popstate', alNavegar);
  }, []);

  const irA = (destino: Vista) => {
    if (destino === vista) return;

    const aplicar = () => {
      const url = destino === 'app' ? '?app' : window.location.pathname;
      history.pushState(null, '', url);
      aplicarTema(destino);
      setVista(destino);
    };

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!quieto && document.startViewTransition) {
      document.startViewTransition(aplicar);
    } else {
      aplicar();
    }
  };

  return (
    <ContextoNavegacion.Provider value={irA}>
      {vista === 'app' ? (
        <div className="h-dvh">
          <App />
        </div>
      ) : (
        <Landing />
      )}
    </ContextoNavegacion.Provider>
  );
}
