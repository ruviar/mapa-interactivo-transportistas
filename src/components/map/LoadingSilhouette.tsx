import type { GeoJSON as CapaGeoJSON, Path } from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';

import { CCAA_GEO } from '../../utils/cartografia';

/** El país entero es mucho más perímetro que una provincia: 900 ms, no 600. */
const DURACION = 900;
/** Disolución: el mismo tiempo que el panel (`--animate-duration-panel`). */
const FUNDIDO = 250;
/** Con el JSON en caché la carga dura 80 ms y el trazo no llegaría a leerse. */
const MINIMO = 450;
/** Por encima de las regiones (400) y por debajo del trazado de firma (450). */
const PANEL = 'silueta';
const MARCA = 'silueta-trazada';

/** Una vez por sesión y nunca si se ha pedido menos movimiento. */
function procede(): boolean {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(MARCA) === null;
  } catch {
    return true; // navegación privada con almacenamiento bloqueado
  }
}

/**
 * Carga inicial: la silueta de España se dibuja una vez y se disuelve cuando
 * llegan los datos. Son ~12 MB de `companies.json` y hasta que no aterrizan el
 * mapa enseña las regiones planas con un `·` por cifra; esto es lo que dice que
 * el mapa está vivo sin recurrir a un spinner ajeno al lenguaje del producto.
 *
 * Dos capas y no una: la línea punteada es la guía —la ruta por señalizar— y
 * encima se traza el recorrido continuo. En SVG el punteado y el "dibujarse"
 * se disputan la misma propiedad (`stroke-dasharray`), así que superponerlas es
 * la única forma de tener las dos cosas a la vez.
 */
export function LoadingSilhouette({ cargando }: { cargando: boolean }) {
  const map = useMap();
  const trazo = useRef<CapaGeoJSON | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const [viva, setViva] = useState(procede);
  const nacida = useRef(0);

  useEffect(() => {
    if (!viva) return;
    let creado = map.getPane(PANEL);
    if (!creado) {
      creado = map.createPane(PANEL);
      creado.style.zIndex = '445';
      creado.style.pointerEvents = 'none';
    }
    setPanel(creado);
  }, [map, viva]);

  // Depende de `panel` a propósito: hasta que no existe no se monta la capa, y
  // sin capa no hay <path> con longitud que medir.
  useEffect(() => {
    if (!panel) return;
    nacida.current = performance.now();

    trazo.current?.eachLayer((sub) => {
      const path = (sub as Path).getElement() as SVGPathElement | null;
      if (!path) return;

      const largo = path.getTotalLength();
      path.style.transition = 'none';
      path.style.strokeDasharray = String(largo);
      path.style.strokeDashoffset = String(largo);
      void path.getBoundingClientRect(); // fuerza el reflujo antes de animar

      path.style.transition = `stroke-dashoffset ${DURACION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      path.style.strokeDashoffset = '0';
    });
  }, [panel]);

  useEffect(() => {
    if (!panel || cargando) return;

    const espera = Math.max(0, MINIMO - (performance.now() - nacida.current));
    const aDisolver = window.setTimeout(() => {
      panel.style.transition = `opacity ${FUNDIDO}ms ease`;
      panel.style.opacity = '0';
    }, espera);
    const aRetirar = window.setTimeout(() => {
      try {
        sessionStorage.setItem(MARCA, '1');
      } catch {
        /* sin almacenamiento se repetirá en la siguiente carga; no es grave */
      }
      setViva(false);
    }, espera + FUNDIDO);

    return () => {
      window.clearTimeout(aDisolver);
      window.clearTimeout(aRetirar);
    };
  }, [panel, cargando]);

  if (!viva || !panel) return null;

  return (
    <>
      <GeoJSON
        data={CCAA_GEO}
        pane={PANEL}
        interactive={false}
        style={{ className: 'silueta-guia', fill: false, weight: 1, dashArray: '2 6', opacity: 0.5 }}
      />
      <GeoJSON
        ref={trazo}
        data={CCAA_GEO}
        pane={PANEL}
        interactive={false}
        style={{ className: 'silueta-trazo', fill: false, weight: 1.2, opacity: 0.55 }}
      />
    </>
  );
}
