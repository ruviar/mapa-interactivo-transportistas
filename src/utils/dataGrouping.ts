/**
 * Filtro por tamaño de flota y recuento de empresas por región.
 *
 * El tamaño es el nº de vehículos adscritos a la autorización, tal como lo
 * publica el Ministerio: un dato del registro que tienen todas las empresas.
 * Por eso hay un solo filtro —un rango de vehículos— y manda en todas partes
 * a la vez: colorea la coropleta, llena los listados y mueve los contadores.
 */

import type { CodCCAA, CodProvincia, Dataset, Empresa, Regiones } from '../types/company';

/** Rango de vehículos, ambos extremos incluidos. */
export interface FiltroVehiculos {
  min: number;
  /** `null` = sin techo. */
  max: number | null;
}

/**
 * De arranque no se filtra nada: toda empresa del registro tiene al menos un
 * vehículo. Quien busque "a partir de 5 camiones" sube el mínimo.
 */
export const FILTRO_INICIAL: FiltroVehiculos = { min: 1, max: null };

/**
 * Paradas no lineales de los deslizables. La mitad de las empresas tiene 5
 * vehículos o menos y solo el 1% pasa de 97, así que un recorrido lineal
 * gastaría casi todo el deslizable en un tramo sin nadie: las paradas se
 * aprietan donde está la masa de datos y se abren en la cola (hasta los 2.803
 * de la flota más grande del registro).
 */
export const PASOS_VEHICULOS = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100, 200, 500, 1000];

export function cumpleFiltro(empresa: Empresa, filtro: FiltroVehiculos): boolean {
  return (
    empresa.vehiculos >= filtro.min && (filtro.max === null || empresa.vehiculos <= filtro.max)
  );
}

export function filtroActivo(filtro: FiltroVehiculos): boolean {
  return filtro.min > FILTRO_INICIAL.min || filtro.max !== null;
}

/** "≥ 5 veh.", "5–20 veh.", "≤ 20 veh."; cadena vacía si no hay filtro puesto. */
export function etiquetaFiltro(filtro: FiltroVehiculos): string {
  const conMinimo = filtro.min > FILTRO_INICIAL.min;
  if (filtro.max === null) return conMinimo ? `≥ ${filtro.min} veh.` : '';
  if (!conMinimo) return `≤ ${filtro.max} veh.`;
  return filtro.min === filtro.max ? `${filtro.min} veh.` : `${filtro.min}–${filtro.max} veh.`;
}

export interface Conteo {
  /** Empresas dentro del rango. Es lo que colorea la coropleta. */
  cumplen: number;
  /** Vehículos que suman esas empresas. */
  vehiculos: number;
  /** Todas las empresas de la región, sin filtrar. */
  total: number;
}

export interface Recuentos {
  provincias: Record<CodProvincia, Conteo>;
  ccaa: Record<CodCCAA, Conteo>;
  nacional: Conteo;
}

const vacio = (): Conteo => ({ cumplen: 0, vehiculos: 0, total: 0 });

/**
 * Un solo recorrido sobre las ~27.000 empresas. Las regiones sin ninguna
 * empresa arrancan en 0 y no en `undefined`: la coropleta necesita distinguir
 * "cero" de "sin dato" y son estados distintos en la leyenda.
 */
export function contar(dataset: Dataset, regiones: Regiones, filtro: FiltroVehiculos): Recuentos {
  const provincias: Record<CodProvincia, Conteo> = {};
  const ccaa: Record<CodCCAA, Conteo> = {};
  const nacional = vacio();
  for (const p of regiones.provincias) provincias[p.cod] = vacio();
  for (const c of regiones.ccaa) ccaa[c.cod] = vacio();

  for (const empresas of Object.values(dataset.empresas)) {
    for (const empresa of empresas) {
      const cumple = cumpleFiltro(empresa, filtro);

      for (const destino of [provincias[empresa.provincia], ccaa[empresa.ccaa], nacional]) {
        if (!destino) continue;
        destino.total++;
        if (cumple) {
          destino.cumplen++;
          destino.vehiculos += empresa.vehiculos;
        }
      }
    }
  }

  return { provincias, ccaa, nacional };
}

/** Proyección `código -> nº que cumple`, que es lo único que necesita el mapa. */
export function cumplenPorRegion(conteos: Record<string, Conteo>): Record<string, number> {
  return Object.fromEntries(Object.entries(conteos).map(([cod, c]) => [cod, c.cumplen]));
}
