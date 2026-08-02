import { useReducedMotion } from 'motion/react';

/**
 * ¿El sistema pide menos movimiento?
 *
 * Existe como función propia porque el bloque `@media (prefers-reduced-motion)`
 * de theme.css solo apaga transiciones y animaciones CSS: las animaciones que
 * Motion calcula en JS se le escapan por completo. Todo lo que anima esta fase
 * pasa por aquí o no está protegido.
 */
export function useMenosMovimiento(): boolean {
  return useReducedMotion() ?? false;
}
