import Lenis from 'lenis';
import { useEffect } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';

import 'lenis/dist/lenis.css';

/**
 * Scroll de inercia para toda la página.
 *
 * Lenis escucha la rueda en `window` con `passive: false` y se come el evento
 * para interpolar el desplazamiento. El mapa ya no vive embebido en esta
 * página —es la herramienta a pantalla completa detrás de `?app`—, así que
 * aquí no hay ningún elemento que necesite quedar fuera de Lenis.
 *
 * Con `prefers-reduced-motion` no se instancia: la página vuelve al scroll
 * nativo del navegador, que es justo lo que pide quien activa ese ajuste.
 */
export function ScrollSuave() {
  const quieto = useMenosMovimiento();

  useEffect(() => {
    if (quieto) return;

    const lenis = new Lenis({
      // Su propio bucle de rAF. Un bucle aparte solo para esto no aporta nada
      // y hay que acordarse de cancelarlo.
      autoRaf: true,
      // Los enlaces a #contacto y #por-que son anclas: que las gobierne
      // Lenis y no el salto nativo, que con `lenis` montado se pelea con la
      // interpolación.
      anchors: true,
      // Por debajo se siente pastoso al leer; por encima, casi nativo.
      lerp: 0.09,
    });

    return () => lenis.destroy();
  }, [quieto]);

  return null;
}
