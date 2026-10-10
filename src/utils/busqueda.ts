/**
 * Búsqueda de texto sobre el listado ya filtrado por vehículos.
 *
 * Se busca en razón social, nº de autorización, localidad y código postal
 * porque quien consulta esto llega de maneras distintas: con el nombre a
 * medias, con una autorización que cotejar o queriendo "los de Antequera". Un
 * solo campo cubre todos los casos sin obligar a elegir criterio antes de
 * escribir.
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
    const pajar = normalizar(`${e.nombre} ${e.autorizacion} ${e.localidad ?? ''} ${e.cp ?? ''}`);
    return terminos.every((t) => pajar.includes(t));
  });
}
