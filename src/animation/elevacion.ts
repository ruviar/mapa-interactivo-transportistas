import { useMemo } from 'react';

/**
 * Las tres alturas de la fase, leídas de theme.css.
 *
 * Mismo motivo que `leerPaleta()`: los valores viven en el CSS y el JS los lee
 * ya resueltos, porque Motion necesita una cadena literal que interpolar y
 * `var(--x)` dentro de un box-shadow animado no se resuelve.
 */
export interface Sombras {
  apoyo: string;
  alta: string;
  mano: string;
}

let cache: Sombras | null = null;

/** Debe llamarse con el CSS ya aplicado (en render), nunca en el módulo. */
export function leerSombras(): Sombras {
  if (cache) return cache;
  const estilo = getComputedStyle(document.documentElement);
  cache = {
    apoyo: estilo.getPropertyValue('--shadow-apoyo').trim(),
    alta: estilo.getPropertyValue('--shadow-alta').trim(),
    mano: estilo.getPropertyValue('--shadow-mano').trim(),
  };
  return cache;
}

export function useSombras(): Sombras {
  return useMemo(leerSombras, []);
}
