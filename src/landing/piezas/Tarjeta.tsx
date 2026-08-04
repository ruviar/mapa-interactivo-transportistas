import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  /** Superficie navy-800 y borde claro en vez de crema — tarjetas sobre secciones oscuras (`PorQue`). */
  oscuro?: boolean;
}

/**
 * Tarjeta de la landing. A diferencia de `Accion` o `Pulsable`, aquí no hay
 * física: la tarjeta no se levanta, no gira y no se hunde. Es un bloque de
 * texto que se lee, no un control que se acciona, y darle el mismo gesto de
 * elevación equivalía a prometer un click que no existe —además de mover el
 * párrafo justo cuando el cursor llega a él.
 *
 * Al apuntarla se enciende en ámbar de neón (`.tarjeta` en `theme.css`, filete
 * más halo). Como todo el efecto es color y luz, no hace falta la rama de
 * `useMenosMovimiento` que sí llevan las piezas con desplazamiento: no hay
 * nada que reducir.
 */
export function Tarjeta({ children, className = '', oscuro = false }: Props) {
  const superficie = oscuro ? 'border-base/15 bg-navy-800' : 'border-asfalto/25 bg-base';

  return <div className={`tarjeta border ${superficie} p-6 ${className}`}>{children}</div>;
}
