/**
 * Fase 2 — prepara la cartografía para Leaflet.
 *
 *   node scripts/process-geojson.js
 *
 * Entradas   data-source/geo/{ccaa,provincias}-raw.geojson
 *            (codeforgermany/click_that_hood, licencia MIT — Code for America)
 *
 * Salidas    src/data/ccaa.geojson
 *            src/data/provincias.geojson
 *
 * Qué hace, además de simplificar:
 *  - Valida que cada polígono lleve su código INE y que estén las 19 CCAA y las 52 provincias.
 *  - Normaliza los nombres a los oficiales de scripts/lib/ine.js: los del origen vienen
 *    sin tildes o anglicanizados ("Castilla-Leon", "Andalucia", "Pais Vasco").
 *  - Desplaza Canarias al Atlántico frente a Portugal, como en la cartografía habitual
 *    española. Sin esto el mapa nacional sale casi todo océano.
 *  - Guarda un ancla de etiqueta por región para colocar la cifra encima.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { CCAA, CCAA_CORTO, PROVINCIAS, PROVINCIA_CORTO } from './lib/ine.js';
import { simplificarGeometria, bbox, desplazar, anclaEtiqueta } from './lib/geometria.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = join(RAIZ, 'data-source', 'geo');
const SALIDA = join(RAIZ, 'src', 'data');

const ATRIBUCION = 'Límites: click_that_hood (Code for America), licencia MIT';

/** Tolerancias en grados. Las provincias se ven con zoom, así que se simplifican menos. */
const AJUSTES = {
  ccaa: { tolerancia: 0.006, areaMinima: 0.002 },
  provincias: { tolerancia: 0.004, areaMinima: 0.0012 },
};

/**
 * Canarias está a ~1.000 km al suroeste. Se traslada a un hueco del Atlántico
 * que no pisa territorio peninsular (el borde oeste de Huelva queda en lon -7,4).
 * Las coordenadas de Canarias dejan de ser reales: es una cartela, no una posición.
 */
const DESTINO_CANARIAS = { lon: -13.0, lat: 35.3 };

function leer(nombre) {
  return JSON.parse(readFileSync(join(ENTRADA, `${nombre}-raw.geojson`), 'utf8'));
}

function procesar(nombreFichero, { clave, tabla, nombreDe, cortoDe, ccaaDe, ajustes }) {
  const origen = leer(nombreFichero);
  const vistos = new Set();
  const features = [];

  for (const f of origen.features) {
    const cod = f.properties?.[clave];
    if (!cod || !tabla[cod]) {
      throw new Error(
        `${nombreFichero}: feature con ${clave} desconocido (${JSON.stringify(f.properties)})`,
      );
    }
    if (vistos.has(cod)) throw new Error(`${nombreFichero}: ${clave} duplicado ${cod}`);
    vistos.add(cod);

    const geometria = simplificarGeometria(f.geometry, ajustes);
    if (!geometria) throw new Error(`${nombreFichero}: ${cod} se quedó sin geometría al simplificar`);

    const corto = cortoDe?.(cod);
    // La CCAA sale de la tabla INE, NUNCA del `cod_ccaa` del fichero de origen:
    // click_that_hood numera las comunidades con otro criterio (allí Illes Balears
    // es la 03 y no la 04) y 31 de las 52 provincias caerían en la comunidad
    // equivocada al navegar.
    const ccaa = ccaaDe?.(cod);
    features.push({
      type: 'Feature',
      properties: { cod, nombre: nombreDe(cod), ...(corto ? { corto } : {}), ...(ccaa ? { ccaa } : {}) },
      geometry: geometria,
    });
  }

  const faltan = Object.keys(tabla).filter((c) => !vistos.has(c));
  if (faltan.length) throw new Error(`${nombreFichero}: faltan ${clave} ${faltan.join(', ')}`);

  return features;
}

/** Mueve las features canarias al hueco atlántico y devuelve el rectángulo de la cartela. */
function trasladarCanarias(features, esCanaria) {
  const canarias = features.filter(esCanaria);
  if (!canarias.length) throw new Error('No se encontró Canarias');

  const cajas = canarias.map((f) => bbox(f.geometry));
  const origen = [
    Math.min(...cajas.map((c) => c[0])),
    Math.min(...cajas.map((c) => c[1])),
    Math.max(...cajas.map((c) => c[2])),
    Math.max(...cajas.map((c) => c[3])),
  ];
  const dLon = DESTINO_CANARIAS.lon - origen[0];
  const dLat = DESTINO_CANARIAS.lat - origen[1];

  for (const f of canarias) {
    f.geometry = desplazar(f.geometry, dLon, dLat);
    f.properties.desplazada = true;
  }

  const margen = 0.35;
  return {
    origen,
    desplazamiento: [Number(dLon.toFixed(5)), Number(dLat.toFixed(5))],
    cartela: [
      Number((origen[0] + dLon - margen).toFixed(5)),
      Number((origen[1] + dLat - margen).toFixed(5)),
      Number((origen[2] + dLon + margen).toFixed(5)),
      Number((origen[3] + dLat + margen).toFixed(5)),
    ],
  };
}

function main() {
  const ccaa = procesar('ccaa', {
    clave: 'cod_ccaa',
    tabla: CCAA,
    nombreDe: (cod) => CCAA[cod],
    cortoDe: (cod) => CCAA_CORTO[cod],
    ajustes: AJUSTES.ccaa,
  });
  const provincias = procesar('provincias', {
    clave: 'cod_prov',
    tabla: PROVINCIAS,
    nombreDe: (cod) => PROVINCIAS[cod].nombre,
    cortoDe: (cod) => PROVINCIA_CORTO[cod],
    ccaaDe: (cod) => PROVINCIAS[cod].ccaa,
    ajustes: AJUSTES.provincias,
  });

  // Ninguna comunidad puede quedarse sin provincias: sin esto, una errata en la
  // tabla INE se traduce en una CCAA que al pulsarla no enseña nada.
  const sinProvincias = Object.keys(CCAA).filter(
    (c) => !provincias.some((f) => f.properties.ccaa === c),
  );
  if (sinProvincias.length) throw new Error(`CCAA sin provincias: ${sinProvincias.join(', ')}`);

  const inset = trasladarCanarias(ccaa, (f) => f.properties.cod === '05');
  trasladarCanarias(provincias, (f) => f.properties.cod === '35' || f.properties.cod === '38');

  for (const f of [...ccaa, ...provincias]) {
    f.properties.ancla = anclaEtiqueta(f.geometry);
  }

  mkdirSync(SALIDA, { recursive: true });
  const escribir = (nombre, features, extra = {}) => {
    const fc = {
      type: 'FeatureCollection',
      attribution: ATRIBUCION,
      ...extra,
      features,
    };
    const json = JSON.stringify(fc);
    writeFileSync(join(SALIDA, `${nombre}.geojson`), json);
    return json.length;
  };

  const bytesCcaa = escribir('ccaa', ccaa, {
    canarias: { cartela: inset.cartela, desplazamiento: inset.desplazamiento },
  });
  const bytesProv = escribir('provincias', provincias, {
    canarias: { cartela: inset.cartela, desplazamiento: inset.desplazamiento },
  });

  const puntos = (fs) => {
    let n = 0;
    for (const f of fs) {
      const polis = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      for (const p of polis) for (const anillo of p) n += anillo.length;
    }
    return n;
  };
  const kb = (b) => (b / 1024).toFixed(0) + ' KB';

  console.log(`
  ccaa.geojson         ${ccaa.length} regiones · ${puntos(ccaa)} vértices · ${kb(bytesCcaa)}
  provincias.geojson   ${provincias.length} regiones · ${puntos(provincias)} vértices · ${kb(bytesProv)}

  Canarias desplazada  ${inset.desplazamiento[0]}° lon, ${inset.desplazamiento[1]}° lat
  Cartela              [${inset.cartela.join(', ')}]
  ${ATRIBUCION}`);
}

main();
