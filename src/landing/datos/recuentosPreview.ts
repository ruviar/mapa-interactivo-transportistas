/**
 * Empresas del registro por comunidad (sin filtro de vehículos), congeladas en
 * build para el preview de la landing: dan a la coropleta sus colores reales
 * sin arrastrar los 4,5 MB de `companies.json`. Son decorativos —van detrás de
 * un blur— pero no pueden mentir: `recuentosPreview.test.ts` los coteja contra
 * el dataset real y falla si `npm run data` los deja desfasados, enseñando en
 * el propio fallo los valores que hay que pegar aquí.
 */
export const RECUENTOS_PREVIEW_CCAA: Record<string, number> = {
  '01': 4868,
  '02': 1106,
  '03': 534,
  '04': 613,
  '05': 68,
  '06': 413,
  '07': 2078,
  '08': 2249,
  '09': 3868,
  '10': 2778,
  '11': 847,
  '12': 2156,
  '13': 2132,
  '14': 1304,
  '15': 526,
  '16': 1032,
  '17': 226,
  '18': 20,
  '19': 13,
};
