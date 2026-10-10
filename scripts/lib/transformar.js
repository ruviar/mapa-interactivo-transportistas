/**
 * Funciones puras de normalización del fichero del Ministerio de Transportes
 * (personas jurídicas con autorización MDPE). Separadas del script para poder
 * probarlas (`npm test`).
 *
 * Regla de la casa: aquí se LIMPIA la forma, nunca el fondo. Los datos son
 * información pública reutilizada (Ley 37/2007) y no se pueden desnaturalizar:
 * se quitan espacios sobrantes y se recoloca un artículo pospuesto, pero no se
 * corrige, completa ni descarta nada de lo que el registro dice.
 */

/** Razón social tal cual, sin los espacios de relleno con que llega alguna fila. */
export function limpiarRazonSocial(nombre) {
  return String(nombre ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Artículos que el nomenclátor pospone entre paréntesis: "EJIDO (EL)",
 * "ALCUDIA (L')", "VALADOURO (O)". Castellano, catalán/valenciano, gallego y
 * el artículo salado balear. La lista es cerrada a propósito: un paréntesis
 * que no sea un artículo ("PALMAS DE GRAN CANARIA (LAS)" sí, "(CAPITAL)" no)
 * se deja donde está.
 */
const ARTICULOS = new Set([
  'EL', 'LA', 'LOS', 'LAS', "L'", 'ELS', 'LES', 'A', 'O', 'AS', 'OS', 'ES', 'SA', "S'", 'SES', 'NA',
]);

function anteponerArticulo(nombre) {
  const m = nombre.match(/^(.*\S)\s*\(([^()]+)\)$/);
  if (!m) return nombre;
  const articulo = m[2].trim().toUpperCase();
  if (!ARTICULOS.has(articulo)) return nombre;
  // El apóstrofo va pegado al nombre: "L'ALCUDIA", no "L' ALCUDIA".
  return articulo.endsWith("'") ? `${articulo}${m[1]}` : `${articulo} ${m[1]}`;
}

/**
 * Municipio legible: "EJIDO (EL)" -> "EL EJIDO". En los bilingües se aplica a
 * cada mitad: "ALQUERIAS DEL NIÑO PERDIDO/ALQUERIES (LES)" conserva las dos.
 * Es el mismo topónimo en su orden natural, no otro dato.
 */
export function normalizarMunicipio(municipio) {
  const limpio = String(municipio ?? '').replace(/\s+/g, ' ').trim();
  if (!limpio) return null;
  return limpio
    .split('/')
    .map((parte) => anteponerArticulo(parte.trim()))
    .join('/');
}

/**
 * Código postal, solo si es uno de verdad: cinco dígitos y prefijo de
 * provincia entre 01 y 52. El fichero trae huecos, "00000" y algún valor
 * truncado ("2770"); ninguno se adivina ni se rellena — se queda sin CP.
 */
export function normalizarCP(cp) {
  const t = String(cp ?? '').trim();
  if (!/^\d{5}$/.test(t)) return null;
  const prefijo = Number(t.slice(0, 2));
  return prefijo >= 1 && prefijo <= 52 ? t : null;
}

/**
 * Serial de fecha de Excel -> "AAAA-MM-DD".
 * El epoch de Excel es 1899-12-30 (el bug del año bisiesto de 1900 ya incluido).
 * Se lee el serial y no un `Date`: un `Date` pasa por la zona horaria de la
 * máquina que ejecuta el script y la fecha baila un día según dónde se genere.
 */
export function fechaDesdeSerial(serial) {
  if (typeof serial !== 'number' || !Number.isFinite(serial)) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial + 1e-6) * 86_400_000);
  if (Number.isNaN(d.getTime())) return null;
  const anio = d.getUTCFullYear();
  if (anio < 1980 || anio > 2100) return null;
  return d.toISOString().slice(0, 10);
}

/** Nº de vehículos: entero >= 0, o null si la celda no lo es. */
export function parseVehiculos(valor) {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0 ? valor : null;
}
