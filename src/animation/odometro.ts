/**
 * Aritmética del odómetro. Sin React y sin DOM: la mecánica de un
 * cuentakilómetros se puede razonar con números, y depurarla dentro de un
 * componente que además está animándose es la peor forma de hacerlo.
 */

/** Una columna del contador: o rueda un dígito, o es un carácter que no se mueve. */
export type Columna = { tipo: 'digito'; peso: number } | { tipo: 'fijo'; texto: string };

/** Alturas apiladas en cada tambor: 0..9 más un 0 de cierre para que la vuelta no salte. */
export const ALTURAS_TAMBOR = 11;

const nf = new Intl.NumberFormat('es-ES');

export function formatear(valor: number): string {
  return nf.format(Math.max(0, Math.trunc(valor)));
}

/**
 * Columnas de izquierda a derecha. `peso` es la potencia de diez que rueda en
 * esa columna: 1 las unidades, 10 las decenas, y así.
 */
export function columnasDe(valor: number): Columna[] {
  const texto = formatear(valor);
  let restantes = 0;
  for (const caracter of texto) if (caracter >= '0' && caracter <= '9') restantes += 1;

  return [...texto].map((caracter) => {
    if (caracter < '0' || caracter > '9') return { tipo: 'fijo', texto: caracter };
    restantes -= 1;
    return { tipo: 'digito', peso: 10 ** restantes };
  });
}

/**
 * Parte de la posición que asoma por la ventana del tambor: 0 ≤ x < 10.
 *
 * El resto de JavaScript conserva el signo (`-0.3 % 10` es `-0.3`), y una
 * posición negativa aparece en cuanto el muelle se pasa de frenada.
 */
export function enVentana(posicion: number): number {
  return ((posicion % 10) + 10) % 10;
}

/** El dígito que le toca a una columna para un valor dado. */
export function digitoDe(valor: number, peso: number): number {
  return Math.floor(Math.abs(Math.trunc(valor)) / peso) % 10;
}

/**
 * Paso más corto entre dos dígitos contando que la rueda cierra: de 9 a 0 se va
 * hacia delante. El empate (cinco pasos por cada lado) se resuelve hacia
 * delante siempre, para que dos columnas con el mismo salto no giren en
 * sentidos contrarios y parezca una avería.
 */
export function pasoCorto(desde: number, hasta: number): number {
  const adelante = ((hasta - desde) % 10 + 10) % 10;
  return adelante > 5 ? adelante - 10 : adelante;
}
