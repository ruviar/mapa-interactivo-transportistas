/**
 * Búsqueda de empresas sobre toda España, no solo la provincia abierta.
 *
 * El dataset viene agrupado por provincia y sin índice plano, así que aquí se
 * aplana una vez y se precalcula el pajar normalizado de cada empresa: con
 * ~45.000 filas, normalizar en cada tecleo se nota; contra el índice ya
 * normalizado la pasada es un `includes` por término y va sobrada.
 *
 * El índice incluye el nombre de la provincia además de la localidad:
 * "frigorificos huesca" tiene que encontrar a la de Monzón aunque su localidad
 * no diga "Huesca". Y va ordenado alfabéticamente al construirse, para que la
 * pasada de filtrado no tenga que ordenar 40.000 coincidencias por tecleo.
 */

import type { Dataset, Empresa } from '../types/company';
// Extensión explícita: este módulo lo importan los tests de `node --test`,
// que no resuelven sin ella (mismo criterio que en `animation/`).
import { normalizar, terminosDe } from './busqueda.ts';

export interface IndiceGlobal {
  /** Solo activas, ordenadas alfabéticamente por nombre. */
  empresas: Empresa[];
  /** Pajar normalizado de cada empresa, alineado por índice con `empresas`. */
  pajares: string[];
}

/**
 * Solo empresas activas: el resto de la herramienta ya trabaja sobre ese
 * universo (ver `cumpleUmbral`) y un resultado extinguido en 2019 al que no se
 * puede llamar no responde a ninguna consulta real.
 */
export function crearIndiceGlobal(
  dataset: Dataset,
  nombreProvincia: ReadonlyMap<string, string>,
): IndiceGlobal {
  const activas: Empresa[] = [];
  for (const grupo of Object.values(dataset.empresas)) {
    for (const empresa of grupo) {
      if (empresa.estado === 'activa') activas.push(empresa);
    }
  }

  const colador = new Intl.Collator('es');
  activas.sort((a, b) => colador.compare(a.nombre, b.nombre));

  const pajares = activas.map((e) =>
    normalizar(
      `${e.nombre} ${e.nif} ${e.localidad ?? ''} ${nombreProvincia.get(e.provincia) ?? ''}`,
    ),
  );

  return { empresas: activas, pajares };
}

/**
 * Índice por dataset, construido una vez y cacheado. `App` lo precalienta en
 * un rato ocioso tras cargar el dataset (`requestIdleCallback`): recorrer y
 * normalizar 45k filas cuesta cientos de milisegundos y no debe pagarse en el
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
