/**
 * Formas de `src/data/ccaa.geojson` y `src/data/provincias.geojson`,
 * tal como los genera `scripts/process-geojson.js`.
 */

import type { MultiPolygon, Polygon } from 'geojson';

import type { CodCCAA } from './company';

/** `[lon, lat]` — punto interior donde se ancla la etiqueta de la región. */
export type Ancla = [number, number];

/** `[lonMin, latMin, lonMax, latMax]`. */
export type Caja = [number, number, number, number];

export interface PropiedadesRegion {
  /** Código INE de CCAA o de provincia según el fichero. */
  cod: string;
  nombre: string;
  /** Nombre para rotular el mapa cuando el oficial no cabe (`Navarra`, `Madrid`…). */
  corto?: string;
  /** Solo en provincias.geojson: CCAA a la que pertenece. */
  ccaa?: CodCCAA;
  ancla: Ancla;
  /** Canarias: la geometría está trasladada, no es su posición real. */
  desplazada?: true;
}

export interface FeatureRegion {
  type: 'Feature';
  properties: PropiedadesRegion;
  geometry: Polygon | MultiPolygon;
}

export interface ColeccionRegiones {
  type: 'FeatureCollection';
  attribution: string;
  /** Cartela del inset canario: rectángulo que se dibuja alrededor. */
  canarias: { cartela: Caja; desplazamiento: [number, number] };
  features: FeatureRegion[];
}
