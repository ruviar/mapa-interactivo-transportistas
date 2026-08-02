import { animate } from 'motion/react';
import type { Polygon as CapaPoligono } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Polygon, useMap } from 'react-leaflet';

import { RESORTE_TRAZADO } from '../../animation/resortes';
import type { FeatureRegion } from '../../types/geo';
import { anillosDe } from '../../utils/cartografia';

/** Grosor en reposo del trazo, y el pulso con el que se asienta. */
const GROSOR = 2.5;
const GROSOR_PULSO = 2.9;
/** Por encima de las capas de regiones (400) y por debajo de los rótulos (600). */
const PANEL = 'trazado';

/**
 * Elemento de firma: al seleccionar una provincia su borde no cambia de color
 * de golpe, se dibuja — como una carretera señalizándose sobre el mapa.
 *
 * Se monta ya terminado el vuelo (si no, el trazo se dibujaría mientras el
 * `d` del path se está reproyectando) y se anima una sola vez. Al acabar se
 * quita el `dasharray`: si el usuario hace zoom después, el borde ya es una
 * línea continua normal y no un rastro de guiones descuadrados.
 */
export function RouteTraceOverlay({ feature }: { feature: FeatureRegion }) {
  const map = useMap();
  const borde = useRef<CapaPoligono | null>(null);
  const [panelListo, setPanelListo] = useState(false);

  useEffect(() => {
    if (!map.getPane(PANEL)) {
      const panel = map.createPane(PANEL);
      panel.style.zIndex = '450';
      panel.style.pointerEvents = 'none';
    }
    setPanelListo(true);
  }, [map]);

  // Depende de `panelListo` a propósito: hasta que el panel no existe no se
  // monta el <Polygon>, y sin polígono no hay <path> que animar.
  useEffect(() => {
    if (!panelListo) return;
    const path = borde.current?.getElement() as SVGPathElement | null | undefined;
    if (!path) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const largo = path.getTotalLength();
    path.style.strokeDasharray = String(largo);
    path.style.strokeDashoffset = String(largo);

    // El muelle mueve un progreso, no el offset. Acotado en 1: el sobrepaso se
    // come contra el tope —la punta llega al cierre y se para en seco— y lo que
    // se ve del rebote es el retroceso siguiente, en la cabeza del trazo. Un
    // muelle sobre el offset a pelo dejaría el hueco en el arranque de la
    // línea, que se lee como un fallo de dibujo y no como peso.
    const trazo = animate(0, 1, {
      ...RESORTE_TRAZADO,
      onUpdate: (p) => {
        path.style.strokeDashoffset = String(largo * (1 - Math.min(1, p)));
      },
    });

    // El peso de la línea al detenerse: engorda y vuelve.
    const pulso = animate(
      path,
      { strokeWidth: [GROSOR, GROSOR_PULSO, GROSOR] },
      { duration: 0.34, delay: 0.28, ease: 'easeOut' },
    );

    void trazo.finished.then(() => {
      // Sin dasharray el borde vuelve a ser una línea continua normal: si el
      // usuario hace zoom después, no se queda un rastro de guiones descuadrados.
      path.style.strokeDasharray = '';
      path.style.strokeDashoffset = '';
    });

    return () => {
      trazo.stop();
      pulso.stop();
      path.style.strokeWidth = '';
    };
  }, [panelListo]);

  if (!panelListo) return null;

  return (
    <Polygon
      ref={borde}
      pane={PANEL}
      positions={anillosDe(feature)}
      interactive={false}
      className="trazado"
      pathOptions={{ fill: false, weight: 2.5 }}
    />
  );
}
