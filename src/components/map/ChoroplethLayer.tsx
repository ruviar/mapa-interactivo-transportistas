import { divIcon } from 'leaflet';
import type { GeoJSON as CapaGeoJSON, LeafletMouseEvent, Path, PathOptions } from 'leaflet';
import type { Feature } from 'geojson';
import { Fragment, useEffect, useMemo, useReducer, useRef } from 'react';
import { CircleMarker, GeoJSON, Marker, useMap, useMapEvent } from 'react-leaflet';

import { gsap } from '../../animation/gsap';
import type { ColeccionRegiones, FeatureRegion, PropiedadesRegion } from '../../types/geo';
import { cajaDe } from '../../utils/cartografia';
import { leerPaleta, pasoDe, type CortesCoropleta, type PasoCoropleta } from '../../utils/choroplethScale';

const nf = new Intl.NumberFormat('es-ES');

/** Ancho aproximado en píxeles de un carácter del rótulo (9 px, versalitas). */
const PX_POR_CARACTER = 5.4;
/** Alto del rótulo de dos líneas (nombre + cifra) con algo de aire. */
const ALTO_ROTULO = 30;
/**
 * Mapa apretado: las regiones que no admiten rótulo dentro enseñan solo la
 * cifra. En un mapa de 390 px de ancho —o de 220 px de alto, que es lo que
 * queda en un móvil apaisado— media España es "micro" y los nombres colgando
 * al lado del punto se pisan unos a otros: Cantabria, País Vasco, Navarra y
 * La Rioja acababan en un mismo borrón. El nombre lo da el listado que hay
 * justo debajo; la cifra, que es el requisito de accesibilidad de la
 * coropleta, se queda siempre.
 */
const MAPA_APRETADO = { ancho: 520, alto: 420 };

/**
 * Opacidad del relleno sobre el mapa base (ver `TESELAS` en SpainMap.tsx). Es
 * el mando para repartir protagonismo entre el dato y el paisaje.
 *
 * Subió de 0.75 a 0.92 al cambiar el terreno lavado de `World_Terrain_Base`
 * por un mapa físico en color: a 0.75 el verde y el ocre de debajo ya no
 * matizaban el relleno, lo teñían, y el paso 2 de una región de montaña dejaba
 * de ser el mismo color que el paso 2 de la leyenda. Y una coropleta cuyo
 * color no se puede cotejar con su leyenda no es una coropleta.
 *
 * A 0.92 el reparto queda explícito: dentro de España se lee el dato, fuera se
 * lee el terreno. Queda el 8% justo para que el relieve module la superficie y
 * las regiones no se vean recortadas en cartulina.
 */
const OPACIDAD_COROPLETA = 0.92;

interface Props {
  regiones: ColeccionRegiones;
  /** Empresas que cumplen el filtro por código de región. `null` mientras carga. */
  recuentos: Record<string, number> | null;
  cortes: CortesCoropleta;
  /**
   * `contexto` = territorio que no se está explorando: se dibuja apagado y sin
   * cifras, solo para que la comunidad activa no flote en el vacío.
   */
  modo: 'coropleta' | 'contexto';
  onSeleccionar?: (cod: string) => void;
}

export function ChoroplethLayer({ regiones, recuentos, cortes, modo, onSeleccionar }: Props) {
  const paleta = useMemo(leerPaleta, []);
  const capa = useRef<CapaGeoJSON | null>(null);
  const map = useMap();

  // Si una región cabe o no su nombre depende del zoom y del tamaño de la caja,
  // no de su tamaño real. `resize` lo dispara el `invalidateSize` de SpainMap.
  const [, remedir] = useReducer((n: number) => n + 1, 0);
  useMapEvent('zoomend', remedir);
  useMapEvent('resize', remedir);

  const caja = map.getSize();
  const apretado = caja.x < MAPA_APRETADO.ancho || caja.y < MAPA_APRETADO.alto;

  const pasos = useMemo(() => {
    const porCodigo = new Map<string, PasoCoropleta>();
    for (const f of regiones.features) {
      const cod = f.properties.cod;
      porCodigo.set(cod, recuentos ? pasoDe(recuentos[cod] ?? 0, cortes) : 0);
    }
    return porCodigo;
  }, [regiones, recuentos, cortes]);

  const estiloDe = useMemo(() => {
    return (paso: PasoCoropleta): PathOptions =>
      modo === 'contexto'
        ? { className: 'region', fillColor: paleta.relleno[0], fillOpacity: 0.25, color: paleta.borde, weight: 0.5, opacity: 0.3 }
        : {
            className: 'region',
            fillColor: paleta.relleno[paso],
            // Casi opaca: el color tiene que ser cotejable con la leyenda, y el
            // resto lo deja pasar el relieve (ver `OPACIDAD_COROPLETA`).
            fillOpacity: OPACIDAD_COROPLETA,
            color: paleta.borde,
            weight: 0.5,
            opacity: 0.4,
          };
  }, [modo, paleta]);

  // `style` solo se evalúa al crear las capas; al cambiar el umbral o el nivel
  // hay que repintar a mano. La transición de 200 ms la pone `.region` en CSS.
  useEffect(() => {
    capa.current?.eachLayer((sub) => {
      const cod = codigoDe(sub);
      if (cod) (sub as Path).setStyle(estiloDe(pasos.get(cod) ?? 0));
    });
  }, [pasos, estiloDe]);

  // Aparición escalonada: solo la primera vez que esta instancia de capa se
  // monta (una capa de coropleta nueva nace al entrar en una comunidad, ver
  // el `key` en SpainMap.tsx), nunca al recolorear por cambio de umbral —eso
  // ya lo cubre la transición CSS de `.region`, no hace falta repetir el
  // efecto de entrada por cada arrastre del slider.
  useEffect(() => {
    if (modo !== 'coropleta' || !capa.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elementos: Element[] = [];
    capa.current.eachLayer((sub) => {
      const el = (sub as Path).getElement();
      if (el) elementos.push(el);
    });
    if (elementos.length === 0) return;

    gsap.set(elementos, { transformOrigin: '50% 50%' });
    // `fromTo` y no `from`: `from` toma como destino el valor que el elemento
    // tenga en ese momento. Si una pasada anterior quedó cortada a media
    // opacidad —lo que hace StrictMode al montar, limpiar y volver a montar—,
    // ese 0 se convertía en el destino y la región no volvía a aparecer nunca.
    // Con el destino escrito, la animación siempre acaba en visible.
    const animacion = gsap.fromTo(
      elementos,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
    );
    return () => {
      // Completar antes de soltar: un `kill()` a secas congela cada elemento
      // donde le pille el escalonado, y con 19 regiones a 0.05 s la mayoría ni
      // ha empezado. El mapa se quedaba medio en blanco.
      animacion.progress(1).kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const interactiva = modo === 'coropleta' && onSeleccionar !== undefined;

  return (
    <>
      <GeoJSON
        ref={capa}
        data={regiones}
        interactive={interactiva}
        bubblingMouseEvents={false}
        style={(feature?: Feature) => estiloDe(pasos.get(codigo(feature)) ?? 0)}
        eventHandlers={
          interactiva
            ? {
                click: (e: LeafletMouseEvent) => {
                  const cod = codigoDe(e.propagatedFrom);
                  if (cod) onSeleccionar(cod);
                },
                // Ámbar de atención al pasar por encima, según el sistema de diseño.
                mouseover: (e: LeafletMouseEvent) => {
                  const capaHija = e.propagatedFrom as Path;
                  capaHija.setStyle({ color: paleta.atencion, weight: 2.5, opacity: 1 });
                  capaHija.bringToFront();
                },
                mouseout: (e: LeafletMouseEvent) => {
                  const cod = codigoDe(e.propagatedFrom);
                  if (cod) (e.propagatedFrom as Path).setStyle(estiloDe(pasos.get(cod) ?? 0));
                },
              }
            : undefined
        }
      />

      {modo === 'coropleta' &&
        regiones.features.map((feature) => {
          const paso = pasos.get(feature.properties.cod) ?? 0;
          const micro = !cabeElNombre(feature, map);

          return (
            <Fragment key={feature.properties.cod}>
              {/* Ceuta y Melilla miden 4 px a escala nacional: sin un símbolo de
                  punto su cifra queda flotando en el estrecho sin referente. */}
              {micro && (
                <CircleMarker
                  center={[feature.properties.ancla[1], feature.properties.ancla[0]]}
                  radius={4}
                  interactive={false}
                  className="region"
                  pathOptions={{
                    fillColor: paleta.relleno[paso],
                    fillOpacity: 1,
                    color: paleta.borde,
                    weight: 0.8,
                    opacity: 0.5,
                  }}
                />
              )}
              <EtiquetaRegion
                propiedades={feature.properties}
                recuento={recuentos?.[feature.properties.cod] ?? null}
                micro={micro}
                conNombre={!micro || !apretado}
                // La etiqueta micro cae fuera de la región, sobre el fondo:
                // ahí el color de contraste del paso no aplica.
                color={micro ? paleta.borde : paleta.cifra[paso]}
                halo={micro ? paleta.fondo : paleta.relleno[paso]}
              />
            </Fragment>
          );
        })}
    </>
  );
}

function codigo(feature?: Feature): string {
  return (feature?.properties?.['cod'] as string) ?? '';
}

function codigoDe(capa: unknown): string | undefined {
  return (capa as { feature?: Feature } | undefined)?.feature?.properties?.['cod'] as
    | string
    | undefined;
}

/**
 * ¿Entra el rótulo dentro de la región al zoom actual? Se miran los dos ejes:
 * con solo el ancho, un mapa bajo (móvil apaisado) daba por buenas regiones de
 * 30 px de alto y los nombres acababan solapados unos sobre otros.
 */
function cabeElNombre(feature: FeatureRegion, map: ReturnType<typeof useMap>): boolean {
  const [lonMin, latMin, lonMax, latMax] = cajaDe(feature);
  const izquierda = map.latLngToContainerPoint([latMin, lonMin]).x;
  const derecha = map.latLngToContainerPoint([latMin, lonMax]).x;
  const abajo = map.latLngToContainerPoint([latMin, lonMin]).y;
  const arriba = map.latLngToContainerPoint([latMax, lonMin]).y;
  const rotulo = feature.properties.corto ?? feature.properties.nombre;

  return derecha - izquierda >= rotulo.length * PX_POR_CARACTER && abajo - arriba >= ALTO_ROTULO;
}

function EtiquetaRegion({
  propiedades,
  recuento,
  micro,
  conNombre,
  color,
  halo,
}: {
  propiedades: PropiedadesRegion;
  recuento: number | null;
  /** Región demasiado pequeña para rotularla dentro: se rotula al lado. */
  micro: boolean;
  /** En un mapa apretado las regiones micro van sin nombre para no pisarse. */
  conNombre: boolean;
  color: string;
  /**
   * Color del cerco del rótulo. Es el relleno de la propia región: donde el
   * nombre se sale al mar (Comunitat Valenciana, Cantabria) sigue leyéndose
   * porque arrastra consigo un halo del color sobre el que fue pensado.
   */
  halo: string;
}) {
  const { ancla, nombre } = propiedades;
  const rotulo = propiedades.corto ?? nombre;

  const icono = useMemo(
    () =>
      divIcon({
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `<span class="etiqueta-region${micro ? ' micro' : ''}" style="color:${color};--halo:${halo}">
            ${conNombre ? `<span class="nombre">${escapar(rotulo)}</span>` : ''}
            <span class="cifra">${recuento === null ? '·' : nf.format(recuento)}</span>
          </span>`,
      }),
    [rotulo, recuento, micro, conNombre, color, halo],
  );

  return (
    <Marker
      position={[ancla[1], ancla[0]]}
      icon={icono}
      interactive={false}
      keyboard={false}
      alt={`${nombre}: ${recuento === null ? 'sin calcular' : `${recuento} empresas`}`}
    />
  );
}

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
