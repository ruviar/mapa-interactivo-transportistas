/**
 * Búsqueda de texto sobre el listado ya filtrado por umbral.
 *
 * Se busca en nombre, NIF y localidad porque quien consulta esto llega de tres
 * maneras distintas: con el nombre a medias, con un NIF de una factura o
 * queriendo "los de Antequera". Un solo campo cubre los tres casos sin obligar
 * a elegir un criterio antes de escribir.
 */

import type { Empresa } from '../types/company';

/** Diacríticos combinantes que deja el NFD. Escapados: en el editor son invisibles. */
const TILDES = /[\u0300-\u036f]/g;

/** Minúsculas y sin tildes: "Peñíscola", "peniscola" y "PENISCOLA" casan igual. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(TILDES, '').toLowerCase();
}

export function terminosDe(consulta: string): string[] {
  return normalizar(consulta).split(/\s+/).filter(Boolean);
}

/**
 * Todos los términos tienen que aparecer, en cualquier campo y en cualquier
 * orden: "sese zaragoza" encuentra TRANS SESE SL de Zaragoza.
 */
export function filtrarPorTexto(empresas: Empresa[], consulta: string): Empresa[] {
  const terminos = terminosDe(consulta);
  if (terminos.length === 0) return empresas;

  return empresas.filter((e) => {
    const pajar = normalizar(`${e.nombre} ${e.nif} ${e.localidad ?? ''}`);
    return terminos.every((t) => pajar.includes(t));
  });
}
