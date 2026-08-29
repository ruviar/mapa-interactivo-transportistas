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

/**
 * Debe llamarse con el CSS ya aplicado (en render), nunca en el módulo.
 *
 * Sin caché de módulo a propósito: las sombras cambian con el tema de la
 * herramienta (`html.tema-app`, ver theme.css) y una caché serviría las de la
 * landing dentro de la herramienta o al revés. `useSombras` ya memoiza por
 * montaje, y el salto landing↔herramienta remonta todo el árbol.
 */
export function leerSombras(): Sombras {
  const estilo = getComputedStyle(document.documentElement);
  return {
    apoyo: estilo.getPropertyValue('--shadow-apoyo').trim(),
    alta: estilo.getPropertyValue('--shadow-alta').trim(),
    mano: estilo.getPropertyValue('--shadow-mano').trim(),
  };
}

export function useSombras(): Sombras {
  return useMemo(leerSombras, []);
}
