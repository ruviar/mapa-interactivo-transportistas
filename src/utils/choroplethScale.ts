/**
 * Escala coroplética de 5 pasos, base -> verde autovía.
 *
 * Los cortes son cuantiles sobre los valores presentes, no un reparto lineal:
 * el reparto de empresas de transporte por España es muy desigual (Cataluña
 * multiplica por 18 a La Rioja) y una escala lineal dejaría 15 regiones en el
 * primer tramo. Se recalculan cada vez que cambia el filtro.
 */

/** 0 = ninguna empresa; 1..5 = tramos crecientes. */
export type PasoCoropleta = 0 | 1 | 2 | 3 | 4 | 5;

/** Los 4 puntos de corte que separan los tramos 1..5. */
export type CortesCoropleta = [number, number, number, number];

/** Nombre de la variable CSS de `theme.css` que da el relleno de cada paso. */
export const VAR_PASO: Record<PasoCoropleta, string> = {
  0: '--color-mapa-0',
  1: '--color-mapa-1',
  2: '--color-mapa-2',
  3: '--color-mapa-3',
  4: '--color-mapa-4',
  5: '--color-mapa-5',
};

/** Los tramos oscuros necesitan la cifra en claro encima. */
export const VAR_CIFRA: Record<PasoCoropleta, string> = {
  0: '--color-asfalto',
  1: '--color-ink',
  2: '--color-ink',
  3: '--color-ink',
  4: '--color-base',
  5: '--color-base',
};

export interface Paleta {
  relleno: Record<PasoCoropleta, string>;
  cifra: Record<PasoCoropleta, string>;
  /** Trazo de los límites: tinta, rebajada con opacidad por el propio Leaflet. */
  borde: string;
  /** El mar: fondo del mapa y cerco de los rótulos que caen sobre el agua. */
  fondo: string;
  /** Ámbar: hover y selección. */
  atencion: string;
}

/**
 * Leaflet escribe el color en el atributo `fill` del `<path>`, y ahí `var(--x)`
 * no se resuelve. Así que se leen los valores calculados del `:root` una vez y
 * se pasan ya resueltos: los hex siguen viviendo solo en `theme.css`.
 * Debe llamarse con el CSS ya aplicado (en render o después, nunca en el módulo).
 */
export function leerPaleta(): Paleta {
  const estilo = getComputedStyle(document.documentElement);
  const valor = (nombre: string) => estilo.getPropertyValue(nombre).trim();
  const mapear = (vars: Record<PasoCoropleta, string>) =>
    Object.fromEntries(
      Object.entries(vars).map(([paso, nombre]) => [paso, valor(nombre)]),
    ) as Record<PasoCoropleta, string>;

  return {
    relleno: mapear(VAR_PASO),
    cifra: mapear(VAR_CIFRA),
    borde: valor('--color-ink'),
    fondo: valor('--color-mar'),
    atencion: valor('--color-atencion'),
  };
}

export function calcularCortes(valores: readonly number[]): CortesCoropleta {
  const positivos = valores.filter((v) => v > 0).sort((a, b) => a - b);
  if (positivos.length === 0) return [1, 2, 3, 4];

  const cuantil = (p: number) => positivos[Math.min(positivos.length - 1, Math.floor(p * positivos.length))]!;
  const cortes: number[] = [cuantil(0.2), cuantil(0.4), cuantil(0.6), cuantil(0.8)];

  // Con pocos valores distintos los cuantiles se solapan; se separan para que
  // cada tramo de la leyenda represente un rango real.
  for (let i = 1; i < cortes.length; i++) {
    if (cortes[i]! <= cortes[i - 1]!) cortes[i] = cortes[i - 1]! + 1;
  }
  return cortes as CortesCoropleta;
}

export function pasoDe(valor: number, cortes: CortesCoropleta): PasoCoropleta {
  if (valor <= 0) return 0;
  if (valor < cortes[0]) return 1;
  if (valor < cortes[1]) return 2;
  if (valor < cortes[2]) return 3;
  if (valor < cortes[3]) return 4;
  return 5;
}

/** Etiquetas de la leyenda: "0", "1–36", …, "349+". */
export function etiquetasCortes(cortes: CortesCoropleta): string[] {
  const rango = (desde: number, hasta: number) =>
    hasta <= desde ? String(desde) : `${desde}–${hasta}`;
  return [
    '0',
    rango(1, cortes[0] - 1),
    rango(cortes[0], cortes[1] - 1),
    rango(cortes[1], cortes[2] - 1),
    rango(cortes[2], cortes[3] - 1),
    `${cortes[3]}+`,
  ];
}
