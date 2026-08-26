import { useMemo } from 'react';

import type { CodProvincia, Dataset, Empresa } from '../types/company';
import { cumpleFlota, cumpleUmbral, type FiltroFlota } from '../utils/dataGrouping';
import { comparadorDe, type Orden } from '../utils/ordenacion';

/** Reexportado: los comparadores viven en `utils/ordenacion` para poder probarse sin React. */
export type { Orden };

/**
 * Alfabético por defecto, y no por tamaño.
 *
 * El tamaño que se muestra es casi siempre el proxy de empleados, y ese proxy
 * infla a los operadores logísticos grandes (GLS, DHL, XPO, CEVA): su plantilla
 * es sobre todo almacén y oficina, no conductores. Encabezar el listado con
 * ellos sugiere un ranking de flota que el dato no sostiene. Quien quiera ese
 * orden lo pide explícitamente en la cabecera de la columna.
 */
export const ORDEN_INICIAL: Orden = 'nombre';

/**
 * Empresas de una provincia que cumplen los filtros, en el orden pedido.
 *
 * La búsqueda por texto no entra aquí: se aplica después, sobre esta lista, en
 * `CompanyPanel` — el umbral y la fuente afectan al mapa entero y el texto
 * solo al listado.
 */
export function useFilteredCompanies(
  dataset: Dataset | null,
  provincia: CodProvincia | null,
  umbral: number,
  orden: Orden,
  filtroFlota: FiltroFlota = 'todas',
): Empresa[] {
  return useMemo(() => {
    if (!dataset || !provincia) return [];

    return (dataset.empresas[provincia] ?? [])
      .filter((e) => cumpleUmbral(e, umbral) && cumpleFlota(e, filtroFlota))
      .sort(comparadorDe(orden));
  }, [dataset, provincia, umbral, orden, filtroFlota]);
}
