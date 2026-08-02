import { divIcon } from 'leaflet';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { MapContainer, Marker, Rectangle, ZoomControl, useMap } from 'react-leaflet';

import type { Vista } from '../../hooks/useMapNavigation';
import type { ColeccionRegiones, FeatureRegion } from '../../types/geo';
import {
  CCAA_GEO,
  cajaDe,
  ensanchar,
  limitesDeCaja,
  limitesDe,
  type Limites,
} from '../../utils/cartografia';
import type { CortesCoropleta } from '../../utils/choroplethScale';
import { ChoroplethLayer } from './ChoroplethLayer';
import { LoadingSilhouette } from './LoadingSilhouette';
import { RelieveLayer } from './RelieveLayer';
import { RouteTraceOverlay } from './RouteTraceOverlay';

const LIMITES = limitesDe(CCAA_GEO);
/** Hasta dónde deja arrastrar: un margen y no medio Atlántico. */
const LIMITES_ARRASTRE = ensanchar(LIMITES, 2.5);
const MARGEN: [number, number] = [24, 24];

const [lonMin, latMin, lonMax, latMax] = CCAA_GEO.canarias.cartela;
const CARTELA: Limites = [
  [latMin, lonMin],
  [latMax, lonMax],
];

const NOTA_CARTELA = divIcon({
  className: '',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  html: '<span class="nota-cartela">Posición desplazada</span>',
});

interface Props {
  vista: Vista;
  clave: string;
  provinciasGeo: ColeccionRegiones | null;
  /** `código de región -> empresas que cumplen`. `null` mientras carga. */
  recuentosCCAA: Record<string, number> | null;
  recuentosProvincias: Record<string, number> | null;
  cortesCCAA: CortesCoropleta;
  cortesProvincias: CortesCoropleta;
  /** Mientras llega `companies.json` se traza la silueta del país. */
  cargando: boolean;
  onSeleccionarCCAA: (cod: string) => void;
  onSeleccionarProvincia: (cod: string) => void;
}

/**
 * Mapa base sin teselas: la coropleta es toda la información y un mapa de calles
 * debajo solo añadiría ruido (y una dependencia de un servidor de terceros).
 * El "mar" es el fondo del contenedor, en azul pálido de carta náutica.
 */
export function SpainMap({
  vista,
  clave,
  provinciasGeo,
  recuentosCCAA,
  recuentosProvincias,
  cortesCCAA,
  cortesProvincias,
  cargando,
  onSeleccionarCCAA,
  onSeleccionarProvincia,
}: Props) {
  const nacional = vista.nivel === 'nacional';

  /** Provincias de la comunidad activa. Nueva colección => `key` nueva en la capa. */
  const provinciasVisibles = useMemo(() => {
    if (nacional || !provinciasGeo) return null;
    return {
      ...provinciasGeo,
      features: provinciasGeo.features.filter((f) => f.properties.ccaa === vista.ccaa),
    };
  }, [nacional, provinciasGeo, vista]);

  const provinciaActiva: FeatureRegion | null = useMemo(() => {
    if (vista.nivel !== 'provincia') return null;
    return provinciasGeo?.features.find((f) => f.properties.cod === vista.provincia) ?? null;
  }, [provinciasGeo, vista]);

  const objetivo: Limites = useMemo(() => {
    if (provinciaActiva) return limitesDeCaja(cajaDe(provinciaActiva));
    if (vista.nivel !== 'nacional') {
      const region = CCAA_GEO.features.find((f) => f.properties.cod === vista.ccaa);
      if (region) return limitesDeCaja(cajaDe(region));
    }
    return LIMITES;
  }, [provinciaActiva, vista]);

  // El trazado de firma espera a que termine el vuelo.
  const [encuadrado, setEncuadrado] = useState<string | null>(null);
  // Estable dentro de una misma vista: si cambiara en cada render, `Encuadre`
  // reencuadraría el mapa continuamente y no se podría ni arrastrar.
  const alEncuadrar = useCallback(() => setEncuadrado(clave), [clave]);

  return (
    <MapContainer
      bounds={LIMITES}
      boundsOptions={{ padding: MARGEN }}
      maxBounds={LIMITES_ARRASTRE}
      maxBoundsViscosity={0.7}
      zoomSnap={0.25}
      zoomDelta={0.5}
      maxZoom={11}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <Encuadre clave={clave} limites={objetivo} onFin={alEncuadrar} />

      <RelieveLayer />

      <ChoroplethLayer
        regiones={CCAA_GEO}
        recuentos={recuentosCCAA}
        cortes={cortesCCAA}
        modo={nacional ? 'coropleta' : 'contexto'}
        {...(nacional ? { onSeleccionar: onSeleccionarCCAA } : {})}
      />

      {provinciasVisibles && (
        <ChoroplethLayer
          key={vista.nivel === 'nacional' ? '' : vista.ccaa}
          regiones={provinciasVisibles}
          recuentos={recuentosProvincias}
          cortes={cortesProvincias}
          modo="coropleta"
          onSeleccionar={onSeleccionarProvincia}
        />
      )}

      {provinciaActiva && encuadrado === clave && (
        <RouteTraceOverlay key={clave} feature={provinciaActiva} />
      )}

      <LoadingSilhouette cargando={cargando} />

      {/* Canarias está trasladada al Atlántico: la cartela deja claro que ese
          recuadro es un inset cartográfico y no su posición real. */}
      {nacional && (
        <>
          <Rectangle
            bounds={CARTELA}
            interactive={false}
            // `className` va como prop suelta a propósito: react-leaflet aplica
            // `pathOptions` con setStyle, que no toca la clase del <path> ya creado.
            className="cartela"
            pathOptions={{ fill: false, weight: 1, dashArray: '3 4' }}
          />
          <Marker
            position={[latMin, lonMin]}
            icon={NOTA_CARTELA}
            interactive={false}
            keyboard={false}
          />
        </>
      )}

      <ZoomControl position="bottomright" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
    </MapContainer>
  );
}

/**
 * Traduce el nivel de navegación a movimiento de mapa: vuelo de ~420 ms según
 * el sistema de diseño, salto instantáneo si el usuario pide menos movimiento.
 *
 * También vigila el tamaño del contenedor. Leaflet solo se entera de los
 * cambios de la ventana, y aquí la caja del mapa cambia sin que ella se mueva:
 * el asomo de la hoja se mide después del primer pintado y la cabecera se
 * reparte en dos o tres líneas según el ancho.
 */
function Encuadre({
  clave,
  limites,
  onFin,
}: {
  clave: string;
  limites: Limites;
  onFin: () => void;
}) {
  const map = useMap();
  const vistaAnterior = useRef<string | null>(null);
  const [medida, remedir] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const observador = new ResizeObserver(() => {
      // Sin `pan`: el reencuadre de abajo pone la vista donde toca y así no se
      // ven dos movimientos encadenados.
      map.invalidateSize({ animate: false, pan: false });
      remedir();
    });
    observador.observe(map.getContainer());
    return () => observador.disconnect();
  }, [map]);

  useEffect(() => {
    const cambiaVista = vistaAnterior.current !== clave;
    // En el primer render el encuadre ya lo puso `bounds` del MapContainer.
    const primera = vistaAnterior.current === null;
    vistaAnterior.current = clave;

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Sin cambio de vista solo ha cambiado el tamaño de la caja: se recoloca en
    // seco, porque el usuario no ha pedido ningún viaje.
    if (primera || quieto || !cambiaVista) {
      map.fitBounds(limites, { padding: MARGEN, animate: false });
      onFin();
      return;
    }

    map.flyToBounds(limites, { padding: MARGEN, duration: 0.42 });
    map.once('moveend', onFin);
    return () => {
      map.off('moveend', onFin);
    };
  }, [clave, limites, medida, map, onFin]);

  return null;
}
