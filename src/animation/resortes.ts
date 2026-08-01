/**
 * Constantes de resorte de la Fase 6.
 *
 * Es al movimiento lo que `@theme` de theme.css es al color: el único sitio
 * donde viven estos números. Un componente que escriba su propia rigidez rompe
 * la coherencia de la elevación, que es justo lo que la fase venía a arreglar.
 *
 * Módulo puro a propósito —sin React, sin Motion—: así lo puede ejecutar
 * `node --test` sin arrastrar el DOM.
 */
export interface Resorte {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
}

const resorte = (stiffness: number, damping: number, mass = 1): Resorte => ({
  type: 'spring',
  stiffness,
  damping,
  mass,
});

export const RESORTES = {
  /** Hundimiento y recuperación de controles: rápido, con un rebote corto. */
  pulsacion: resorte(420, 26),
  /** Hover y foco de filas, sombra del panel, asentamiento de la hoja. */
  elevacion: resorte(320, 30),
  /** Muelle que arrastra el valor del odómetro. */
  odometro: resorte(180, 26),
  /** Trazado de firma: lento, con peso y un rebote perceptible al cerrar. */
  trazado: resorte(90, 14, 1.2),
} satisfies Record<string, Resorte>;

export const RESORTE_PULSACION = RESORTES.pulsacion;
export const RESORTE_ELEVACION = RESORTES.elevacion;
export const RESORTE_ODOMETRO = RESORTES.odometro;
export const RESORTE_TRAZADO = RESORTES.trazado;

/** Cuánto se hunde un control al pulsarlo. */
export const ESCALA_PULSADA = 0.97;

/**
 * ζ = c / (2·√(k·m)). Por debajo de 1 el muelle rebota; por encima llega
 * arrastrándose. Todo lo de esta fase vive por debajo de 1 y por encima de 0.4.
 */
export function amortiguacionRelativa({ stiffness, damping, mass }: Resorte): number {
  return damping / (2 * Math.sqrt(stiffness * mass));
}
