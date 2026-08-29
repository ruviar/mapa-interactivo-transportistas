/**
 * Recuento de empresas por región para la coropleta.
 *
 * "Cumplir el filtro" no es solo superar el umbral de tamaño: se exige además
 * que la empresa esté activa y que su dato de flota siga vigente. Una empresa
 * extinguida en 2019 o con la última plantilla publicada en 2021 no se cuenta,
 * aunque su cifra sea alta — si no, el mapa pintaría oscuras las provincias con
 * más histórico en lugar de las que hoy tienen más transportistas.
 *
 * Ese mismo criterio deja fuera a la mayoría del export (SABI publica plantilla
 * de ~2.000 de 45.261), así que el recuento se acompaña siempre de la cobertura
 * de dato y nunca se presentan mezclados: son dos cosas distintas.
 */

import type { CodCCAA, CodProvincia, Dataset, Empresa, Regiones } from '../types/company';

/**
 * Umbral de arranque: ≥4 empleados como proxy del "≥5 camiones" del cliente
 * (CLAUDE_BRIEF). Desde la Fase 4 el slider lo mueve; esto es solo el inicio.
 */
export const UMBRAL_INICIAL = 4;

export function cumpleUmbral(empresa: Empresa, umbral: number): boolean {
  const { estado, flota } = empresa;
  return estado === 'activa' && flota.vigente && flota.valor !== null && flota.valor >= umbral;
}

/**
 * Filtro por la fuente del dato de tamaño: todo, solo lo verificado en el REAT
 * (vehículos de verdad) o solo lo estimado por plantilla de SABI. Existe porque
 * `flota.valor` mezcla unidades —vehículos y empleados— y quien necesita
 * comparar flotas reales tiene que poder quedarse solo con el REAT.
 */
export type FiltroFlota = 'todas' | 'verificada' | 'estimada';

export const FLOTA_INICIAL: FiltroFlota = 'todas';

export function cumpleFlota(empresa: Empresa, filtro: FiltroFlota): boolean {
  return filtro === 'todas' || empresa.flota.tipo === filtro;
}

export interface Conteo {
  /** Empresas que cumplen el umbral. Es lo que colorea la coropleta. */
  cumplen: number;
  /** Activas con tamaño vigente: numerador de la cobertura. */
  conDato: number;
  /**
   * Activas del export de SABI: denominador **provisional** de la cobertura.
   * Al integrar INE DIRCE pasa a ser el total oficial por provincia y CNAE,
   * porque el propio export de SABI también puede estar incompleto.
   */
  activas: number;
  /** Todas las filas del export, extinguidas incluidas. */
  total: number;
}

export interface Recuentos {
  provincias: Record<CodProvincia, Conteo>;
  ccaa: Record<CodCCAA, Conteo>;
  nacional: Conteo;
}

/** Cobertura de dato en tanto por uno. `null` si no hay ninguna empresa activa. */
export function cobertura(conteo: Conteo): number | null {
  return conteo.activas === 0 ? null : conteo.conDato / conteo.activas;
}

const vacio = (): Conteo => ({ cumplen: 0, conDato: 0, activas: 0, total: 0 });

/**
 * Un solo recorrido sobre las ~45.000 empresas. Las regiones sin ninguna
 * empresa arrancan en 0 y no en `undefined`: la coropleta necesita distinguir
 * "cero" de "sin dato" y son estados distintos en la leyenda.
 *
 * El filtro de fuente solo toca `cumplen` (lo que colorea la coropleta y llena
 * el listado). `conDato` y `activas` se quedan como están: la cobertura mide
 * cuánto dato hay, no cuánto pasa el filtro, y no debe moverse con él.
 */
export function contar(
  dataset: Dataset,
  regiones: Regiones,
  umbral: number,
  filtroFlota: FiltroFlota = 'todas',
): Recuentos {
  const provincias: Record<CodProvincia, Conteo> = {};
  const ccaa: Record<CodCCAA, Conteo> = {};
  const nacional = vacio();
  for (const p of regiones.provincias) provincias[p.cod] = vacio();
  for (const c of regiones.ccaa) ccaa[c.cod] = vacio();

  for (const empresas of Object.values(dataset.empresas)) {
    for (const empresa of empresas) {
      const destinos = [provincias[empresa.provincia], ccaa[empresa.ccaa], nacional];

      const activa = empresa.estado === 'activa';
      const conDato = activa && empresa.flota.vigente && empresa.flota.valor !== null;
      const cumple = conDato && cumpleUmbral(empresa, umbral) && cumpleFlota(empresa, filtroFlota);

      for (const destino of destinos) {
        if (!destino) continue;
        destino.total++;
        if (activa) destino.activas++;
        if (conDato) destino.conDato++;
        if (cumple) destino.cumplen++;
      }
    }
  }

  return { provincias, ccaa, nacional };
}

/** Proyección `código -> nº que cumple`, que es lo único que necesita el mapa. */
export function cumplenPorRegion(conteos: Record<string, Conteo>): Record<string, number> {
  return Object.fromEntries(Object.entries(conteos).map(([cod, c]) => [cod, c.cumplen]));
}

/**
 * Filtros del LISTADO (provincia o comunidad), no del mapa. `umbralMin` y
 * `filtroFlota` son los mismos que colorean la coropleta —se pasan tal cual,
 * sin duplicar el control—; `umbralMax` e `incluirSinDato` son exclusivos del
 * listado: ampliar lo que se ve en una lista no debería resignificar de qué
 * habla la coropleta.
 */
export interface FiltrosListado {
  umbralMin: number;
  /** `null` = sin techo. */
  umbralMax: number | null;
  filtroFlota: FiltroFlota;
  /**
   * Empresas activas sin dato de tamaño vigente. Fuera de cualquier umbral —
   * no hay valor con el que compararlas—: se incluyen entrando por esta
   * puerta o no se incluyen en absoluto, nunca a medias.
   */
  incluirSinDato: boolean;
}

export const FILTROS_LISTADO_INICIALES: Pick<FiltrosListado, 'umbralMax' | 'incluirSinDato'> = {
  umbralMax: null,
  incluirSinDato: false,
};

export function cumpleFiltrosListado(empresa: Empresa, filtros: FiltrosListado): boolean {
  if (empresa.estado !== 'activa') return false;

  const sinDatoVigente = empresa.flota.valor === null || !empresa.flota.vigente;
  if (sinDatoVigente) return filtros.incluirSinDato;

  return (
    cumpleUmbral(empresa, filtros.umbralMin) &&
    (filtros.umbralMax === null || empresa.flota.valor! <= filtros.umbralMax) &&
    cumpleFlota(empresa, filtros.filtroFlota)
  );
}
