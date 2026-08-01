import { useCallback, useSyncExternalStore } from 'react';

/**
 * Media query como estado de React.
 *
 * Hace falta porque el patrón de hoja inferior no es solo CSS: el mapa reserva
 * hueco al encuadrar y la hoja lleva `transform` en línea, y ninguna de las dos
 * cosas puede depender de una clase `lg:`. En servidor no hay ventana, así que
 * el valor de arranque es `false` (escritorio) y se corrige en la hidratación.
 */
export function useMediaQuery(consulta: string): boolean {
  const suscribir = useCallback(
    (avisar: () => void) => {
      const mql = window.matchMedia(consulta);
      mql.addEventListener('change', avisar);
      return () => mql.removeEventListener('change', avisar);
    },
    [consulta],
  );

  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}
