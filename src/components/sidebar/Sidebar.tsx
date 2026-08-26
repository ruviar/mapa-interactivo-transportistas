import { CoverageChip } from '../layout/CoverageChip';
import { NotaDatos } from '../layout/NotaDatos';
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
import type { Conteo } from '../../utils/dataGrouping';
import { Breadcrumb, type Segmento } from './Breadcrumb';
import { CompanyPanel } from './CompanyPanel';
import { GlobalSearchResults } from './GlobalSearchResults';
import { RegionList, type FilaRegion } from './RegionList';
import { SearchBox } from './SearchBox';
import { SheetHandle } from './SheetHandle';

/** El asa lo referencia con `aria-controls`. */
const ID_PANEL = 'panel-consulta';

interface Props {
  vista: Vista;
  segmentos: Segmento[];
  /** Nombre de la región activa, o "España" en la vista nacional. */
  titulo: string;
  /** Recuento de la región activa: cumplen el filtro, con dato, activas y total. */
  conteo: Conteo | null;
  umbral: number;
  /** Regiones navegables del nivel actual (CCAA o provincias). */
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
  onCambiarConsultaGlobal: (consulta: string) => void;
  onElegirResultado: (empresa: Empresa) => void;
  onCambiarOrden: (orden: Orden) => void;
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
  umbral,
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
  onCambiarConsultaGlobal,
  onElegirResultado,
  onCambiarOrden,
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
        'fixed inset-x-0 bottom-0 z-[1200] flex h-[82dvh] min-h-0 w-full min-w-0 flex-col',
        'border-t border-asfalto bg-base shadow-[0_-2px_14px_-8px_rgba(27,33,29,0.55)]',
        // Con el dedo encima no puede haber transición: la hoja sigue al pulgar.
        hoja.arrastrando ? '' : 'transition-transform duration-[var(--animate-duration-panel)] ease-out',
        'lg:static lg:z-auto lg:h-auto lg:w-[34%] lg:min-w-[320px] lg:max-w-[420px] lg:shrink-0',
        'lg:border-l lg:border-t-0 lg:border-asfalto/40 lg:shadow-none lg:transition-none',
      ].join(' ')}
    >
      {/* --- Asomo: lo único visible con la hoja recogida ------------------ */}
      <div ref={hoja.refAsomo} className="shrink-0">
        <SheetHandle hoja={hoja} controla={ID_PANEL} />

        <div className="px-4 pb-2.5 lg:pt-3">
          <Breadcrumb segmentos={segmentos} />

          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h2 className="rotulo truncate text-heading leading-tight">
              {titulo}
            </h2>
            <p
              className="shrink-0 font-mono text-body-sm tabular-nums text-asfalto"
              aria-live="polite"
            >
              <Odometro valor={conteo === null ? null : conteo.cumplen} mecanica="columna" />
              <span className="ml-1.5 font-sans text-caption">
                {umbral === 0 ? 'con dato' : `≥ ${umbral} empl.`}
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
        <div className="shrink-0 border-b border-asfalto/40 px-4 pb-3">
          <CoverageChip conteo={conteo} ambito={titulo} />
          <NotaDatos className="mt-2.5 lg:hidden" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {vista.nivel === 'provincia' ? (
            // `key`: al cambiar de provincia se remonta y el buscador se vacía.
            <CompanyPanel
              key={vista.provincia}
              empresas={empresas}
              umbral={umbral}
              orden={orden}
              onCambiarOrden={onCambiarOrden}
              empresaElegida={empresaElegida}
            />
          ) : (
            <>
              <SearchBox
                consulta={consultaGlobal}
                onCambiar={onCambiarConsultaGlobal}
                placeholder="Buscar empresa en toda España…"
                etiqueta="Buscar empresa en toda España por nombre, NIF, localidad o provincia"
              />

              {buscandoGlobal ? (
                <GlobalSearchResults
                  resultados={resultadosGlobales}
                  nombresProvincia={nombresProvincia}
                  consulta={consultaGlobal}
                  onElegir={onElegirResultado}
                />
              ) : (
                <>
                  <p className="px-4 py-2.5 text-caption text-asfalto">
                    {vista.nivel === 'nacional'
                      ? 'Elige una comunidad en el mapa o en la lista.'
                      : 'Elige una provincia para ver sus empresas.'}
                  </p>
                  <RegionList regiones={regiones} onSeleccionar={onSeleccionarRegion} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
