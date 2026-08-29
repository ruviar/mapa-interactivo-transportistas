import { SlidersHorizontal } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';

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

  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
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

      <div className="shrink-0 border-b border-asfalto/40">
        <button
          type="button"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
          className="flex w-full items-center gap-1.5 px-4 py-2 text-caption uppercase tracking-[0.08em] text-asfalto transition-colors duration-150 hover:text-ink"
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          Filtros avanzados
          {(umbralMax !== null || incluirSinDato) && (
            <span className="size-1.5 rounded-full bg-atencion" aria-hidden="true" />
          )}
        </button>

        {filtrosAbiertos && (
          <div className="flex flex-col gap-2.5 px-4 pb-3">
            <label htmlFor={idMax} className="flex items-center justify-between gap-3 text-body-sm">
              <span>Máximo de tamaño</span>
              <input
                id={idMax}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Sin máximo"
                value={umbralMax ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  onCambiarUmbralMax(v === '' ? null : Math.max(0, Number(v)));
                }}
                className="w-28 border border-asfalto/50 bg-base px-2 py-1 text-right font-mono text-body-sm tabular-nums placeholder:font-sans placeholder:text-caption"
              />
            </label>

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

      <p className="shrink-0 border-b border-asfalto/25 px-4 py-1.5 text-caption text-asfalto">
        <span className="font-mono tabular-nums">{nf.format(visibles.length)}</span>
        {buscando && (
          <>
            {' '}
            de <span className="font-mono tabular-nums">{nf.format(empresas.length)}</span>
          </>
        )}{' '}
        {visibles.length === 1 ? 'empresa' : 'empresas'}
      </p>

      {/* Sin filas no hay nada que ordenar: la cabecera sobre un mensaje de
          «sin resultados» solo añade ruido. */}
      {visibles.length > 0 && <CompanyListHeader orden={orden} onCambiarOrden={onCambiarOrden} />}

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
