/**
 * Formas de datos que genera `scripts/procesar-registro-mdpe.js` a partir del
 * fichero del Ministerio de Transportes y Movilidad Sostenible.
 * No editar a mano los JSON de `src/data/`: se regeneran con `npm run data`.
 */

/** Código INE de provincia, "01".."52". */
export type CodProvincia = string;

/** Código INE de comunidad autónoma, "01".."19". */
export type CodCCAA = string;

/**
 * Una persona jurídica con autorización MDPE en alta. Todos los campos salen
 * del registro del Ministerio; `provincia` y `ccaa` son su provincia traducida
 * a códigos INE para cruzar con el mapa.
 */
export interface Empresa {
  /** Razón social. */
  nombre: string;
  /** Municipio, con el artículo en su sitio ("EL EJIDO", no "EJIDO (EL)"). */
  localidad: string | null;
  /** `null` cuando el registro no trae un código postal válido. */
  cp: string | null;
  provincia: CodProvincia;
  ccaa: CodCCAA;
  /** Número de autorización. Único en el registro: es la identidad de la fila. */
  autorizacion: string;
  /** "AAAA-MM-DD" del alta de la autorización o de su última actualización. */
  fecha: string;
  /** Vehículos adscritos a la autorización. Dato del registro, no una estimación. */
  vehiculos: number;
}

export interface ResumenDataset {
  total: number;
  vehiculos: number;
  /** Empresas cuyo código postal falta o no es válido en origen. */
  sin_cp: number;
}

export interface MetaDataset {
  generado: string;
  fuente: string;
  /** "AAAA-MM-DD": fecha hasta la que el fichero está al día. */
  fecha_datos: string;
  filas_excel: number;
  resumen: ResumenDataset;
}

/** Contenido de `public/data/companies.json`. Empresas agrupadas por código INE de provincia. */
export interface Dataset {
  meta: MetaDataset;
  empresas: Record<CodProvincia, Empresa[]>;
}

/**
 * Contenido de `src/data/fuente.json`: la cita que la reutilización de datos
 * públicos (Ley 37/2007) obliga a mostrar, más los totales del fichero.
 */
export interface Fuente {
  organismo: string;
  registro: string;
  /** "AAAA-MM-DD". */
  fecha_datos: string;
  empresas: number;
  vehiculos: number;
}

export interface Provincia {
  cod: CodProvincia;
  nombre: string;
  ccaa: CodCCAA;
  /** Empresas del dataset en esta provincia, sin filtrar. */
  total: number;
}

export interface ComunidadAutonoma {
  cod: CodCCAA;
  nombre: string;
  provincias: CodProvincia[];
}

/** Contenido de `src/data/regiones.json`. */
export interface Regiones {
  ccaa: ComunidadAutonoma[];
  provincias: Provincia[];
}
