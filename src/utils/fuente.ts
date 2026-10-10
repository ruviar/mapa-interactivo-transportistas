/**
 * La cita de la fuente de los datos, en un solo sitio.
 *
 * Los datos son información del sector público reutilizada al amparo de la
 * Ley 37/2007, que pone condiciones: citar la fuente, indicar la fecha de la
 * última actualización, no desnaturalizar los datos y no dar a entender que
 * el organismo respalda esta web. Las dos primeras y la última se cumplen con
 * estos textos, que la herramienta y la landing muestran tal cual; la tercera
 * es cosa del script de datos (ver `scripts/procesar-registro-mdpe.js`).
 *
 * Todo sale de `src/data/fuente.json`, que genera `npm run data`: al cargar
 * un fichero nuevo del Ministerio la fecha y los totales se actualizan solos.
 */

import datos from '../data/fuente.json';
import type { Fuente } from '../types/company';

export const FUENTE: Fuente = datos;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2026-10-01" -> "1 de octubre de 2026". Sin `Date`: no hay zona horaria que la mueva. */
export function fechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[(mes ?? 1) - 1]} de ${anio}`;
}

/** "2026-10-01" -> "01/10/2026". */
export function fechaNumerica(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Cita corta, para la herramienta: fuente y fecha en una línea. */
export const CITA_CORTA = `Fuente: ${FUENTE.organismo} · datos a ${fechaNumerica(FUENTE.fecha_datos)}`;

/** Cita completa, para el pie de la landing. */
export const CITA_COMPLETA =
  `Fuente de los datos: ${FUENTE.organismo} — «${FUENTE.registro}», ` +
  `actualizados a ${fechaLarga(FUENTE.fecha_datos)}.`;

/** Que nadie lea esta web como un servicio del Ministerio. */
export const AVISO_INDEPENDENCIA =
  'Sitio de consulta independiente: no es un registro oficial ni cuenta con el respaldo del Ministerio.';
