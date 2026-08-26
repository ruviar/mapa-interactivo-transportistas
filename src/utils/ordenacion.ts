/**
 * Comparadores del listado de empresas. Viven aquí, sin React, para poder
 * probarse con `node --test` igual que `busqueda.ts` o `dataGrouping.ts`.
 */

import type { Empresa } from '../types/company';

/**
 * Criterio de ordenación. Cada columna tiene un sentido por defecto —el que
 * responde a la pregunta habitual— y su inverso, que se pide volviendo a
 * pulsar la columna activa. Ver `ORDEN_INICIAL` en `useFilteredCompanies`.
 */
export type Orden =
  | 'nombre'
  | 'nombre-desc'
  | 'localidad'
  | 'localidad-desc'
  | 'tamano'
  | 'tamano-asc';

const porNombre = (a: Empresa, b: Empresa) => a.nombre.localeCompare(b.nombre, 'es');

/** A igual criterio, alfabético: el listado no debe bailar entre repintados. */
const porTamano = (a: Empresa, b: Empresa) =>
  (b.flota.valor ?? 0) - (a.flota.valor ?? 0) || porNombre(a, b);

/**
 * Las empresas sin localidad van al final en los dos sentidos: un hueco no es
 * "menor que Almería" ni "mayor que Zaragoza", es un hueco.
 */
const porLocalidad = (sentido: 1 | -1) => (a: Empresa, b: Empresa) => {
  if (!a.localidad && !b.localidad) return porNombre(a, b);
  if (!a.localidad) return 1;
  if (!b.localidad) return -1;
  return sentido * a.localidad.localeCompare(b.localidad, 'es') || porNombre(a, b);
};

const COMPARADORES: Record<Orden, (a: Empresa, b: Empresa) => number> = {
  nombre: porNombre,
  'nombre-desc': (a, b) => porNombre(b, a),
  localidad: porLocalidad(1),
  'localidad-desc': porLocalidad(-1),
  tamano: porTamano,
  'tamano-asc': (a, b) => (a.flota.valor ?? 0) - (b.flota.valor ?? 0) || porNombre(a, b),
};

export function comparadorDe(orden: Orden): (a: Empresa, b: Empresa) => number {
  return COMPARADORES[orden];
}
