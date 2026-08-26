/**
 * Recuentos por comunidad con el umbral inicial (≥4 empleados), congelados en
 * build para el preview de la landing: dan a la coropleta sus colores reales
 * sin arrastrar los 11 MB de `companies.json`. Son decorativos —van detrás de
 * un blur— pero no pueden mentir: `recuentosPreview.test.ts` los coteja contra
 * el dataset real y falla si `npm run data` los deja desfasados.
 */
export const RECUENTOS_PREVIEW_CCAA: Record<string, number> = {
  '01': 288,
  '02': 80,
  '03': 35,
  '04': 19,
  '05': 30,
  '06': 26,
  '07': 106,
  '08': 89,
  '09': 303,
  '10': 250,
  '11': 33,
  '12': 100,
  '13': 197,
  '14': 96,
  '15': 45,
  '16': 98,
  '17': 18,
};

/** El umbral con el que se congelaron: el inicial de la herramienta. */
export const UMBRAL_PREVIEW = 4;
