/**
 * Funciones puras de normalización del export de SABI.
 * Separadas del script para poder probarlas (`npm test`).
 */

/** Marcas de fin de actividad que SABI mete dentro de la razón social. */
const MARCAS_ESTADO = [
  { estado: 'extinguida', re: /\(\s*EXTINGUIDA\s*\)/i },
  { estado: 'liquidacion', re: /\(?\s*EN\s+LIQUIDACION\s*\)?/i },
  { estado: 'concurso', re: /\(?\s*EN\s+CONCURSO(\s+DE\s+ACREEDORES)?\s*\)?/i },
];

/** Valores no numéricos que SABI escribe en las columnas financieras. */
const SIN_VALOR = new Set(['n.d.', 'n.a.', 'financial export limit reached', '']);

/**
 * Términos de la razón social que delatan viajeros o transporte sanitario
 * dentro del CNAE 4941, mal codificados en origen por SABI.
 *
 * La lista es corta a propósito: solo entran términos que no significan otra
 * cosa en el sector de mercancías. Dos candidatos evidentes se quedaron fuera
 * tras revisar las coincidencias reales del export, porque descartaban
 * transportistas legítimos:
 *
 *   - "urbano": es apellido común (TRANSPORTES PULIDO Y URBANO, URBANO ALONSO
 *     E HIJOS) y además describe reparto urbano de mercancías (EXPRESSO ENVIOS
 *     URBANOS). Ninguna de sus 18 coincidencias era de viajeros.
 *   - "taxi": "taxi industrial" y "taxi portes" son mercancías por carretera en
 *     la propia jerga del sector (TAXIS INDUSTRIALES DE LA MONTAÑA, TAXI-FLET
 *     SERVICES, TAXI PORTES). 10 de sus 14 coincidencias eran transportistas.
 *
 * Si se amplía la lista, comprobar antes las coincidencias una a una: un término
 * de más borra empresas buenas del dataset y no deja rastro en la interfaz.
 */
export const TERMINOS_NO_MERCANCIAS = [
  ['ambulancia', /\bAMBULANCIAS?\b/],
  ['sanitario', /\bSANITARI[AO]S?\b/],
  // "AUTOCARS" es el plural catalán y aparece en el export (RIPOLLET AUTOCARS).
  // El límite final deja fuera a AUTOCARGO SL, que sí es mercancías.
  ['autocar', /\bAUTOCAR(?:ES|S)?\b/],
  ['autobus', /\bAUTOBUS(?:ES)?\b/],
  ['viajeros', /\bVIAJEROS\b/],
  ['escolar', /\bESCOLARES?\b/],
  // Solo la forma catalana: "URBANS" identifica el transporte urbano de
  // viajeros sin ambigüedad (1 coincidencia, EMT Palma), mientras que el
  // castellano "URBANO/URBANOS" es apellido y reparto de mercancías (ver abajo).
  ['transporte_urbano', /\bURBANS\b/],
];

/**
 * Término por el que la razón social se descarta como no-mercancías, o `null`
 * si no coincide con ninguno. Se compara sin tildes y en mayúsculas, contra
 * palabras completas: "AUTOBUSES OÑA" coincide, "URBANO" dentro de
 * "INTERURBANO" no coincidiría.
 */
export function motivoNoMercancias(nombre) {
  const n = String(nombre ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
  return TERMINOS_NO_MERCANCIAS.find(([, re]) => re.test(n))?.[0] ?? null;
}

/**
 * "activa" | "extinguida" | "liquidacion" | "concurso".
 * Se queda con la primera marca encontrada; el orden refleja lo definitivo del estado.
 */
export function detectarEstado(nombre) {
  for (const { estado, re } of MARCAS_ESTADO) {
    if (re.test(nombre ?? '')) return estado;
  }
  return 'activa';
}

/** Razón social sin la marca de estado ni la puntuación que deja al salir. */
export function limpiarNombre(nombre) {
  let n = String(nombre ?? '');
  for (const { re } of MARCAS_ESTADO) n = n.replace(re, ' ');
  return n.replace(/\s{2,}/g, ' ').replace(/[\s.,-]+$/, '').trim();
}

/**
 * Número de empleados. Devuelve null para "n.d.", para
 * "Financial Export limit reached" y para cualquier cosa no numérica.
 */
export function parseEmpleados(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  const t = String(valor).trim();
  if (SIN_VALOR.has(t.toLowerCase())) return null;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Serial de fecha de Excel -> "AAAA-MM".
 * El epoch de Excel es 1899-12-30 (el bug del año bisiesto de 1900 ya incluido).
 */
export function fechaDesdeSerial(serial) {
  if (typeof serial !== 'number' || !Number.isFinite(serial)) return null;
  const ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const anio = d.getUTCFullYear();
  if (anio < 1990 || anio > 2100) return null;
  return `${anio}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "AAAA-MM" o "AAAA" -> comparable como texto. null si no es válido. */
export function normalizarFecha(fecha) {
  if (!fecha) return null;
  const m = String(fecha).trim().match(/^(\d{4})(?:[-/](\d{1,2}))?/);
  if (!m) return null;
  const anio = Number(m[1]);
  if (anio < 1990 || anio > 2100) return null;
  return m[2] ? `${anio}-${String(Number(m[2])).padStart(2, '0')}` : `${anio}-12`;
}

/**
 * ¿El dato es lo bastante reciente para entrar en el cómputo del filtro?
 * `corte` es una fecha "AAAA-MM"; la comparación de texto funciona con ese formato.
 */
export function esVigente(fecha, corte) {
  const f = normalizarFecha(fecha);
  return f !== null && f >= corte;
}

/**
 * Construye el bloque `flota` de una empresa.
 *
 * - verificada: consulta manual al REAT, se muestra sin matices.
 * - estimada: empleados de SABI como proxy; se marca siempre como estimación.
 * - sin_dato: ni verificación ni empleados; la empresa sigue en el listado
 *   pero queda fuera de cualquier filtro por tamaño de flota.
 */
export function construirFlota({ verificada, empleados, fechaEmpleados, corte }) {
  if (verificada) {
    const fecha = normalizarFecha(verificada.fecha_consulta);
    return {
      tipo: 'verificada',
      valor: verificada.vehiculos,
      fuente: 'REAT',
      fecha_dato: fecha,
      vigente: esVigente(fecha, corte),
    };
  }
  if (empleados !== null && empleados !== undefined) {
    const fecha = normalizarFecha(fechaEmpleados);
    return {
      tipo: 'estimada',
      valor: empleados,
      fuente: 'empleados_SABI',
      fecha_dato: fecha,
      vigente: esVigente(fecha, corte),
    };
  }
  return { tipo: 'sin_dato', valor: null, fuente: null, fecha_dato: null, vigente: false };
}

/** Fecha de corte "AAAA-MM" a N años vista de `hoy`. */
export function fechaCorte(hoy, anios) {
  const d = new Date(hoy);
  const y = d.getUTCFullYear() - anios;
  return `${y}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
