// Extensión explícita: en un filesystem que no distingue mayúsculas
// (Windows), './Odometro' colisiona con './odometro.ts' y resuelve al
// módulo equivocado.
import { Odometro } from '../../animation/Odometro.tsx';
import { MapLegend } from '../map/MapLegend';
import type { Hoja } from '../../hooks/useBottomSheet';
import type { Orden } from '../../hooks/useFilteredCompanies';
import type { Vista } from '../../hooks/useMapNavigation';
import type { Empresa } from '../../types/company';
import type { CortesCoropleta } from '../../utils/choroplethScale';
import { etiquetaFiltro, type Conteo, type FiltroVehiculos } from '../../utils/dataGrouping';
import { CITA_CORTA } from '../../utils/fuente';
import { Breadcrumb, type Segmento } from './Breadcrumb';
import { CompanyPanel } from './CompanyPanel';
import { GlobalSearchResults } from './GlobalSearchResults';
import { RegionList, type FilaRegion } from './RegionList';
import { SearchBox } from './SearchBox';
import { SheetHandle } from './SheetHandle';

/** El asa lo referencia con `aria-controls`. */
const ID_PANEL = 'panel-consulta';

const nf = new Intl.NumberFormat('es-ES');

interface Props {
  vista: Vista;
  segmentos: Segmento[];
  /** Nombre de la región activa, o "España" en la vista nacional. */
  titulo: string;
  /** Recuento de la región activa: empresas dentro del filtro y sus vehículos. */
  conteo: Conteo | null;
  /** Rango de vehículos vigente: global, colorea el mapa y llena los listados. */
  filtro: FiltroVehiculos;
  /** Comunidades navegables a nivel nacional. */
  regiones: FilaRegion[];
  empresas: Empresa[];
  orden: Orden;
  /** Escala de la coropleta: en móvil la leyenda vive en el asomo de la hoja. */
  cortes: CortesCoropleta;
  ambitoCoropleta: string;
  datosListos: boolean;
  hoja: Hoja;
  /** Búsqueda global (toda España): visible en los niveles nacional y comunidad. */
  consultaGlobal: string;
  resultadosGlobales: Empresa[];
  buscandoGlobal: boolean;
  nombresProvincia: ReadonlyMap<string, string>;
  /** Empresa elegida en la búsqueda global, si es de la provincia abierta: va fijada arriba. */
  empresaElegida: Empresa | null;
  /** Solo en vista de comunidad: desglose por provincia para acotar sin navegar. */
  facetsProvincia: FilaRegion[];
  provinciaFacet: string | null;
  onCambiarConsultaGlobal: (consulta: string) => void;
  onElegirResultado: (empresa: Empresa) => void;
  onCambiarOrden: (orden: Orden) => void;
  onCambiarFiltro: (filtro: FiltroVehiculos) => void;
  onCambiarFacet: (cod: string | null) => void;
  /** Solo se usa a nivel nacional: elegir una comunidad de la lista. */
  onSeleccionarRegion: (cod: string) => void;
}

/**
 * Panel de consulta. Dos formas según el ancho, la misma información:
 *
 * - **Escritorio (≥1024 px):** columna fija a la derecha del mapa.
 * - **Tablet y móvil:** hoja inferior sobre el mapa a pantalla completa, con un
 *   asomo siempre visible (dónde estoy, cuántas hay, escala del color) y el
 *   contenido debajo del borde de la pantalla hasta que se despliega.
 *
 * En la forma de hoja el elemento es `fixed` con alto propio y se mueve con
 * `transform`. No es un detalle de estilo: como ítem flex, el panel ya se quedó
 * una vez sin altura que medir y se desbordó sobre el pie. Aquí no depende del
 * layout de nadie.
 */
export function Sidebar({
  vista,
  segmentos,
  titulo,
  conteo,
  filtro,
  regiones,
  empresas,
  orden,
  cortes,
  ambitoCoropleta,
  datosListos,
  hoja,
  consultaGlobal,
  resultadosGlobales,
  buscandoGlobal,
  nombresProvincia,
  empresaElegida,
  facetsProvincia,
  provinciaFacet,
  onCambiarConsultaGlobal,
  onElegirResultado,
  onCambiarOrden,
  onCambiarFiltro,
  onCambiarFacet,
  onSeleccionarRegion,
}: Props) {
  const recogida = hoja.esHoja && !hoja.desplegada;

  return (
    <aside
      ref={hoja.refHoja}
      id={ID_PANEL}
      aria-label="Panel de consulta"
      style={hoja.esHoja ? { transform: `translateY(${hoja.desplazamiento}px)` } : undefined}
      className={[
        // `h-dvh`: desplegada ocupa la pantalla entera, sin dejar una franja
        // de mapa asomando arriba. Recogida sigue enseñando solo el asomo — el
        // desplazamiento se calcula con el alto real, sea cual sea.
        'fixed inset-x-0 bottom-0 z-[1200] flex h-dvh min-h-0 w-full min-w-0 flex-col',
        // La hoja se presenta como una lámina: esquinas superiores redondeadas
        // y sombra difusa del tema (var, no rgba fija: cambia con él).
        'rounded-t-2xl border-t border-ink/10 bg-base shadow-[var(--shadow-mano)]',
        // Con el dedo encima no puede haber transición: la hoja sigue al pulgar.
        hoja.arrastrando ? '' : 'transition-transform duration-[var(--animate-duration-panel)] ease-out',
        'lg:static lg:z-auto lg:h-auto lg:w-[34%] lg:min-w-[320px] lg:max-w-[420px] lg:shrink-0',
        'lg:rounded-none lg:border-l lg:border-t-0 lg:border-ink/10 lg:shadow-none lg:transition-none',
      ].join(' ')}
    >
      {/* --- Asomo: lo único visible con la hoja recogida ------------------ */}
      {/* Lavado de acento de arriba abajo: la cabecera del panel tiene color
          propio sin robarle protagonismo al dato. */}
      <div
        ref={hoja.refAsomo}
        className="shrink-0 rounded-t-2xl bg-linear-to-b from-atencion/10 to-transparent lg:rounded-none"
      >
        <SheetHandle hoja={hoja} controla={ID_PANEL} />

        <div className="px-4 pb-2.5 lg:pt-3">
          <Breadcrumb segmentos={segmentos} />

          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h2 className="truncate text-heading font-semibold leading-tight tracking-tight">
              {titulo}
            </h2>
            <p
              className="shrink-0 font-mono text-body-sm tabular-nums text-asfalto"
              aria-live="polite"
            >
              <Odometro valor={conteo === null ? null : conteo.cumplen} mecanica="columna" />
              <span className="ml-1.5 font-sans text-caption">
                {etiquetaFiltro(filtro) || 'empresas'}
              </span>
            </p>
          </div>
        </div>

        {/* La leyenda del pie, aquí: sigue estando justo debajo del mapa y a la
            vista sin desplegar nada, que es su único requisito. En una pantalla
            baja (móvil apaisado) se va: son 58 px de asomo que al mapa le hacen
            más falta que a la escala, y las cifras siguen sobre cada región. */}
        <div className="px-4 pb-3 lg:hidden [@media(max-height:560px)]:hidden">
          <MapLegend
            cortes={cortes}
            ambito={ambitoCoropleta}
            activa={datosListos}
            compacta
          />
        </div>
      </div>

      {/* --- Cuerpo: bajo el borde de la pantalla mientras está recogida ---- */}
      {/* `inert` mientras no se ve: si no, el tabulador se va a un listado que
          está fuera de pantalla y no hay forma de saber dónde ha ido el foco. */}
      <div inert={recogida} className="flex min-h-0 flex-1 flex-col">
        {/* El otro total del ámbito: los vehículos que suman las empresas del
            filtro. Es el dato que el registro aporta y la cifra de empresas no
            cuenta — 80 empresas pueden ser 200 camiones o 2.000. */}
        <div className="shrink-0 border-b border-ink/10 px-4 pb-3 text-caption text-asfalto">
          <p className="flex items-baseline justify-between gap-3">
            <span className="uppercase tracking-[0.08em]">Vehículos autorizados</span>
            <span className="font-mono text-body-sm font-medium tabular-nums text-ink">
              {conteo === null ? '—' : nf.format(conteo.vehiculos)}
            </span>
          </p>
          {/* Cita obligada de la fuente y de la fecha de los datos (Ley 37/2007). */}
          <p className="mt-1 text-[0.6875rem] leading-snug text-asfalto/80">{CITA_CORTA}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {vista.nivel === 'provincia' || vista.nivel === 'ccaa' ? (
            // `key`: al cambiar de ámbito se remonta y el buscador se vacía. Al cambiar solo el facet de provincia dentro de la misma
            // comunidad NO se remonta (misma key): así no se pierde lo tecleado.
            <CompanyPanel
              key={vista.nivel === 'provincia' ? `p:${vista.provincia}` : `c:${vista.ccaa}`}
              empresas={empresas}
              filtro={filtro}
              orden={orden}
              onCambiarOrden={onCambiarOrden}
              onCambiarFiltro={onCambiarFiltro}
              empresaElegida={empresaElegida}
              facetsProvincia={vista.nivel === 'ccaa' ? facetsProvincia : undefined}
              provinciaFacet={vista.nivel === 'ccaa' ? provinciaFacet : undefined}
              onCambiarFacet={vista.nivel === 'ccaa' ? onCambiarFacet : undefined}
            />
          ) : (
            // Sin búsqueda, el buscador sube con la lista de comunidades al
            // hacer scroll (un solo contenedor con scroll). Buscando, se queda
            // fijo sobre los resultados: es con lo que se está trabajando. Es
            // el mismo `div` en los dos casos —solo cambia la clase— para que
            // el buscador no se remonte y pierda el foco al teclear.
            <div
              className={
                buscandoGlobal
                  ? 'flex min-h-0 flex-1 flex-col'
                  : 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
              }
            >
              <SearchBox
                consulta={consultaGlobal}
                onCambiar={onCambiarConsultaGlobal}
                placeholder="Buscar empresa en toda España…"
                etiqueta="Buscar empresa en toda España por razón social, número de autorización, localidad o provincia"
              />

              {buscandoGlobal ? (
                <GlobalSearchResults
                  resultados={resultadosGlobales}
                  nombresProvincia={nombresProvincia}
                  consulta={consultaGlobal}
                  hayFiltro={etiquetaFiltro(filtro) !== ''}
                  onElegir={onElegirResultado}
                />
              ) : (
                <>
                  <p className="px-4 py-2.5 text-caption text-asfalto">
                    Elige una comunidad en el mapa o en la lista.
                  </p>
                  <RegionList regiones={regiones} onSeleccionar={onSeleccionarRegion} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
