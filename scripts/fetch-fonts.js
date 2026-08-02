/**
 * Descarga las tipografías de DESIGN_SYSTEM.md y las deja autoalojadas en
 * src/assets/fonts/. Se ejecuta a mano una sola vez; los .woff2 se versionan.
 *
 *   node scripts/fetch-fonts.js
 *
 * Autoalojadas y no desde el CDN de Google por tres razones: la app no depende de
 * un tercero para renderizar, no se filtra la IP de cada visitante a Google, y no
 * hay una petición extra bloqueando el primer pintado.
 *
 * Se descarga solo el subconjunto `latin`: cubre todo el castellano y los nombres
 * de las 19 CCAA y 52 provincias. Archivo se pide como variable porque "Archivo
 * Expanded" no existe como familia estática: el ancho es un eje (wdth).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SALIDA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'fonts');

// Sin User-Agent moderno, Google devuelve TTF en vez de WOFF2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const FAMILIAS = [
  { archivo: 'archivo-variable', familia: 'Archivo:wdth,wght@62..125,100..900', subsets: ['latin'] },
  { archivo: 'inter-variable', familia: 'Inter:wght@100..900', subsets: ['latin'] },
  { archivo: 'plex-mono-400', familia: 'IBM+Plex+Mono:wght@400', subsets: ['latin'] },
  { archivo: 'plex-mono-500', familia: 'IBM+Plex+Mono:wght@500', subsets: ['latin'] },
];

/** Rangos que identifican cada subconjunto en el CSS de Google. */
const RANGOS = {
  latin: 'U+0000-00FF',
  'latin-ext': 'U+0100-02BA',
};

async function descargar({ archivo, familia, subsets }) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${familia}&display=swap`, {
      headers: { 'User-Agent': UA },
    })
  ).text();

  const bloques = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((m) => m[1]);
  const salidas = [];

  for (const subset of subsets) {
    const bloque = bloques.find((b) => b.includes(RANGOS[subset]));
    if (!bloque) throw new Error(`${familia}: no aparece el subconjunto ${subset}`);
    const url = bloque.match(/url\((https:[^)]+)\)\s*format\('woff2'\)/)?.[1];
    if (!url) throw new Error(`${familia}: el subconjunto ${subset} no viene en woff2`);

    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const nombre = subsets.length > 1 ? `${archivo}-${subset}.woff2` : `${archivo}.woff2`;
    writeFileSync(join(SALIDA, nombre), buf);
    salidas.push({ nombre, bytes: buf.length, rango: bloque.match(/unicode-range:\s*([^;]+);/)?.[1] });
  }
  return salidas;
}

const total = [];
mkdirSync(SALIDA, { recursive: true });
for (const f of FAMILIAS) total.push(...(await descargar(f)));

for (const { nombre, bytes } of total) {
  console.log(`  ${nombre.padEnd(32)} ${(bytes / 1024).toFixed(0).padStart(4)} KB`);
}
console.log(
  `\n  ${total.length} ficheros · ${(total.reduce((s, f) => s + f.bytes, 0) / 1024).toFixed(0)} KB en src/assets/fonts/`,
);
console.log('\n  unicode-range de cada uno (para las reglas @font-face de theme.css):');
for (const { nombre, rango } of total) console.log(`  ${nombre}\n    ${rango}`);
