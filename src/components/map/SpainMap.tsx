import { divIcon, point } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AttributionControl,
  MapContainer,
  Marker,
  Pane,
  Rectangle,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvent,
} from 'react-leaflet';

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
import { leerPaleta, type CortesCoropleta } from '../../utils/choroplethScale';
import { ChoroplethLayer } from './ChoroplethLayer';
import { LoadingSilhouette } from './LoadingSilhouette';
import { PistaInicial } from './PistaInicial';
import { RouteTraceOverlay } from './RouteTraceOverlay';

const LIMITES = limitesDe(CCAA_GEO);
/** Hasta dónde deja arrastrar: un margen y no medio Atlántico. */
const LIMITES_ARRASTRE = ensanchar(LIMITES, 2.5);
const MARGEN: [number, number] = [24, 24];
/**
 * Cuánto tiene que salirse el zoom del encuadre natural del nivel actual
 * (ver `NavegacionPorZoom`) para que la navegación le siga el paso. Con
 * `zoomDelta={0.5}` son dos pulsaciones del botón +/-: ni un scroll suelto
 * navega solo, ni hace falta perseguir el borde exacto del encuadre.
 */
const UMBRAL_ZOOM = 1;

/**
 * Mapa base real bajo la coropleta, en dos capas. La versión anterior traía
 * `World_Terrain_Base`, que es un fondo *de apoyo*: relieve sí, pero el color
 * casi lavado, y Portugal, Francia o el Magreb quedaban en gris junto a una
 * España pintada por el dato. Aquí el territorio de fuera es el único que
 * puede decir de qué está hecho el suelo, así que le toca color de verdad.
 *
 * - `fisico` (`World_Physical_Map`) pone el color de un mapa físico de atlas:
 *   verdes en vegas y llanuras, ocres y marrones subiendo a las sierras,
 *   azules por profundidad en el mar. Es el que da la lectura.
 * - `relieve` (`World_Hillshade`) va encima en `multiply` (clase `.relieve`
 *   en theme.css) y solo aporta la sombra del terreno.
 *
 * Son dos y no una porque el servicio físico se acaba en el zoom 8 y la vista
 * de provincia llega a 9-11: sin la segunda capa, bajar a una provincia era
 * ampliar una tesela borrosa. Con el relieve —que sí tiene teselas hasta 13—
 * el color se estira, pero el dibujo del terreno sigue nítido y es él quien
 * sostiene el detalle.
 */
export const TESELAS = {
  fisico: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
    zoomMax: 8,
  },
  relieve: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    zoomMax: 13,
  },
  /**
   * Obligatoria: no hay mapa base sin decir de quién es. Se muestra en el
   * control de atribución compacto del propio mapa (abajo a la izquierda,
   * sin el prefijo "Leaflet"), junto a la de los límites GeoJSON.
   */
  atribucion: 'Mapa base: Esri',
} as const;

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
  /** Halo de primera visita (`PistaInicial`); `App.tsx` lo apaga al primer click. */
  pistaActiva: boolean;
  onSeleccionarCCAA: (cod: string) => void;
  onSeleccionarProvincia: (cod: string) => void;
  /** El zoom se sale del encuadre del nivel actual hacia fuera: retrocede uno. */
  onAlejarNivel: () => void;
  /**
   * Preview de la landing: sin controles, sin navegación por zoom, sin capas
   * interactivas y sin las animaciones de primera visita (silueta y pista),
   * que consumen su marca de `sessionStorage` y ya no saldrían en la
   * herramienta de verdad.
   */
  decorativo?: boolean;
}

/**
 * Mapa base físico (ver `TESELAS`) con la coropleta encima. El reparto es el
 * de una carta: dentro de España manda el dato —los colores de la leyenda— y
 * fuera manda el terreno, que es lo único que ese territorio tiene que contar.
 * Un mapa de calles debajo solo añadiría ruido.
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
  pistaActiva,
  onSeleccionarCCAA,
  onSeleccionarProvincia,
  onAlejarNivel,
  decorativo = false,
}: Props) {
  const nacional = vista.nivel === 'nacional';
  /** El azul de mar del tema, para tapar el relieve bajo la cartela canaria. */
  const colorMar = useMemo(() => leerPaleta().fondo, []);

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
      dragging={!decorativo}
      scrollWheelZoom={!decorativo}
      doubleClickZoom={!decorativo}
      touchZoom={!decorativo}
      boxZoom={!decorativo}
      keyboard={!decorativo}
      className="h-full w-full"
    >
      <Encuadre clave={clave} limites={objetivo} onFin={alEncuadrar} />

      {!decorativo && (
        <NavegacionPorZoom
          vista={vista}
          objetivo={objetivo}
          provinciasGeo={provinciasGeo}
          onSeleccionarCCAA={onSeleccionarCCAA}
          onSeleccionarProvincia={onSeleccionarProvincia}
          onAlejarNivel={onAlejarNivel}
        />
      )}

      <TileLayer
        url={TESELAS.fisico.url}
        attribution={`${CCAA_GEO.attribution} · ${TESELAS.atribucion}`}
        maxNativeZoom={TESELAS.fisico.zoomMax}
        zIndex={1}
      />
      {/* `zIndex` explícito y no orden de inserción: las dos capas van al mismo
          `tilePane` y el `multiply` de `.relieve` solo tiene sentido si el
          color queda debajo. */}
      <TileLayer
        url={TESELAS.relieve.url}
        maxNativeZoom={TESELAS.relieve.zoomMax}
        className="relieve"
        zIndex={2}
      />

      {/* Canarias viaja desplazada +5,2° lon / +7,7° lat para caber en el
          encuadre (ver `canarias.desplazamiento` en el GeoJSON). Sobre un mapa
          base real eso la dejaba flotando en océano abierto al oeste de
          Marruecos, que es sencillamente otro sitio. Este relleno tapa el
          relieve dentro de la cartela y devuelve al inset su lectura de panel
          aparte.

          Pane propio y no orden de inserción: los dos irían al mismo
          `overlayPane`, donde Leaflet reordena por su cuenta y el rectángulo
          acababa tapando las islas. Con un pane a z-index 350 queda fijado
          entre las teselas (200) y las superposiciones (400). */}
      {nacional && (
        <Pane name="mascara-inset" style={{ zIndex: 350 }}>
          <Rectangle
            bounds={CARTELA}
            interactive={false}
            pathOptions={{ fill: true, fillColor: colorMar, fillOpacity: 1, stroke: false }}
          />
        </Pane>
      )}

      <ChoroplethLayer
        regiones={CCAA_GEO}
        recuentos={recuentosCCAA}
        cortes={cortesCCAA}
        modo={nacional ? 'coropleta' : 'contexto'}
        {...(nacional && !decorativo ? { onSeleccionar: onSeleccionarCCAA } : {})}
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

      {!decorativo && <LoadingSilhouette cargando={cargando} />}

      {/* Solo a nivel nacional: es donde está el primer click posible. */}
      {nacional && !decorativo && <PistaInicial activo={pistaActiva} />}

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

      {!decorativo && (
        <ZoomControl position="bottomright" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
      )}

      {/* Compacto y en su esquina, sin el prefijo "Leaflet": las fuentes se
          citan sobre el propio mapa desde que la nota metodológica del pie
          desapareció. */}
      {!decorativo && <AttributionControl position="bottomleft" prefix={false} />}
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

    /**
     * `flyToBounds` traza una curva (Van Wijk) entre el zoom de salida y el de
     * llegada; su fórmula divide entre ese delta. Con `maxZoom={11}` puesto,
     * dos encuadres bien distintos (España entera y una comunidad pequeña)
     * pueden topar los dos en el mismo techo y llegar con el MISMO zoom —
     * delta cero, división por (casi) cero, y Leaflet revienta el mapa entero
     * con «Invalid LatLng (NaN, NaN)» sin que haya red de seguridad alrededor.
     * Sin cambio de escala no hay curva que volar: un `fitBounds` animado
     * (pan + zoom lineales, sin la fórmula de Van Wijk) hace el mismo salto.
     */
    const zoomActual = map.getZoom();
    const zoomObjetivo = map.getBoundsZoom(limites, false, point(MARGEN));

    if (Math.abs(zoomObjetivo - zoomActual) < 0.01) {
      map.fitBounds(limites, { padding: MARGEN, animate: true, duration: 0.42 });
    } else {
      map.flyToBounds(limites, { padding: MARGEN, duration: 0.42 });
    }
    map.once('moveend', onFin);
    return () => {
      map.off('moveend', onFin);
    };
  }, [clave, limites, medida, map, onFin]);

  return null;
}

/**
 * Sentido inverso de `Encuadre`: allí la vista manda al mapa, aquí el mapa
 * manda a la vista. `objetivo` es el mismo encuadre al que `Encuadre` acaba
 * de volar, así que su zoom natural (`getBoundsZoom`) es el punto de partida:
 * cuando el usuario se aleja de él con la rueda o los botones +/- más allá
 * de `UMBRAL_ZOOM`, la navegación le sigue el paso en vez de dejarle mirar un
 * hueco en blanco fuera del nivel que el resto de la interfaz (panel, título,
 * coropleta) sigue mostrando.
 *
 * No hace falta distinguir un zoom del usuario de uno programático: tras un
 * `flyToBounds`/`fitBounds` el mapa aterriza justo en ese zoom natural (o muy
 * cerca, según el redondeo de `zoomSnap`), así que el `zoomend` de llegada
 * nunca cruza el umbral por sí solo.
 */
function NavegacionPorZoom({
  vista,
  objetivo,
  provinciasGeo,
  onSeleccionarCCAA,
  onSeleccionarProvincia,
  onAlejarNivel,
}: {
  vista: Vista;
  objetivo: Limites;
  provinciasGeo: ColeccionRegiones | null;
  onSeleccionarCCAA: (cod: string) => void;
  onSeleccionarProvincia: (cod: string) => void;
  onAlejarNivel: () => void;
}) {
  const map = useMap();

  const alCambiarZoom = useCallback(() => {
    const zoomEncuadre = map.getBoundsZoom(objetivo, false, point(MARGEN));
    const diferencia = map.getZoom() - zoomEncuadre;

    if (diferencia > UMBRAL_ZOOM) {
      if (vista.nivel === 'nacional') {
        const cercana = masCercana(CCAA_GEO.features, map);
        if (cercana) onSeleccionarCCAA(cercana.properties.cod);
      } else if (vista.nivel === 'ccaa' && provinciasGeo) {
        const cercana = masCercana(provinciasGeo.features, map);
        if (cercana) onSeleccionarProvincia(cercana.properties.cod);
      }
      return;
    }

    if (diferencia < -UMBRAL_ZOOM && vista.nivel !== 'nacional') onAlejarNivel();
  }, [map, objetivo, vista, provinciasGeo, onSeleccionarCCAA, onSeleccionarProvincia, onAlejarNivel]);

  useMapEvent('zoomend', alCambiarZoom);
  return null;
}

/** La región cuya ancla —el mismo punto que usa su rótulo— cae más cerca del centro del mapa. */
function masCercana(features: FeatureRegion[], map: LeafletMap): FeatureRegion | null {
  const centro = map.getCenter();
  let mejor: FeatureRegion | null = null;
  let distanciaMinima = Infinity;

  for (const f of features) {
    const [lon, lat] = f.properties.ancla;
    const distancia = map.distance(centro, { lat, lng: lon });
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      mejor = f;
    }
  }

  return mejor;
}
