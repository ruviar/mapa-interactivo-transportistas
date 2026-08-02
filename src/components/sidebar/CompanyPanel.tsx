import { useDeferredValue, useMemo, useState } from 'react';

import type { Orden } from '../../hooks/useFilteredCompanies';
import type { Empresa } from '../../types/company';
import { filtrarPorTexto, terminosDe } from '../../utils/busqueda';
import { CompanyList } from './CompanyList';
import { CompanyListHeader } from './CompanyListHeader';
import { SearchBox } from './SearchBox';

const nf = new Intl.NumberFormat('es-ES');

interface Props {
  /** Empresas de la provincia que ya cumplen el umbral, ya ordenadas. */
  empresas: Empresa[];
  umbral: number;
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
}

/**
 * Listado de una provincia con su buscador.
 *
 * La consulta vive aquí y no en `App` porque `Sidebar` monta este componente
 * con `key` = provincia: al cambiar de provincia se remonta y el buscador se
 * vacía solo. Arrastrar el texto de la provincia anterior solo produce
 * listados vacíos que no se explican solos.
 */
export function CompanyPanel({ empresas, umbral, orden, onCambiarOrden }: Props) {
  const [consulta, setConsulta] = useState('');
  // El filtrado va contra el valor diferido: teclear nunca espera al listado.
  const diferida = useDeferredValue(consulta);
  const buscando = terminosDe(diferida).length > 0;

  const visibles = useMemo(() => filtrarPorTexto(empresas, diferida), [empresas, diferida]);

  return (
    <>
      <SearchBox consulta={consulta} onCambiar={setConsulta} />

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
