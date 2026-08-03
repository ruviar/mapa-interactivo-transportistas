import { divIcon } from 'leaflet';
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';

import { useMenosMovimiento } from '../../animation/fisica';
import { CCAA_GEO } from '../../utils/cartografia';

/** Cuántas comunidades sugiere el halo, y cada cuánto se desfasan entre sí. */
const CANTIDAD = 3;
const DESFASE = 1.3;

/**
 * Pista de que el mapa es clicable, para quien llega por primera vez: un
 * halo ámbar que recorre unas pocas comunidades en bucle (vía `animation-delay`
 * negativo, sin JS por fotograma). Se apaga —y no vuelve a aparecer esa
 * sesión— en cuanto `App.tsx` registra el primer click real; `activo` llega
 * calculado desde allí.
 */
export function PistaInicial({ activo }: { activo: boolean }) {
  const quieto = useMenosMovimiento();
  const puntos = useMemo(() => CCAA_GEO.features.slice(0, CANTIDAD), []);

  if (!activo || quieto) return null;

  return (
    <>
      {puntos.map((feature, i) => (
        <Marker
          key={feature.properties.cod}
          position={[feature.properties.ancla[1], feature.properties.ancla[0]]}
          icon={iconoPista(i * DESFASE)}
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}

function iconoPista(retardo: number) {
  return divIcon({
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html:
      `<span class="pista-punto">` +
      `<span class="pista-halo" style="animation-delay:-${retardo}s"></span>` +
      `</span>`,
  });
}
