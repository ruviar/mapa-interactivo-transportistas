/**
 * Carga de las capas geográficas y cálculos de encuadre.
 *
 * Los `.geojson` se importan como texto (`?raw`) porque Vite solo trata como
 * módulo JSON la extensión `.json`. Son 80 KB que se parsean una vez al arrancar:
 * a cambio, la silueta de España ya está en memoria cuando monta el mapa y no
 * hay un segundo estado de carga además del de `companies.json`.
 */

import ccaaRaw from '../data/ccaa.geojson?raw';
import type { Caja, ColeccionRegiones, FeatureRegion } from '../types/geo';

export const CCAA_GEO = JSON.parse(ccaaRaw) as ColeccionRegiones;

/**
 * Las provincias (137 KB) solo hacen falta al entrar en una comunidad, así que
 * viajan en su propio chunk y se piden una vez, en cuanto el mapa está montado.
 */
let provincias: Promise<ColeccionRegiones> | null = null;

export function cargarProvincias(): Promise<ColeccionRegiones> {
  provincias ??= import('../data/provincias.geojson?raw').then(
    (m) => JSON.parse(m.default) as ColeccionRegiones,
  );
  return provincias;
}

/** Leaflet quiere `[lat, lon]`; el GeoJSON viene en `[lon, lat]`. */
export type Limites = [[number, number], [number, number]];

function recorrer(feature: FeatureRegion, fn: (lon: number, lat: number) => void): void {
  const poligonos =
    feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates
      : [feature.geometry.coordinates];

  for (const poligono of poligonos) {
    for (const anillo of poligono) {
      for (const punto of anillo) fn(punto[0]!, punto[1]!);
    }
  }
}

export function cajaDe(feature: FeatureRegion): Caja {
  let lonMin = Infinity;
  let latMin = Infinity;
  let lonMax = -Infinity;
  let latMax = -Infinity;

  recorrer(feature, (lon, lat) => {
    if (lon < lonMin) lonMin = lon;
    if (lat < latMin) latMin = lat;
    if (lon > lonMax) lonMax = lon;
    if (lat > latMax) latMax = lat;
  });

  return [lonMin, latMin, lonMax, latMax];
}

/** Encuadre que cubre todas las regiones y, además, la cartela canaria. */
export function limitesDe(coleccion: ColeccionRegiones): Limites {
  const cajas = [...coleccion.features.map(cajaDe), coleccion.canarias.cartela];

  return [
    [Math.min(...cajas.map((c) => c[1])), Math.min(...cajas.map((c) => c[0]))],
    [Math.max(...cajas.map((c) => c[3])), Math.max(...cajas.map((c) => c[2]))],
  ];
}

/** Margen alrededor del encuadre: hasta dónde se puede arrastrar el mapa. */
export function ensanchar([[latMin, lonMin], [latMax, lonMax]]: Limites, grados: number): Limites {
  return [
    [latMin - grados, lonMin - grados],
    [latMax + grados, lonMax + grados],
  ];
}

export function limitesDeCaja([lonMin, latMin, lonMax, latMax]: Caja): Limites {
  return [
    [latMin, lonMin],
    [latMax, lonMax],
  ];
}

/** Anillos en el orden `[lat, lon]` que quiere Leaflet, para dibujar el borde. */
export function anillosDe(feature: FeatureRegion): [number, number][][][] {
  const poligonos =
    feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates
      : [feature.geometry.coordinates];

  return poligonos.map((poligono) =>
    poligono.map((anillo) => anillo.map((p) => [p[1]!, p[0]!] as [number, number])),
  );
}

/** Anchura en grados de longitud. Sirve para decidir si cabe el nombre en la etiqueta. */
export function anchuraDe(caja: Caja): number {
  return caja[2] - caja[0];
}
