import { useMemo } from 'react';

import type { CodProvincia, Dataset, Empresa } from '../types/company';
import { cumpleFiltro, type FiltroVehiculos } from '../utils/dataGrouping';
import { comparadorDe, type Orden } from '../utils/ordenacion';

/** Reexportado: los comparadores viven en `utils/ordenacion` para poder probarse sin React. */
export type { Orden };

/**
 * De mayor a menor flota por defecto: con el nº de vehículos real del
 * registro, el ranking es lo primero que se quiere ver. A igualdad de
 * vehículos desempata el alfabético (lo trae `comparadorDe` de serie).
 */
export const ORDEN_INICIAL: Orden = [{ criterio: 'vehiculos', sentido: 'desc' }];

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
 * `CompanyPanel` — el filtro de vehículos afecta al mapa entero y el texto
 * solo al listado.
 */
export function useFilteredCompanies(
  dataset: Dataset | null,
  ambito: AmbitoListado | null,
  filtro: FiltroVehiculos,
  orden: Orden,
): Empresa[] {
  return useMemo(() => {
    if (!dataset || !ambito) return [];

    const provincias = ambito.tipo === 'provincia' ? [ambito.provincia] : ambito.provincias;
    const empresas = provincias.flatMap((cod) => dataset.empresas[cod] ?? []);

    return empresas.filter((e) => cumpleFiltro(e, filtro)).sort(comparadorDe(orden));
  }, [dataset, ambito, filtro, orden]);
}
