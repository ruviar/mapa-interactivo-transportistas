/**
 * Fase 1 — Excel de SABI -> JSON estático.
 *
 *   node scripts/process-sabi-export.js
 *
 * Entradas
 *   data-source/dataset_empresas_transporte.xls   export de SABI (hoja "Resultados"),
 *                                                 filtrado aquí a CNAE 4941
 *   data-source/flota-verificada.json             consultas manuales al REAT
 *
 * Salidas
 *   public/data/companies.json   empresas agrupadas por código INE de provincia
 *   src/data/regiones.json       tablas de CCAA y provincias (nombres + jerarquía)
 *
 * companies.json va en public/ y no en src/: son 12 MB y Vite lo empotraría en el
 * bundle de JS. Desde public/ el navegador lo pide una vez, comprimido (~1 MB) y
 * cacheado. regiones.json sí se importa como módulo porque son 3 KB.
 *
 * El script es manual, no forma parte del build de Vercel: los datos se amplían
 * a mano cada cierto tiempo y el JSON generado se versiona en el repositorio.
 */

import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import * as XLSX from 'xlsx';

import { CCAA, PROVINCIAS, codigoProvincia } from './lib/ine.js';
import {
  detectarEstado,
  limpiarNombre,
  parseEmpleados,
  fechaDesdeSerial,
  construirFlota,
  fechaCorte,
  motivoNoMercancias,
  TERMINOS_NO_MERCANCIAS,
} from './lib/transformar.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA_XLS = join(RAIZ, 'data-source', 'dataset_empresas_transporte.xls');
const ENTRADA_REAT = join(RAIZ, 'data-source', 'flota-verificada.json');
const SALIDA_PUBLIC = join(RAIZ, 'public', 'data');
const SALIDA_SRC = join(RAIZ, 'src', 'data');

/** Años de antigüedad máxima del dato para entrar en el cómputo del filtro. */
const ANIOS_VIGENCIA = 3;

/**
 * CNAE que entran en el dataset.
 *
 * Solo 4941 (transporte de mercancías por carretera). El export original traía
 * también 4939 ("otro transporte terrestre de pasajeros n.c.o.p."): autobuses
 * discrecionales, autocares y ambulancias. No son transportistas de mercancías,
 * así que se descartan aquí y no en la interfaz — no deben aparecer en ninguna
 * vista ni en ningún recuento.
 */
const CNAE_INCLUIDOS = new Set(['4941']);

/**
 * Dentro del propio 4941 quedan empresas que tampoco son transporte de
 * mercancías: ambulancias, autocares y transporte sanitario cuya clasificación
 * en SABI está mal de origen. Se detectan por la razón social y se descartan
 * aquí, con el mismo criterio que el 4939 — fuera del dataset, no ocultas en la
 * interfaz, para que no aparezcan en ningún recuento ni en ninguna vista.
 *
 * Los términos y el porqué de los que se descartaron están en
 * `TERMINOS_NO_MERCANCIAS` (scripts/lib/transformar.js).
 */
const CRITERIO_EXCLUSION =
  'Empresas con CNAE 4941 cuya razón social las identifica como transporte de ' +
  'viajeros o sanitario (clasificación errónea en origen). Coincidencia de palabra ' +
  'completa, sin tildes y en mayúsculas, contra los términos de "terminos".';

/** CNAE de la fila, normalizado a los 4 dígitos de la clase CNAE-2009. */
function claseCnae(valor) {
  const t = String(valor ?? '').replace(/\D/g, '');
  return t.slice(0, 4);
}

/** Columnas del export de SABI. Los saltos de línea son parte del encabezado. */
const COL = {
  nombre: 'Nombre',
  nif: 'Código NIF',
  localidad: 'Localidad',
  provincia: 'Provincia',
  cp: 'Código postal',
  cnae: 'Código primario CNAE 2009',
  anio: 'Ultimo año disponible',
  empleados: 'Número empleados\nÚlt. año disp.',
};

const nf = (n) => n.toLocaleString('es-ES');

function leerVerificadas() {
  const bruto = JSON.parse(readFileSync(ENTRADA_REAT, 'utf8'));
  const porNif = new Map();
  for (const r of bruto.registros ?? []) {
    const nif = String(r.nif ?? '').toUpperCase().replace(/\s/g, '');
    if (!nif) throw new Error(`flota-verificada.json: registro sin NIF: ${JSON.stringify(r)}`);
    if (!Number.isInteger(r.vehiculos) || r.vehiculos < 0) {
      throw new Error(`flota-verificada.json: "vehiculos" debe ser un entero >= 0 en ${nif}`);
    }
    if (porNif.has(nif)) throw new Error(`flota-verificada.json: NIF duplicado ${nif}`);
    porNif.set(nif, r);
  }
  return porNif;
}

function main() {
  const t0 = Date.now();
  const corte = fechaCorte(new Date(), ANIOS_VIGENCIA);
  const verificadas = leerVerificadas();

  console.log(`Leyendo ${ENTRADA_XLS} (${(statSync(ENTRADA_XLS).size / 1e6).toFixed(1)} MB)...`);
  // XLSX.readFile no funciona en ESM sin set_fs; leemos el búfer nosotros.
  const libro = XLSX.read(readFileSync(ENTRADA_XLS), {
    type: 'buffer',
    cellDates: false,
    cellStyles: false,
  });
  if (!libro.SheetNames.includes('Resultados')) {
    throw new Error(`El Excel no tiene hoja "Resultados". Hojas: ${libro.SheetNames.join(', ')}`);
  }
  const filas = XLSX.utils.sheet_to_json(libro.Sheets['Resultados'], {
    defval: null,
    blankrows: false,
  });

  const faltan = Object.values(COL).filter((c) => !(c in filas[0]));
  if (faltan.length) {
    throw new Error(
      `Faltan columnas en el Excel: ${JSON.stringify(faltan)}\n` +
        `Columnas encontradas: ${JSON.stringify(Object.keys(filas[0]))}`,
    );
  }

  /** cod_prov -> empresas */
  const empresas = {};
  const nifsVistos = new Set();
  const provinciasSinMapear = new Map();
  /** CNAE descartado -> nº de filas, para dejar constancia en el log. */
  const descartadasPorCnae = new Map();
  /** Término de exclusión -> nº de filas descartadas por él. */
  const excluidasPorTermino = new Map();
  const resumen = {
    total: 0,
    verificada: 0,
    estimada: 0,
    sin_dato: 0,
    estimada_caducada: 0,
    extinguidas: 0,
    duplicados_nif: 0,
    descartadas_cnae: 0,
    excluidas_patron: 0,
  };

  for (const fila of filas) {
    // El filtro de CNAE va antes que nada: una fila descartada no reserva su NIF
    // ni cuenta como provincia sin mapear.
    const cnae = claseCnae(fila[COL.cnae]);
    if (!CNAE_INCLUIDOS.has(cnae)) {
      resumen.descartadas_cnae++;
      const clave = cnae || '(sin CNAE)';
      descartadasPorCnae.set(clave, (descartadasPorCnae.get(clave) ?? 0) + 1);
      continue;
    }

    // Misma lógica que el CNAE: la fila excluida no reserva su NIF ni cuenta
    // como provincia sin mapear, porque no llega a formar parte del dataset.
    const motivo = motivoNoMercancias(fila[COL.nombre]);
    if (motivo) {
      resumen.excluidas_patron++;
      excluidasPorTermino.set(motivo, (excluidasPorTermino.get(motivo) ?? 0) + 1);
      continue;
    }

    const nombreProv = fila[COL.provincia];
    const codProv = codigoProvincia(nombreProv);
    if (!codProv) {
      provinciasSinMapear.set(nombreProv, (provinciasSinMapear.get(nombreProv) ?? 0) + 1);
      continue;
    }

    const nif = String(fila[COL.nif] ?? '').toUpperCase().replace(/\s/g, '');
    if (nifsVistos.has(nif)) {
      resumen.duplicados_nif++;
      continue;
    }
    nifsVistos.add(nif);

    const nombreBruto = fila[COL.nombre];
    const estado = detectarEstado(nombreBruto);
    const empleados = parseEmpleados(fila[COL.empleados]);
    const fechaEmpleados = fechaDesdeSerial(fila[COL.anio]);

    const flota = construirFlota({
      verificada: verificadas.get(nif),
      empleados,
      fechaEmpleados,
      corte,
    });

    const empresa = {
      nombre: limpiarNombre(nombreBruto),
      nif,
      localidad: fila[COL.localidad] ?? null,
      cp: fila[COL.cp] ? String(fila[COL.cp]).padStart(5, '0') : null,
      provincia: codProv,
      ccaa: PROVINCIAS[codProv].ccaa,
      cnae,
      estado,
      empleados: empleados === null ? null : { valor: empleados, fecha: fechaEmpleados },
      flota,
    };

    (empresas[codProv] ??= []).push(empresa);

    resumen.total++;
    resumen[flota.tipo]++;
    if (flota.tipo === 'estimada' && !flota.vigente) resumen.estimada_caducada++;
    if (estado !== 'activa') resumen.extinguidas++;
  }

  if (provinciasSinMapear.size) {
    throw new Error(
      'Provincias del Excel que no cruzan con el INE (añádelas a scripts/lib/ine.js):\n' +
        [...provinciasSinMapear].map(([n, c]) => `  "${n}" (${c} filas)`).join('\n'),
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

  const salida = {
    meta: {
      generado: new Date().toISOString(),
      fuente: 'SABI (Bureau van Dijk), CNAE 4941 — transporte de mercancías por carretera',
      cnae_incluidos: [...CNAE_INCLUIDOS],
      // Queda documentado para quien audite el dataset y eche en falta filas del
      // export: por qué no están y con qué criterio exacto se fueron.
      exclusiones_patron: {
        criterio: CRITERIO_EXCLUSION,
        terminos: TERMINOS_NO_MERCANCIAS.map(([nombre]) => nombre),
        no_aplicados: {
          urbano:
            'en castellano es apellido frecuente y reparto urbano de mercancías; solo se aplica la forma catalana "urbans"',
          taxi: '"taxi industrial" y "taxi portes" son mercancías por carretera',
        },
        filas: resumen.excluidas_patron,
        por_termino: Object.fromEntries([...excluidasPorTermino].sort((a, b) => b[1] - a[1])),
      },
      fuente_flota_verificada: 'REAT — Ministerio de Transportes, consulta manual por NIF',
      filas_excel: filas.length,
      anios_vigencia: ANIOS_VIGENCIA,
      fecha_corte_vigencia: corte,
      resumen,
      aviso:
        'El nº de empleados es una aproximación al tamaño de flota, no un dato de vehículos. ' +
        'Solo flota.tipo = "verificada" procede del REAT.',
    },
    empresas,
  };

  mkdirSync(SALIDA_PUBLIC, { recursive: true });
  mkdirSync(SALIDA_SRC, { recursive: true });
  const json = JSON.stringify(salida);
  writeFileSync(join(SALIDA_PUBLIC, 'companies.json'), json);
  writeFileSync(join(SALIDA_SRC, 'regiones.json'), JSON.stringify(regiones, null, 2));

  const mb = (b) => (b / 1e6).toFixed(2) + ' MB';
  const descartes = [...descartadasPorCnae]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}: ${nf(n)}`)
    .join(', ');
  const exclusiones = [...excluidasPorTermino]
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}: ${nf(n)}`)
    .join(', ');

  console.log(`
  Filas del Excel        ${nf(filas.length)}
  Descartadas por CNAE   ${nf(resumen.descartadas_cnae)}   (${descartes || 'ninguna'})
  Excluidas por patrón   ${nf(resumen.excluidas_patron)}   (${exclusiones || 'ninguna'})
  Empresas exportadas    ${nf(resumen.total)}
  ├─ flota verificada    ${nf(resumen.verificada)}   (REAT)
  ├─ flota estimada      ${nf(resumen.estimada)}   (empleados SABI)
  │  └─ dato caducado    ${nf(resumen.estimada_caducada)}   (anterior a ${corte}, fuera del cómputo)
  └─ sin dato            ${nf(resumen.sin_dato)}
  Estado != activa       ${nf(resumen.extinguidas)}
  NIF duplicados         ${nf(resumen.duplicados_nif)}
  Provincias con datos   ${provinciasUsadas.length} / 52

  public/data/companies.json   ${mb(json.length)}  (${mb(gzipSync(json).length)} comprimido)
  src/data/regiones.json       ${provinciasUsadas.length} provincias, ${regiones.ccaa.length} CCAA
  Hecho en ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  if (resumen.verificada === 0) {
    console.log(`
  Aviso: no hay ninguna flota verificada todavía. Añade los registros del REAT
  en data-source/flota-verificada.json y vuelve a ejecutar "npm run data".`);
  }
}

main();
