/**
 * Ordenación multiclave del listado de empresas. Vive aquí, sin React, para
 * poder probarse con `node --test` igual que `busqueda.ts` o `dataGrouping.ts`.
 *
 * Un orden es una lista de claves (criterio + sentido): se compara por la
 * primera y, a igualdad, por las siguientes. Así "Localidad A→Z, luego Tamaño
 * mayor→menor" agrupa por pueblo con las grandes arriba de cada grupo — la
 * pregunta que un solo criterio no podía responder.
 */

import type { Empresa } from '../types/company';

export type CriterioOrden = 'nombre' | 'localidad' | 'tamano';
export type SentidoOrden = 'asc' | 'desc';

export interface ClaveOrden {
  criterio: CriterioOrden;
  sentido: SentidoOrden;
}

/** Primera clave manda; las siguientes solo desempatan. */
export type Orden = readonly ClaveOrden[];

/**
 * Sentido con el que arranca cada criterio al elegirse: el que responde a la
 * pregunta habitual — alfabético de la A, tamaño del más grande.
 */
export const SENTIDO_POR_DEFECTO: Record<CriterioOrden, SentidoOrden> = {
  nombre: 'asc',
  localidad: 'asc',
  tamano: 'desc',
};

const porNombre = (a: Empresa, b: Empresa) => a.nombre.localeCompare(b.nombre, 'es');

/**
 * Los huecos van al final en ambos sentidos: una empresa sin localidad o sin
 * dato de tamaño no es "menor que Almería" ni "más pequeña que 3", es un
 * hueco — invertir el sentido no debería subirla a lo alto del listado.
 */
function compararClave(a: Empresa, b: Empresa, { criterio, sentido }: ClaveOrden): number {
  const signo = sentido === 'asc' ? 1 : -1;

  switch (criterio) {
    case 'nombre':
      return signo * porNombre(a, b);
    case 'localidad': {
      if (!a.localidad && !b.localidad) return 0;
      if (!a.localidad) return 1;
      if (!b.localidad) return -1;
      return signo * a.localidad.localeCompare(b.localidad, 'es');
    }
    case 'tamano': {
      const va = a.flota.valor;
      const vb = b.flota.valor;
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return signo * (va - vb);
    }
  }
}

export function comparadorDe(orden: Orden): (a: Empresa, b: Empresa) => number {
  return (a, b) => {
    for (const clave of orden) {
      const resultado = compararClave(a, b, clave);
      if (resultado !== 0) return resultado;
    }
    // Desempate final siempre alfabético: el listado no debe bailar entre
    // repintados por empresas idénticas en todas las claves elegidas.
    return porNombre(a, b);
  };
}
