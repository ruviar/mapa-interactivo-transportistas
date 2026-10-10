/**
 * Búsqueda de empresas sobre toda España, no solo la provincia abierta.
 *
 * El dataset viene agrupado por provincia y sin índice plano, así que aquí se
 * aplana una vez y se precalcula el pajar normalizado de cada empresa: con
 * ~27.000 filas, normalizar en cada tecleo se nota; contra el índice ya
 * normalizado la pasada es un `includes` por término y va sobrada.
 *
 * El índice incluye el nombre de la provincia además de la localidad:
 * "frigorificos huesca" tiene que encontrar a la de Monzón aunque su localidad
 * no diga "Huesca". Y va ordenado alfabéticamente al construirse, para que la
 * pasada de filtrado no tenga que ordenar miles de coincidencias por tecleo.
 */

import type { Dataset, Empresa } from '../types/company';
// Extensión explícita: este módulo lo importan los tests de `node --test`,
// que no resuelven sin ella (mismo criterio que en `animation/`).
import { normalizar, terminosDe } from './busqueda.ts';

export interface IndiceGlobal {
  /** Todas las del registro, ordenadas alfabéticamente por nombre. */
  empresas: Empresa[];
  /** Pajar normalizado de cada empresa, alineado por índice con `empresas`. */
  pajares: string[];
}

/**
 * Entran todas las empresas del registro, sin el filtro de vehículos: quien
 * teclea un nombre o una autorización quiere encontrar esa empresa, no que un
 * filtro pensado para el mapa se la esconda.
 */
export function crearIndiceGlobal(
  dataset: Dataset,
  nombreProvincia: ReadonlyMap<string, string>,
): IndiceGlobal {
  const empresas = Object.values(dataset.empresas).flat();

  const colador = new Intl.Collator('es');
  empresas.sort((a, b) => colador.compare(a.nombre, b.nombre));

  const pajares = empresas.map((e) =>
    normalizar(
      `${e.nombre} ${e.autorizacion} ${e.localidad ?? ''} ${e.cp ?? ''} ${nombreProvincia.get(e.provincia) ?? ''}`,
    ),
  );

  return { empresas, pajares };
}

/**
 * Índice por dataset, construido una vez y cacheado. `App` lo precalienta en
 * un rato ocioso tras cargar el dataset (`requestIdleCallback`): recorrer y
 * normalizar 27k filas cuesta cientos de milisegundos y no debe pagarse en el
 * render del primer tecleo.
 */
const CACHE = new WeakMap<Dataset, IndiceGlobal>();

export function indiceDe(
  dataset: Dataset,
  nombreProvincia: ReadonlyMap<string, string>,
): IndiceGlobal {
  let indice = CACHE.get(dataset);
  if (!indice) {
    indice = crearIndiceGlobal(dataset, nombreProvincia);
    CACHE.set(dataset, indice);
  }
  return indice;
}

/** Todos los términos tienen que aparecer, como en `filtrarPorTexto`. */
export function buscarEnIndice(indice: IndiceGlobal, consulta: string): Empresa[] {
  const terminos = terminosDe(consulta);
  if (terminos.length === 0) return [];

  const resultados: Empresa[] = [];
  for (let i = 0; i < indice.empresas.length; i++) {
    const pajar = indice.pajares[i]!;
    if (terminos.every((t) => pajar.includes(t))) resultados.push(indice.empresas[i]!);
  }
  return resultados;
}
