import { useMemo } from 'react';

import type { CodProvincia, Dataset, Empresa } from '../types/company';
import { cumpleFiltrosListado, type FiltrosListado } from '../utils/dataGrouping';
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
 * Qué provincias entran en el listado: una sola (vista de provincia) o todas
 * las de una comunidad a la vez (vista de comunidad, sin exigir bajar a una
 * provincia concreta).
 */
export type AmbitoListado =
  | { tipo: 'provincia'; provincia: CodProvincia }
  | { tipo: 'ccaa'; provincias: CodProvincia[] };

/**
 * Empresas del ámbito (una provincia o una comunidad entera) que cumplen los
 * filtros, en el orden pedido.
 *
 * La búsqueda por texto no entra aquí: se aplica después, sobre esta lista, en
 * `CompanyPanel` — los filtros afectan al mapa entero (los que también lo
 * hacen) y el texto solo al listado.
 */
export function useFilteredCompanies(
  dataset: Dataset | null,
  ambito: AmbitoListado | null,
  filtros: FiltrosListado,
  orden: Orden,
): Empresa[] {
  return useMemo(() => {
    if (!dataset || !ambito) return [];

    const provincias = ambito.tipo === 'provincia' ? [ambito.provincia] : ambito.provincias;
    const empresas = provincias.flatMap((cod) => dataset.empresas[cod] ?? []);

    return empresas.filter((e) => cumpleFiltrosListado(e, filtros)).sort(comparadorDe(orden));
  }, [dataset, ambito, filtros, orden]);
}
