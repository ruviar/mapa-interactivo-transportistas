import Lenis from 'lenis';
import { useEffect } from 'react';

import { useMenosMovimiento } from '../../animation/fisica';

import 'lenis/dist/lenis.css';

/**
 * Scroll de inercia para toda la página.
 *
 * Lenis escucha la rueda en `window` con `passive: false` y se come el evento
 * para interpolar el desplazamiento. Leaflet necesita esa misma rueda sin tocar
 * para su zoom, así que el contenedor del mapa lleva `data-lenis-prevent`:
 * Lenis recorre el `composedPath` del evento y, si encuentra ese atributo,
 * vuelve sin llamar a `preventDefault` (lenis.mjs, `onVirtualScroll`). El
 * evento llega a Leaflet exactamente como lo emitió el navegador.
 *
 * Consecuencia asumida: sobre el mapa la rueda zoomea y la página no avanza
 * —Leaflet detiene el evento él mismo—. Por eso la sección del mapa deja
 * franjas de página arriba y abajo por las que sí se puede seguir bajando.
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
      // El CTA del hero es un ancla (#mapa): que la gobierne Lenis y no el
      // salto nativo, que con `lenis` montado se pelea con la interpolación.
      anchors: true,
      // Por debajo se siente pastoso al leer; por encima, casi nativo.
      lerp: 0.09,
    });

    return () => lenis.destroy();
  }, [quieto]);

  return null;
}
