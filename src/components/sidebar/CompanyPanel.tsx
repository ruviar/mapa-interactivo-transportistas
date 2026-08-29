import { ChevronDown } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';

import { PASOS_UMBRAL } from '../layout/EmployeeThresholdSlider';
import type { Orden } from '../../hooks/useFilteredCompanies';
import type { Empresa } from '../../types/company';
import { filtrarPorTexto, terminosDe } from '../../utils/busqueda';
import { cumpleUmbral } from '../../utils/dataGrouping';
import { CompanyList } from './CompanyList';
import { CompanyListHeader } from './CompanyListHeader';
import { CompanyRow } from './CompanyRow';
import type { FilaRegion } from './RegionList';
import { SearchBox } from './SearchBox';

const nf = new Intl.NumberFormat('es-ES');

/**
 * Mismas paradas no lineales que el umbral mínimo (`PASOS_UMBRAL`), más una
 * parada extra al final: "sin máximo". Reutilizar la escala es lo que hace
 * que el deslizable sirva de algo — el 94% de las empresas con dato tiene
 * menos de 10 empleados, y un recorrido lineal 0-100000 dejaría todo el rango
 * útil apretado en el primer milímetro de la pista.
 */
const INDICE_SIN_MAXIMO = PASOS_UMBRAL.length;

function indiceDeMaximo(maximo: number | null): number {
  if (maximo === null) return INDICE_SIN_MAXIMO;
  let mejor = 0;
  for (let i = 1; i < PASOS_UMBRAL.length; i++) {
    if (Math.abs(PASOS_UMBRAL[i]! - maximo) < Math.abs(PASOS_UMBRAL[mejor]! - maximo)) mejor = i;
  }
  return mejor;
}

interface Props {
  /** Empresas del ámbito (provincia o comunidad) que ya cumplen los filtros, ya ordenadas. */
  empresas: Empresa[];
  umbral: number;
  umbralMax: number | null;
  incluirSinDato: boolean;
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
  onCambiarUmbralMax: (umbralMax: number | null) => void;
  onCambiarIncluirSinDato: (incluir: boolean) => void;
  /**
   * Empresa elegida en la búsqueda global: va fijada encima del listado, pase
   * o no el filtro vigente. La mayoría de las activas no tiene dato de tamaño
   * y no aparece en el listado filtrado; esconder justo la empresa que el
   * usuario acaba de pulsar desmentiría al buscador. Si no entra en el
   * filtro, una nota dice por qué.
   */
  empresaElegida?: Empresa | null;
  /**
   * Solo en vista de comunidad: desglose por provincia para acotar el listado
   * sin navegar (el mapa se queda en el zoom de la comunidad). `null` en
   * `provinciaFacet` es "todas".
   */
  facetsProvincia?: FilaRegion[];
  provinciaFacet?: string | null;
  onCambiarFacet?: (cod: string | null) => void;
}

/**
 * Listado de un ámbito (provincia o comunidad) con su buscador, filtros y
 * orden.
 *
 * La consulta y el desplegable de filtros viven aquí y no en `App` porque
 * `Sidebar` monta este componente con `key` = ámbito: al cambiar de provincia
 * o de comunidad se remonta y todo arranca limpio. Arrastrar el texto o los
 * filtros del ámbito anterior solo produce listados vacíos que no se explican
 * solos.
 */
export function CompanyPanel({
  empresas,
  umbral,
  umbralMax,
  incluirSinDato,
  orden,
  onCambiarOrden,
  onCambiarUmbralMax,
  onCambiarIncluirSinDato,
  empresaElegida = null,
  facetsProvincia,
  provinciaFacet = null,
  onCambiarFacet,
}: Props) {
  const [consulta, setConsulta] = useState('');
  // El filtrado va contra el valor diferido: teclear nunca espera al listado.
  const diferida = useDeferredValue(consulta);
  const buscando = terminosDe(diferida).length > 0;

  const visibles = useMemo(() => filtrarPorTexto(empresas, diferida), [empresas, diferida]);

  // Mismos objetos que en el dataset: la igualdad por referencia vale.
  const elegidaEnListado = empresaElegida !== null && empresas.includes(empresaElegida);
  const motivoFueraDelFiltro =
    empresaElegida === null || elegidaEnListado
      ? null
      : empresaElegida.flota.valor === null || !empresaElegida.flota.vigente
        ? 'No entra en el listado: sin dato de tamaño vigente.'
        : !cumpleUmbral(empresaElegida, umbral)
          ? `No entra en el listado: por debajo del umbral (≥ ${umbral} empl.).`
          : 'No entra en el listado: fuera del filtro de fuente o del rango de tamaño.';

  // Cerrado por defecto: en la hoja móvil (82dvh) cada fila de cabecera
  // fija le resta espacio real al listado — con el buscador, los chips, los
  // filtros y el orden siempre abiertos a la vez, dos filas de empresas son
  // literalmente todo lo que quedaba. Aquí solo el buscador y los chips (la
  // vía para "ver por comunidad") se quedan siempre a la vista; el resto es
  // un solo desplegable.
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const hayFiltroActivo = umbralMax !== null || incluirSinDato;
  const idMax = useId();
  const idSinDato = useId();

  return (
    <>
      <SearchBox consulta={consulta} onCambiar={setConsulta} />

      {facetsProvincia && facetsProvincia.length > 1 && (
        <FacetsProvincia
          facets={facetsProvincia}
          activa={provinciaFacet}
          onElegir={onCambiarFacet}
        />
      )}

      {empresaElegida && (
        <div className="shrink-0 border-b border-atencion/50 bg-atencion/10">
          <p className="px-4 pt-2 text-caption uppercase tracking-[0.08em] text-asfalto">
            Resultado de la búsqueda en toda España
          </p>
          <CompanyRow empresa={empresaElegida} style={{ height: 56 }} />
          {motivoFueraDelFiltro && (
            <p className="px-4 pb-2 text-caption text-asfalto">{motivoFueraDelFiltro}</p>
          )}
        </div>
      )}

      <div className="shrink-0 border-b border-asfalto/40">
        <button
          type="button"
          onClick={() => setOpcionesAbiertas((v) => !v)}
          aria-expanded={opcionesAbiertas}
          className="flex w-full items-center justify-between gap-3 px-4 py-1.5 text-caption text-asfalto transition-colors duration-150 hover:text-ink"
        >
          <span>
            <span className="font-mono tabular-nums">{nf.format(visibles.length)}</span>
            {buscando && (
              <>
                {' '}
                de <span className="font-mono tabular-nums">{nf.format(empresas.length)}</span>
              </>
            )}{' '}
            {visibles.length === 1 ? 'empresa' : 'empresas'}
          </span>

          <span className="flex items-center gap-1 uppercase tracking-[0.08em]">
            Filtros y orden
            {hayFiltroActivo && <span className="size-1.5 rounded-full bg-atencion" aria-hidden="true" />}
            <ChevronDown
              aria-hidden="true"
              className={`size-3.5 transition-transform duration-150 ${opcionesAbiertas ? 'rotate-180' : ''}`}
              strokeWidth={1.75}
            />
          </span>
        </button>

        {opcionesAbiertas && (
          <div className="flex flex-col gap-2.5 px-4 pb-3">
            {/* Sin filas no hay nada que ordenar. */}
            {visibles.length > 0 && (
              <CompanyListHeader orden={orden} onCambiarOrden={onCambiarOrden} />
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-body-sm">
                <label htmlFor={idMax}>Máximo de tamaño</label>
                <span className="font-mono tabular-nums text-asfalto">
                  {umbralMax === null ? 'Sin máximo' : umbralMax}
                </span>
              </div>
              <input
                id={idMax}
                type="range"
                min={0}
                max={INDICE_SIN_MAXIMO}
                step={1}
                value={indiceDeMaximo(umbralMax)}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  onCambiarUmbralMax(i >= INDICE_SIN_MAXIMO ? null : PASOS_UMBRAL[i]!);
                }}
                aria-valuetext={umbralMax === null ? 'sin máximo' : `${umbralMax} como máximo`}
                className="w-full accent-atencion"
              />
            </div>

            <label htmlFor={idSinDato} className="flex items-center gap-2 text-body-sm">
              <input
                id={idSinDato}
                type="checkbox"
                checked={incluirSinDato}
                onChange={(e) => onCambiarIncluirSinDato(e.target.checked)}
                className="size-4 accent-atencion"
              />
              Incluir sin dato de tamaño vigente
            </label>
          </div>
        )}
      </div>

      <CompanyList
        empresas={visibles}
        mensajeVacio={
          empresas.length === 0
            ? incluirSinDato
              ? 'Ninguna empresa cumple los filtros en este ámbito.'
              : `Ninguna empresa cumple el filtro con dato vigente. Prueba a incluir las que no tienen dato de tamaño.`
            : `Sin resultados para «${diferida.trim()}».`
        }
      />
    </>
  );
}

/**
 * Desglose por provincia dentro de una comunidad, como chips: acota el
 * listado sin tocar el mapa (que se queda en el zoom de la comunidad). Es la
 * vía para "ver por comunidad sin bajar a una provincia" y, a la vez, para
 * acotar a una si hace falta — el mismo control cubre las dos preguntas.
 */
function FacetsProvincia({
  facets,
  activa,
  onElegir,
}: {
  facets: FilaRegion[];
  activa: string | null;
  onElegir?: (cod: string | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Acotar a una provincia"
      className="flex shrink-0 flex-wrap gap-1.5 border-b border-asfalto/40 px-4 py-2.5"
    >
      <Chip activo={activa === null} onClick={() => onElegir?.(null)}>
        Todas
      </Chip>
      {facets.map((f) => (
        <Chip key={f.cod} activo={activa === f.cod} onClick={() => onElegir?.(f.cod)}>
          {f.nombre} <span className="font-mono tabular-nums">{f.cumplen}</span>
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`border px-2.5 py-1 text-caption transition-colors duration-150 ${
        activo
          ? 'border-navy-800 bg-navy-800 text-base'
          : 'border-asfalto/50 text-ink hover:border-atencion'
      }`}
    >
      {children}
    </button>
  );
}
