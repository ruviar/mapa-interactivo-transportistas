import { useMemo } from 'react';

import type { CodProvincia, Dataset, Empresa } from '../types/company';
import { cumpleUmbral } from '../utils/dataGrouping';

/** Criterio de ordenación del listado. Ver `ORDEN_INICIAL`. */
export type Orden = 'nombre' | 'tamano';

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

const porNombre = (a: Empresa, b: Empresa) => a.nombre.localeCompare(b.nombre, 'es');

/** A igual tamaño, alfabético: el listado no debe bailar entre repintados. */
const porTamano = (a: Empresa, b: Empresa) =>
  (b.flota.valor ?? 0) - (a.flota.valor ?? 0) || porNombre(a, b);

/**
 * Empresas de una provincia que cumplen el filtro, en el orden pedido.
 *
 * La búsqueda por texto no entra aquí: se aplica después, sobre esta lista, en
 * `CompanyPanel` — el umbral afecta al mapa entero y el texto solo al listado.
 */
export function useFilteredCompanies(
  dataset: Dataset | null,
  provincia: CodProvincia | null,
  umbral: number,
  orden: Orden,
): Empresa[] {
  return useMemo(() => {
    if (!dataset || !provincia) return [];

    return (dataset.empresas[provincia] ?? [])
      .filter((e) => cumpleUmbral(e, umbral))
      .sort(orden === 'tamano' ? porTamano : porNombre);
  }, [dataset, provincia, umbral, orden]);
}
