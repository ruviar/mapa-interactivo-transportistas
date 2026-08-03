import type { Map as LeafletMap } from 'leaflet';
import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { gsap } from '../../animation/gsap';
import type { Vista } from '../../hooks/useMapNavigation';
import type { ColeccionRegiones } from '../../types/geo';

/** Algo por encima de `--animate-duration-mapa` (420ms): que el vuelo termine antes de medir. */
const RETARDO_TRAS_VUELO = 480;

interface Props {
  mapaRef: RefObject<LeafletMap | null>;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  provinciasGeo: ColeccionRegiones | null;
  vista: Vista;
  clave: string;
  /** Solo en columna fija de escritorio: en la hoja inferior el listado no está al lado del mapa. */
  activo: boolean;
}

/**
 * El toque de firma, en su segunda y última aparición (la primera es
 * `RedDeRutas` en el hero; la tercera, la guía de `ComoFunciona`): al elegir
 * una provincia, una línea se dibuja desde su centroide en el mapa hasta la
 * cabecera del listado — la ruta hacia el resultado, literalmente. Se suma al
 * trazado de perímetro de `RouteTraceOverlay`, no lo sustituye: aquel sigue
 * marcando la selección sobre el propio mapa.
 *
 * Vive fuera del árbol de Leaflet a propósito: el punto de llegada está en el
 * panel lateral, y ninguna capa de Leaflet puede pintar ahí. El punto de
 * partida se proyecta a mano con `latLngToContainerPoint` y se le suma la
 * posición del contenedor del mapa en pantalla.
 */
export function ConectorSeleccion({ mapaRef, tituloRef, provinciasGeo, vista, clave, activo }: Props) {
  const lineaRef = useRef<SVGPathElement>(null);
  const [d, setD] = useState<string | null>(null);

  useLayoutEffect(() => {
    setD(null);
    if (!activo || vista.nivel !== 'provincia') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const feature = provinciasGeo?.features.find((f) => f.properties.cod === vista.provincia);
    if (!feature) return;

    const temporizador = window.setTimeout(() => {
      const map = mapaRef.current;
      const cabecera = tituloRef.current;
      if (!map || !cabecera) return;

      const cajaMapa = map.getContainer().getBoundingClientRect();
      const [lon, lat] = feature.properties.ancla;
      const punto = map.latLngToContainerPoint([lat, lon]);
      const origen = { x: cajaMapa.left + punto.x, y: cajaMapa.top + punto.y };

      const cajaCabecera = cabecera.getBoundingClientRect();
      const destino = { x: cajaCabecera.left, y: cajaCabecera.top + cajaCabecera.height / 2 };

      // Curva y no línea recta: una recta cruzando el mapa entero compite
      // demasiado con la propia coropleta.
      const medioX = (origen.x + destino.x) / 2;
      setD(
        `M ${origen.x} ${origen.y} C ${medioX} ${origen.y}, ${medioX} ${destino.y}, ${destino.x} ${destino.y}`,
      );
    }, RETARDO_TRAS_VUELO);

    return () => window.clearTimeout(temporizador);
  }, [activo, vista, provinciasGeo, clave, mapaRef, tituloRef]);

  useLayoutEffect(() => {
    if (!d || !lineaRef.current) return;
    gsap.set(lineaRef.current, { drawSVG: '0%' });
    const animacion = gsap.to(lineaRef.current, {
      drawSVG: '100%',
      duration: 0.6,
      ease: 'power2.inOut',
    });
    return () => {
      animacion.kill();
    };
  }, [d]);

  if (!d) return null;

  return (
    <svg aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1100] h-full w-full">
      <path
        ref={lineaRef}
        d={d}
        fill="none"
        stroke="var(--color-atencion)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="1 5"
      />
    </svg>
  );
}
