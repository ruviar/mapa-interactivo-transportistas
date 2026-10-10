/**
 * Fichero del Ministerio de Transportes -> JSON estático.
 *
 *   npm run data
 *
 * Entrada
 *   data-source/registro-mdpe.xlsx   "Personas jurídicas con autorización MDPE",
 *                                    facilitado por el Ministerio de Transportes
 *                                    y Movilidad Sostenible (hoja "Datos")
 *
 * Salidas
 *   public/data/companies.json   empresas agrupadas por código INE de provincia
 *   src/data/regiones.json       tablas de CCAA y provincias (nombres + jerarquía)
 *   src/data/fuente.json         cita de la fuente, fecha de los datos y totales
 *
 * companies.json va en public/ y no en src/: son ~5 MB y Vite lo empotraría en
 * el bundle de JS. Desde public/ el navegador lo pide una vez, comprimido y
 * cacheado. Los otros dos sí se importan como módulo porque pesan unos KB — y
 * `fuente.json` hace falta en la landing, que no descarga el dataset.
 *
 * Reutilización (Ley 37/2007): los datos no se desnaturalizan. El script no
 * descarta, corrige ni completa ninguna fila; solo limpia la forma (ver
 * scripts/lib/transformar.js) y falla en alto si una fila no se puede leer,
 * en vez de dejarla caer en silencio.
 *
 * El script es manual, no forma parte del build de Vercel: cuando el
 * Ministerio facilite un fichero nuevo se sustituye la entrada, se ejecuta y
 * los JSON generados se versionan en el repositorio.
 */

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import * as XLSX from 'xlsx';

import { CCAA, PROVINCIAS, codigoProvincia } from './lib/ine.js';
import {
  limpiarRazonSocial,
  normalizarMunicipio,
  normalizarCP,
  fechaDesdeSerial,
  parseVehiculos,
} from './lib/transformar.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = join(RAIZ, 'data-source', 'registro-mdpe.xlsx');
const SALIDA_PUBLIC = join(RAIZ, 'public', 'data');
const SALIDA_SRC = join(RAIZ, 'src', 'data');

const HOJA = 'Datos';

/** Cita de la fuente. Es la que se muestra en la web: cambiarla aquí la cambia en todas partes. */
const FUENTE = {
  organismo: 'Ministerio de Transportes y Movilidad Sostenible',
  registro: 'Personas jurídicas con autorización MDPE',
};

/** Cabeceras del fichero, en su orden. Si el Ministerio cambia el formato, esto lo dice. */
const COLUMNAS = [
  'RAZÓN SOCIAL',
  'MUNICIPIO',
  'PROVINCIA',
  'CP',
  'CLASE',
  'AUTORIZACIÓN',
  'ESTADO',
  'FECHA ALTA O ACTUALIZACIÓN',
  'VEHÍCULOS',
];

/** Lo que este script sabe representar. Otra clase u otro estado es un fichero distinto. */
const CLASE_ESPERADA = 'MDPE';
const ESTADO_ESPERADO = 'ALTA';

const nf = (n) => n.toLocaleString('es-ES');

function main() {
  const t0 = Date.now();

  console.log(`Leyendo ${ENTRADA} (${(statSync(ENTRADA).size / 1e6).toFixed(1)} MB)...`);
  // XLSX.readFile no funciona en ESM sin set_fs; leemos el búfer nosotros.
  // `cellDates: false`: las fechas se leen como serial (ver `fechaDesdeSerial`).
  const libro = XLSX.read(readFileSync(ENTRADA), { type: 'buffer', cellDates: false });
  if (!libro.SheetNames.includes(HOJA)) {
    throw new Error(`El Excel no tiene hoja "${HOJA}". Hojas: ${libro.SheetNames.join(', ')}`);
  }
  const matriz = XLSX.utils.sheet_to_json(libro.Sheets[HOJA], {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  });

  // La cabecera no está en la primera fila: antes va el título del listado.
  const iCabecera = matriz.findIndex((f) => f[0] === COLUMNAS[0]);
  if (iCabecera === -1) throw new Error(`No se encuentra la fila de cabecera ("${COLUMNAS[0]}").`);
  const cabecera = matriz[iCabecera].slice(0, COLUMNAS.length);
  if (JSON.stringify(cabecera) !== JSON.stringify(COLUMNAS)) {
    throw new Error(
      `Las columnas del Excel han cambiado.\n  Esperadas:   ${JSON.stringify(COLUMNAS)}\n  Encontradas: ${JSON.stringify(cabecera)}`,
    );
  }
  const filas = matriz.slice(iCabecera + 1);

  /** cod_prov -> empresas */
  const empresas = {};
  const autorizaciones = new Set();
  const errores = [];
  const resumen = { total: 0, vehiculos: 0, sin_cp: 0 };
  let fechaDatos = '';

  filas.forEach((fila, i) => {
    const [razon, municipio, provincia, cp, clase, autorizacion, estado, serial, veh] = fila;
    const dondeEsta = `fila ${iCabecera + i + 2}`;
    const error = (motivo) => errores.push(`${dondeEsta}: ${motivo} — ${JSON.stringify(fila)}`);

    const nombre = limpiarRazonSocial(razon);
    const codProv = codigoProvincia(provincia);
    const aut = String(autorizacion ?? '').trim();
    const fecha = fechaDesdeSerial(serial);
    const vehiculos = parseVehiculos(veh);

    if (!nombre) return error('sin razón social');
    if (!codProv) return error(`provincia "${provincia}" no cruza con el INE (scripts/lib/ine.js)`);
    if (clase !== CLASE_ESPERADA) return error(`clase "${clase}" inesperada`);
    if (estado !== ESTADO_ESPERADO) return error(`estado "${estado}" inesperado`);
    if (!aut) return error('sin número de autorización');
    if (autorizaciones.has(aut)) return error(`autorización ${aut} repetida`);
    if (!fecha) return error('fecha ilegible');
    if (vehiculos === null) return error('nº de vehículos ilegible');
    autorizaciones.add(aut);

    const cpLimpio = normalizarCP(cp);

    (empresas[codProv] ??= []).push({
      nombre,
      localidad: normalizarMunicipio(municipio),
      cp: cpLimpio,
      provincia: codProv,
      ccaa: PROVINCIAS[codProv].ccaa,
      autorizacion: aut,
      fecha,
      vehiculos,
    });

    resumen.total++;
    resumen.vehiculos += vehiculos;
    if (!cpLimpio) resumen.sin_cp++;
    if (fecha > fechaDatos) fechaDatos = fecha;
  });

  if (errores.length) {
    throw new Error(
      `${errores.length} fila(s) no se pueden procesar. No se descarta ninguna en silencio:\n` +
        errores.slice(0, 20).join('\n') +
        (errores.length > 20 ? `\n… y ${errores.length - 20} más` : ''),
    );
  }

  // Orden alfabético dentro de cada provincia: es como se muestra el listado.
  const colador = new Intl.Collator('es', { sensitivity: 'base' });
  for (const lista of Object.values(empresas)) {
    lista.sort((a, b) => colador.compare(a.nombre, b.nombre));
  }

  const provinciasUsadas = Object.keys(empresas).sort();
  const regiones = {
    ccaa: Object.entries(CCAA).map(([cod, nombre]) => ({
      cod,
      nombre,
      provincias: provinciasUsadas.filter((p) => PROVINCIAS[p].ccaa === cod),
    })),
    provincias: provinciasUsadas.map((cod) => ({
      cod,
      nombre: PROVINCIAS[cod].nombre,
      ccaa: PROVINCIAS[cod].ccaa,
      total: empresas[cod].length,
    })),
  };

  const fuente = {
    ...FUENTE,
    // La fecha más reciente de alta o actualización que trae el fichero: es la
    // fecha hasta la que los datos están al día, y la que la web declara.
    fecha_datos: fechaDatos,
    empresas: resumen.total,
    vehiculos: resumen.vehiculos,
  };

  const salida = {
    meta: {
      generado: new Date().toISOString(),
      fuente: `${FUENTE.organismo} — ${FUENTE.registro}`,
      fecha_datos: fechaDatos,
      filas_excel: filas.length,
      resumen,
    },
    empresas,
  };

  mkdirSync(SALIDA_PUBLIC, { recursive: true });
  mkdirSync(SALIDA_SRC, { recursive: true });
  const json = JSON.stringify(salida);
  writeFileSync(join(SALIDA_PUBLIC, 'companies.json'), json);
  writeFileSync(join(SALIDA_SRC, 'regiones.json'), JSON.stringify(regiones, null, 2) + '\n');
  writeFileSync(join(SALIDA_SRC, 'fuente.json'), JSON.stringify(fuente, null, 2) + '\n');

  const mb = (b) => (b / 1e6).toFixed(2) + ' MB';
  console.log(`
  Filas del Excel        ${nf(filas.length)}
  Empresas exportadas    ${nf(resumen.total)}   (ninguna descartada)
  Vehículos autorizados  ${nf(resumen.vehiculos)}
  Sin código postal      ${nf(resumen.sin_cp)}   (hueco o valor no válido en origen)
  Datos al día hasta     ${fechaDatos}
  Provincias con datos   ${provinciasUsadas.length} / 52

  public/data/companies.json   ${mb(json.length)}  (${mb(gzipSync(json).length)} comprimido)
  src/data/regiones.json       ${provinciasUsadas.length} provincias, ${regiones.ccaa.length} CCAA
  src/data/fuente.json         cita y fecha de los datos
  Hecho en ${((Date.now() - t0) / 1000).toFixed(1)}s

  Recuerda: si cambian los recuentos por comunidad, actualiza
  src/landing/datos/recuentosPreview.ts (npm test te lo dirá).`);
}

main();
