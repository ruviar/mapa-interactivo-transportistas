import type { Polygon as CapaPoligono } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Polygon, useMap } from 'react-leaflet';

import type { FeatureRegion } from '../../types/geo';
import { anillosDe } from '../../utils/cartografia';

/** Coincide con `--animate-duration-trazado` de theme.css. */
const DURACION = 600;
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
    path.style.transition = 'none';
    path.style.strokeDasharray = String(largo);
    path.style.strokeDashoffset = String(largo);
    void path.getBoundingClientRect(); // fuerza el reflujo antes de animar

    path.style.transition = `stroke-dashoffset ${DURACION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    path.style.strokeDashoffset = '0';

    const fin = window.setTimeout(() => {
      path.style.transition = '';
      path.style.strokeDasharray = '';
    }, DURACION);

    return () => window.clearTimeout(fin);
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
