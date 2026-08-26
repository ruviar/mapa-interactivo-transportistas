import { useDeferredValue, useMemo, useState } from 'react';

import type { Orden } from '../../hooks/useFilteredCompanies';
import type { Empresa } from '../../types/company';
import { filtrarPorTexto, terminosDe } from '../../utils/busqueda';
import { cumpleUmbral } from '../../utils/dataGrouping';
import { CompanyList } from './CompanyList';
import { CompanyListHeader } from './CompanyListHeader';
import { CompanyRow } from './CompanyRow';
import { SearchBox } from './SearchBox';

const nf = new Intl.NumberFormat('es-ES');

interface Props {
  /** Empresas de la provincia que ya cumplen el umbral, ya ordenadas. */
  empresas: Empresa[];
  umbral: number;
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
  /**
   * Empresa elegida en la búsqueda global: va fijada encima del listado, pase
   * o no el filtro vigente. La mayoría de las activas no tiene dato de tamaño
   * y no aparece en el listado filtrado; esconder justo la empresa que el
   * usuario acaba de pulsar desmentiría al buscador. Si no entra en el
   * filtro, una nota dice por qué.
   */
  empresaElegida?: Empresa | null;
}

/**
 * Listado de una provincia con su buscador.
 *
 * La consulta vive aquí y no en `App` porque `Sidebar` monta este componente
 * con `key` = provincia: al cambiar de provincia se remonta y el buscador se
 * vacía solo. Arrastrar el texto de la provincia anterior solo produce
 * listados vacíos que no se explican solos.
 */
export function CompanyPanel({
  empresas,
  umbral,
  orden,
  onCambiarOrden,
  empresaElegida = null,
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
          : 'No entra en el listado: fuera del filtro de fuente del dato.';

  return (
    <>
      <SearchBox consulta={consulta} onCambiar={setConsulta} />

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

      {buscando && visibles.length > 0 && (
        <p className="shrink-0 border-b border-asfalto/25 px-4 py-1.5 text-caption text-asfalto">
          <span className="font-mono tabular-nums">{nf.format(visibles.length)}</span> de{' '}
          <span className="font-mono tabular-nums">{nf.format(empresas.length)}</span> empresas
        </p>
      )}

      {/* Sin filas no hay nada que ordenar: la cabecera sobre un mensaje de
          «sin resultados» solo añade ruido. */}
      {visibles.length > 0 && <CompanyListHeader orden={orden} onCambiarOrden={onCambiarOrden} />}

      <CompanyList
        empresas={visibles}
        mensajeVacio={
          empresas.length === 0
            ? umbral === 0
              ? 'Ninguna empresa de esta provincia tiene un tamaño registrado y vigente.'
              : `Ninguna empresa de esta provincia llega a ${umbral} empleados con dato vigente.`
            : `Sin resultados para «${diferida.trim()}».`
        }
      />
    </>
  );
}
