/**
 * Formas de datos que genera `scripts/process-sabi-export.js`.
 * No editar a mano los JSON de `src/data/`: se regeneran con `npm run data`.
 */

/** Código INE de provincia, "01".."52". */
export type CodProvincia = string;

/** Código INE de comunidad autónoma, "01".."19". */
export type CodCCAA = string;

/**
 * De dónde sale el tamaño de flota de una empresa. Nunca se mezclan:
 * la interfaz tiene que distinguir siempre un dato verificado de una estimación.
 */
export type TipoFlota = 'verificada' | 'estimada' | 'sin_dato';

export type FuenteFlota = 'REAT' | 'empleados_SABI' | null;

/** Estado mercantil, extraído de las marcas que SABI mete en la razón social. */
export type EstadoEmpresa = 'activa' | 'extinguida' | 'liquidacion' | 'concurso';

export interface Flota {
  tipo: TipoFlota;
  /** Vehículos (verificada) o empleados (estimada). null si no hay dato. */
  valor: number | null;
  fuente: FuenteFlota;
  /** "AAAA-MM" del dato de origen. */
  fecha_dato: string | null;
  /**
   * El dato es lo bastante reciente (ver `meta.fecha_corte_vigencia`).
   * Solo las empresas con `vigente` entran en el cómputo del filtro por tamaño.
   */
  vigente: boolean;
}

export interface Empleados {
  valor: number;
  /** "AAAA-MM" del último ejercicio disponible en SABI. */
  fecha: string | null;
}

export interface Empresa {
  nombre: string;
  nif: string;
  localidad: string | null;
  cp: string | null;
  provincia: CodProvincia;
  ccaa: CodCCAA;
  /**
   * CNAE 2009. Siempre "4941" (transporte de mercancías por carretera): el
   * script descarta cualquier otra clase al procesar el export.
   */
  cnae: string;
  estado: EstadoEmpresa;
  /** Plantilla tal como la publica SABI. Se muestra en la ficha aunque esté caducada. */
  empleados: Empleados | null;
  flota: Flota;
}

export interface ResumenDataset {
  total: number;
  verificada: number;
  estimada: number;
  sin_dato: number;
  /** Estimaciones anteriores a la fecha de corte: se muestran pero no se cuentan. */
  estimada_caducada: number;
  /** Empresas con estado distinto de "activa". */
  extinguidas: number;
  duplicados_nif: number;
  /** Filas del Excel fuera de `meta.cnae_incluidos` (4939 y demás). */
  descartadas_cnae: number;
}

export interface MetaDataset {
  generado: string;
  fuente: string;
  fuente_flota_verificada: string;
  /** Clases CNAE que entran en el dataset. */
  cnae_incluidos: string[];
  /** Filas del export antes de filtrar por CNAE. */
  filas_excel: number;
  anios_vigencia: number;
  /** "AAAA-MM". Un dato anterior a esta fecha no entra en el filtro. */
  fecha_corte_vigencia: string;
  resumen: ResumenDataset;
  aviso: string;
}

/** Contenido de `src/data/companies.json`. Empresas agrupadas por código INE de provincia. */
export interface Dataset {
  meta: MetaDataset;
  empresas: Record<CodProvincia, Empresa[]>;
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
